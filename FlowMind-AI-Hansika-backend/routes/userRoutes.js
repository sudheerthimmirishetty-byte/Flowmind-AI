/**
 * @file userRoutes.js
 * @description Express router for the User module.
 *
 * Route Map:
 *   GET     /api/users            → getUsers            (paginated, filterable)
 *   GET     /api/users/:id        → getUserById
 *   POST    /api/users            → createUser          (includes password hashing)
 *   PUT     /api/users/:id        → updateUser
 *   PATCH   /api/users/:id/role   → updateUserRole
 *   PATCH   /api/users/:id/status → updateUserStatus
 *   DELETE  /api/users/:id        → deleteUser
 *
 * NOTE: Login, logout, and token refresh are handled by the Auth module.
 *       Password reset/change is also handled by the Auth module.
 *
 * @module routes/userRoutes
 */

"use strict";

const express        = require("express");
const router         = express.Router();
const userController = require("../controllers/userController");
const {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateUserRole,
  validateUpdateUserStatus,
  validateGetUsers,
  validateGetUserById,
  validateDeleteUser,
} = require("../validators/userValidator");

// ─── Assumes authentication middleware is applied in server.js ────────────────
// const authenticate = require("../middlewares/authMiddleware");
// router.use(authenticate);

// ─── Collection routes ────────────────────────────────────────────────────────

/**
 * GET /api/users
 * Retrieve paginated and filtered list of users.
 * Supports: search, status, role, company_id, sortBy, sortOrder, page, limit
 */
router.get("/", validateGetUsers, userController.getUsers);

/**
 * POST /api/users
 * Create a new user account. Password will be hashed in the service layer.
 */
router.post("/", validateCreateUser, userController.createUser);

// ─── Member routes ────────────────────────────────────────────────────────────

/**
 * GET /api/users/:id
 * Retrieve a single user by UUID. Response never includes password_hash.
 */
router.get("/:id", validateGetUserById, userController.getUserById);

/**
 * PUT /api/users/:id
 * Update user profile fields. Does not update password.
 */
router.put("/:id", validateUpdateUser, userController.updateUser);

/**
 * PATCH /api/users/:id/role
 * Update user role (admin, hr, employee, manager).
 */
router.patch("/:id/role", validateUpdateUserRole, userController.updateUserRole);

/**
 * PATCH /api/users/:id/status
 * Update user status (active, inactive, suspended).
 */
router.patch("/:id/status", validateUpdateUserStatus, userController.updateUserStatus);

/**
 * DELETE /api/users/:id
 * Hard-delete a user account.
 */
router.delete("/:id", validateDeleteUser, userController.deleteUser);

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = router;
