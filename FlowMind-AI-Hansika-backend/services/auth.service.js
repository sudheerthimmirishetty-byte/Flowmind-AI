/**
 * services/auth.service.js
 *
 * Authentication Business Logic + Supabase Queries.
 *
 * This service is the ONLY place that:
 *   - Queries the `users` table for authentication
 *   - Compares password hashes with bcryptjs
 *   - Signs and returns JWT tokens
 *   - Updates user profiles and passwords
 *
 * Controllers call this service; they never query Supabase directly.
 *
 * All Supabase errors are converted to AppError instances so that the
 * global error handler formats them correctly.
 */

"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { supabase } = require("../supabase/client");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const MSG = require("../constants/messages");
const HTTP = require("../constants/httpStatus");

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Sign a JWT for a user.
 *
 * @param {object} user - User record from Supabase
 * @returns {string} Signed JWT
 */
const signToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

/**
 * Strip sensitive fields before returning user to client.
 *
 * @param {object} user - Full user row from Supabase
 * @returns {object} Safe user object (no password_hash)
 */
const sanitiseUser = (user) => {
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Login Service
 *
 * 1. Look up user by email (case-insensitive via Supabase ilike)
 * 2. Verify account is active
 * 3. Compare submitted password against stored hash
 * 4. Sign and return a JWT + sanitised user object
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
const login = async (email, password) => {
  // 1. Fetch user by email (lower-case match)
  const { data: user, error } = await supabase
    .from("users")
    .select(
      "id, company_id, full_name, email, password_hash, role, phone, profile_image, status, created_at"
    )
    .ilike("email", email.trim())
    .single();

  if (error || !user) {
    // Generic message — don't leak whether the email exists
    throw new AppError(MSG.AUTH.INVALID_CREDENTIALS, HTTP.UNAUTHORIZED);
  }

  // 2. Check account status
  if (user.status !== "active") {
    throw new AppError(MSG.AUTH.ACCOUNT_INACTIVE, HTTP.UNAUTHORIZED);
  }

  // 3. Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError(MSG.AUTH.INVALID_CREDENTIALS, HTTP.UNAUTHORIZED);
  }

  // 4. Sign token
  const token = signToken(user);

  logger.info("User logged in", { userId: user.id, role: user.role });

  return {
    token,
    user: sanitiseUser(user),
  };
};

/**
 * Logout Service
 *
 * The JWT is stateless so the actual invalidation happens on the client
 * (the frontend removes the token from localStorage/sessionStorage).
 *
 * This service exists for audit logging purposes.
 *
 * @param {string} userId
 */
const logout = async (userId) => {
  logger.info("User logged out", { userId });
  // Future: add token to a blocklist (Redis) if needed
};

/**
 * Get Profile Service
 *
 * Returns the full profile of a user including their company info.
 *
 * @param {string} userId
 * @returns {object} User profile
 */
const getProfile = async (userId) => {
  const { data: user, error } = await supabase
    .from("users")
    .select(
      `
      id,
      full_name,
      email,
      role,
      phone,
      profile_image,
      status,
      created_at,
      updated_at,
      company_id,
      companies (
        id,
        company_name,
        industry,
        logo_url,
        website
      )
    `
    )
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new AppError(MSG.USER.NOT_FOUND, HTTP.NOT_FOUND);
  }

  return user;
};

/**
 * Update Profile Service
 *
 * Updates name, phone, and/or profile_image for the authenticated user.
 *
 * @param {string} userId
 * @param {{ full_name?: string, phone?: string, profile_image?: string }} updates
 * @returns {object} Updated user record
 */
const updateProfile = async (userId, updates) => {
  // Remove undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined && v !== null)
  );

  if (Object.keys(cleanUpdates).length === 0) {
    throw new AppError("No valid fields provided for update", HTTP.BAD_REQUEST);
  }

  cleanUpdates.updated_at = new Date().toISOString();

  const { data: user, error } = await supabase
    .from("users")
    .update(cleanUpdates)
    .eq("id", userId)
    .select("id, full_name, email, role, phone, profile_image, status, updated_at")
    .single();

  if (error) {
    logger.error("Profile update failed", { userId, error: error.message });
    throw new AppError(MSG.GENERAL.INTERNAL_ERROR, HTTP.INTERNAL_SERVER_ERROR);
  }

  logger.info("User profile updated", { userId });
  return user;
};

/**
 * Change Password Service
 *
 * 1. Fetch the user's current hash
 * 2. Verify current_password against it
 * 3. Hash and save new_password
 *
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // 1. Fetch current hash
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", userId)
    .single();

  if (fetchError || !user) {
    throw new AppError(MSG.USER.NOT_FOUND, HTTP.NOT_FOUND);
  }

  // 2. Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", HTTP.BAD_REQUEST);
  }

  // 3. Hash new password
  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

  // 4. Update
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    logger.error("Password change failed", { userId, error: updateError.message });
    throw new AppError(MSG.GENERAL.INTERNAL_ERROR, HTTP.INTERNAL_SERVER_ERROR);
  }

  logger.info("Password changed successfully", { userId });
};

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};
