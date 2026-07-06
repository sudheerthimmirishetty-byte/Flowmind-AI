/**
 * @file departmentValidator.js
 * @description Validation rules for the Department module.
 * @module validators/departmentValidator
 */

"use strict";

const { body, param, query } = require("express-validator");

// ─── Constants ─────────────────────────────────────────────────────────────────

const VALID_STATUSES = ["active", "inactive"];

// ─── Reusable param validator ──────────────────────────────────────────────────

const validateDepartmentId = [
  param("id")
    .isUUID(4)
    .withMessage("Department ID must be a valid UUID"),
];

// ─── Create Department ─────────────────────────────────────────────────────────

/**
 * Validation rules for POST /departments
 */
const validateCreateDepartment = [
  body("company_id")
    .trim()
    .notEmpty()
    .withMessage("Company ID is required")
    .isUUID(4)
    .withMessage("Company ID must be a valid UUID"),

  body("department_name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Department name must be between 2 and 150 characters"),

  body("department_code")
    .trim()
    .notEmpty()
    .withMessage("Department code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Department code must be between 2 and 20 characters")
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage("Department code may only contain letters, numbers, hyphens, and underscores"),

  body("description")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Update Department ─────────────────────────────────────────────────────────

/**
 * Validation rules for PUT /departments/:id
 */
const validateUpdateDepartment = [
  ...validateDepartmentId,

  body("company_id")
    .optional()
    .trim()
    .isUUID(4)
    .withMessage("Company ID must be a valid UUID"),

  body("department_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department name cannot be blank")
    .isLength({ min: 2, max: 150 })
    .withMessage("Department name must be between 2 and 150 characters"),

  body("department_code")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department code cannot be blank")
    .isLength({ min: 2, max: 20 })
    .withMessage("Department code must be between 2 and 20 characters")
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage("Department code may only contain letters, numbers, hyphens, and underscores"),

  body("description")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Update Department Status ──────────────────────────────────────────────────

/**
 * Validation rules for PATCH /departments/:id/status
 */
const validateUpdateDepartmentStatus = [
  ...validateDepartmentId,

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Get / Search / Filter Departments ────────────────────────────────────────

/**
 * Validation rules for GET /departments (list, search, filter)
 */
const validateGetDepartments = [
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

  query("company_id")
    .optional()
    .trim()
    .isUUID(4)
    .withMessage("company_id filter must be a valid UUID"),

  query("sortBy")
    .optional()
    .trim()
    .isIn(["department_name", "department_code", "created_at", "updated_at"])
    .withMessage("sortBy must be one of: department_name, department_code, created_at, updated_at"),

  query("sortOrder")
    .optional()
    .trim()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
];

// ─── Singular record lookups ───────────────────────────────────────────────────

const validateGetDepartmentById  = [...validateDepartmentId];
const validateDeleteDepartment   = [...validateDepartmentId];

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateUpdateDepartmentStatus,
  validateGetDepartments,
  validateGetDepartmentById,
  validateDeleteDepartment,
};
