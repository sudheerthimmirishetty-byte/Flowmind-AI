/**
 * controllers/auth.controller.js
 *
 * Authentication Controller.
 *
 * Responsibilities:
 *   1. Receive the Express request
 *   2. Extract validated input from req.body / req.user
 *   3. Call the auth service
 *   4. Return the formatted JSON response
 *
 * Controllers contain ZERO business logic and ZERO Supabase queries.
 * All processing happens inside authService.
 *
 * asyncHandler wraps every method so that rejected promises are
 * automatically forwarded to the global error handler.
 */

"use strict";

const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const MSG = require("../constants/messages");
const HTTP = require("../constants/httpStatus");

/**
 * POST /api/v1/auth/login
 *
 * Authenticate a user with email + password.
 * Returns a signed JWT and the sanitised user object.
 *
 * The frontend stores { token, ...user } in localStorage as 'onboarding_user'
 * and reads user.role to redirect:
 *   hr       → /dashboard
 *   employee → /employee-dashboard
 *
 * Expected request body:
 *   { email: string, password: string }
 *
 * Success response:
 *   {
 *     success: true,
 *     message: "Login successful",
 *     data: {
 *       token: "eyJ...",
 *       user: {
 *         id, email, full_name, role, company_id,
 *         phone, profile_image, status, created_at, companies
 *       }
 *     }
 *   }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { token, user } = await authService.login(email, password);

  return sendSuccess(res, MSG.AUTH.LOGIN_SUCCESS, { token, user });
});

/**
 * POST /api/v1/auth/logout
 *
 * Accepts the logout request for audit logging.
 * The actual JWT removal is performed by the frontend.
 *
 * Requires: authenticate middleware (req.user must be set)
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  return sendSuccess(res, MSG.AUTH.LOGOUT_SUCCESS);
});

/**
 * GET /api/v1/auth/me
 *
 * Returns the full profile of the currently authenticated user,
 * including their company details.
 *
 * Requires: authenticate middleware (req.user must be set)
 *
 * Success response:
 *   {
 *     success: true,
 *     message: "User retrieved successfully",
 *     data: { user: { ...profile, companies: { ... } } }
 *   }
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return sendSuccess(res, MSG.USER.FETCHED, { user });
});

/**
 * PUT /api/v1/auth/me
 *
 * Update the current user's profile.
 *
 * Expected request body (all optional, at least one required):
 *   { full_name?: string, phone?: string, profile_image?: string }
 *
 * Requires: authenticate middleware
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone, profile_image } = req.body;

  const user = await authService.updateProfile(req.user.id, {
    full_name,
    phone,
    profile_image,
  });

  return sendSuccess(res, MSG.AUTH.PROFILE_UPDATED, { user });
});

/**
 * PUT /api/v1/auth/change-password
 *
 * Change the authenticated user's password.
 *
 * Expected request body:
 *   { current_password: string, new_password: string }
 *
 * Requires: authenticate middleware
 */
const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  await authService.changePassword(req.user.id, current_password, new_password);

  return sendSuccess(res, MSG.AUTH.PASSWORD_CHANGED);
});

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};
