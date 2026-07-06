/**
 * @file userService.js
 * @description Business logic and Supabase queries for the User module.
 *              Password hashing is performed here using bcrypt.
 *              Authentication (login/logout/JWT) lives in the Auth module.
 * @module services/userService
 */

"use strict";

const bcrypt   = require("bcryptjs");
const { supabase } = require("../supabase/client");

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABLE         = "users";
const SALT_ROUNDS   = 12;
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 10;

/**
 * Columns returned in list responses.
 * password_hash is NEVER included in any list or detail response.
 */
const SAFE_COLUMNS =
  "id, company_id, full_name, email, role, phone, profile_image, status, created_at, updated_at";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const buildRange = (page, limit) => {
  const from = (page - 1) * limit;
  return { from, to: from + limit - 1 };
};

// ─── Service Methods ───────────────────────────────────────────────────────────

/**
 * Creates a new user account.
 * Hashes the password before persisting.
 * @param {object} payload - Validated request body including plain-text password
 * @returns {Promise<object>} Created user (without password_hash)
 * @throws {Error} 409 if email already registered
 */
const createUser = async (payload) => {
  const {
    company_id,
    full_name,
    email,
    password,
    role,
    phone         = null,
    profile_image = null,
    status        = "active",
  } = payload;

  // Duplicate email guard
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const error = new Error("A user with this email address already exists");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        company_id,
        full_name,
        email,
        password_hash,
        role,
        phone,
        profile_image,
        status,
      },
    ])
    .select(SAFE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates a user's non-sensitive fields.
 * Password changes are handled by the Auth module.
 * @param {string} id      - User UUID
 * @param {object} payload - Fields to update
 * @returns {Promise<object>} Updated user (without password_hash)
 */
const updateUser = async (id, payload) => {
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("id, email")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Duplicate email guard (only when email is being changed)
  if (payload.email && payload.email !== existing.email) {
    const { data: duplicate } = await supabase
      .from(TABLE)
      .select("id")
      .eq("email", payload.email)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      const error = new Error("A user with this email address already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  // Build updates from allowed fields
  const updates = {};
  const allowedFields = ["company_id", "full_name", "email", "role", "phone", "profile_image", "status"];
  allowedFields.forEach((field) => {
    if (field in payload) updates[field] = payload[field];
  });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select(SAFE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates a user's role.
 * @param {string} id   - User UUID
 * @param {string} role - New role value
 * @returns {Promise<object>} Updated user
 */
const updateUserRole = async (id, role) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(SAFE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates a user's status (active / inactive / suspended).
 * @param {string} id     - User UUID
 * @param {string} status - New status value
 * @returns {Promise<object>} Updated user
 */
const updateUserStatus = async (id, status) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(SAFE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard-deletes a user by ID.
 * @param {string} id - User UUID
 */
const deleteUser = async (id) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves a single user by UUID (without password_hash).
 * @param {string} id - User UUID
 * @returns {Promise<object>} User record
 */
const getUserById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SAFE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const notFound = new Error("User not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a paginated, filterable, searchable list of users.
 *
 * Supported filters: search, status, role, company_id, sortBy, sortOrder, page, limit
 *
 * @param {object} filters - Query parameters
 * @returns {Promise<{ data, total, page, limit, totalPages }>}
 */
const getUsers = async (filters = {}) => {
  const {
    search     = null,
    status     = null,
    role       = null,
    company_id = null,
    sortBy     = "created_at",
    sortOrder  = "desc",
    page       = DEFAULT_PAGE,
    limit      = DEFAULT_LIMIT,
  } = filters;

  const { from, to } = buildRange(page, limit);

  let query = supabase
    .from(TABLE)
    .select(SAFE_COLUMNS, { count: "exact" })
    .range(from, to)
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (status)     query = query.eq("status", status);
  if (role)       query = query.eq("role", role);
  if (company_id) query = query.eq("company_id", company_id);

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    total     : count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserById,
  getUsers,
};
