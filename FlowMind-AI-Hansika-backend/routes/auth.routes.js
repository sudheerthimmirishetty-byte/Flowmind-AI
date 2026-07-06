/**
 * routes/auth.routes.js
 *
 * Authentication Routes.
 *
 * Mounted at: /api/v1/auth
 *
 * Endpoints:
 *   POST   /api/v1/auth/login         — Login with email + password
 *   POST   /api/v1/auth/logout        — Invalidate session (client-side)
 *   GET    /api/v1/auth/me            — Get current authenticated user profile
 *   PUT    /api/v1/auth/me            — Update current user profile
 *   PUT    /api/v1/auth/change-password — Change own password
 *
 * Routes contain ZERO business logic.
 * All logic lives in authController → authService → Supabase.
 */

"use strict";

const express = require("express");
const router = express.Router();

// Middleware
const { authenticate } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

// Controller
const authController = require("../controllers/auth.controller");

// Validators
const {
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} = require("../validators/auth.validators");

// ─── Public Routes (no authentication required) ───────────────────────────────

/**
 * POST /api/v1/auth/login
 * Authenticate a user with email and password.
 * Returns JWT token and user object.
 *
 * Body: { email: string, password: string }
 * Response: { success: true, data: { token: string, user: object } }
 */
router.post("/login", loginValidator, validate, authController.login);

// ─── Protected Routes (authentication required) ───────────────────────────────

/**
 * POST /api/v1/auth/logout
 * Client-side token invalidation notice.
 * The actual token removal happens on the frontend (localStorage clear).
 * The backend can use this for audit logging.
 */
router.post("/logout", authenticate, authController.logout);

/**
 * GET /api/v1/auth/me
 * Returns the full profile of the currently authenticated user.
 *
 * Response: { success: true, data: { user: object } }
 */
router.get("/me", authenticate, authController.getProfile);

/**
 * PUT /api/v1/auth/me
 * Update the current user's profile (name, phone, profile_image).
 *
 * Body: { full_name?: string, phone?: string, profile_image?: string }
 */
router.put("/me", authenticate, updateProfileValidator, validate, authController.updateProfile);

/**
 * PUT /api/v1/auth/change-password
 * Change the current user's password.
 *
 * Body: { current_password: string, new_password: string }
 */
router.put(
  "/change-password",
  authenticate,
  changePasswordValidator,
  validate,
  authController.changePassword
);

module.exports = router;
