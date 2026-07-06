/**
 * @file userValidator.js
 * @description Validation rules for the User module.
 *              Covers create, update, role management, status management.
 * @module validators/userValidator
 */

"use strict";

const { body, param, query } = require("express-validator");

// ─── Constants ─────────────────────────────────────────────────────────────────

const VALID_ROLES   = ["admin", "hr", "employee", "manager"];
const VALID_STATUSES = ["active", "inactive", "suspended"];

// ─── Reusable param validator ──────────────────────────────────────────────────

const validateUserId = [
  param("id")
    .isUUID(4)
    .withMessage("User ID must be a valid UUID"),
];

// ─── Create User ───────────────────────────────────────────────────────────────

/**
 * Validation rules for POST /users
 */
const validateCreateUser = [
  body("company_id")
    .trim()
    .notEmpty()
    .withMessage("Company ID is required")
    .isUUID(4)
    .withMessage("Company ID must be a valid UUID"),

  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Full name must be between 2 and 150 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Phone must be a valid international phone number"),

  body("profile_image")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Profile image must be a valid URL"),

  body("status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Update User ───────────────────────────────────────────────────────────────

/**
 * Validation rules for PUT /users/:id
 * password field is intentionally excluded — use a dedicated
 * change-password endpoint (handled by the Auth module).
 */
const validateUpdateUser = [
  ...validateUserId,

  body("company_id")
    .optional()
    .trim()
    .isUUID(4)
    .withMessage("Company ID must be a valid UUID"),

  body("full_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be blank")
    .isLength({ min: 2, max: 150 })
    .withMessage("Full name must be between 2 and 150 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),

  body("role")
    .optional()
    .trim()
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Phone must be a valid international phone number"),

  body("profile_image")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Profile image must be a valid URL"),

  body("status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Update Role ───────────────────────────────────────────────────────────────

/**
 * Validation rules for PATCH /users/:id/role
 */
const validateUpdateUserRole = [
  ...validateUserId,

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),
];

// ─── Update Status ─────────────────────────────────────────────────────────────

/**
 * Validation rules for PATCH /users/:id/status
 */
const validateUpdateUserStatus = [
  ...validateUserId,

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Get / Search / Filter Users ──────────────────────────────────────────────

/**
 * Validation rules for GET /users (list, search, filter)
 */
const validateGetUsers = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search query must not exceed 200 characters"),

  query("status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Status filter must be one of: ${VALID_STATUSES.join(", ")}`),

  query("role")
    .optional()
    .trim()
    .isIn(VALID_ROLES)
    .withMessage(`Role filter must be one of: ${VALID_ROLES.join(", ")}`),

  query("company_id")
    .optional()
    .trim()
    .isUUID(4)
    .withMessage("company_id filter must be a valid UUID"),

  query("sortBy")
    .optional()
    .trim()
    .isIn(["full_name", "email", "role", "created_at", "updated_at"])
    .withMessage("sortBy must be one of: full_name, email, role, created_at, updated_at"),

  query("sortOrder")
    .optional()
    .trim()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
];

// ─── Singular record lookups ───────────────────────────────────────────────────

const validateGetUserById  = [...validateUserId];
const validateDeleteUser   = [...validateUserId];

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateUserRole,
  validateUpdateUserStatus,
  validateGetUsers,
  validateGetUserById,
  validateDeleteUser,
};
