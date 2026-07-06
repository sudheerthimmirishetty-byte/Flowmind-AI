/**
 * @file companyValidator.js
 * @description Validation rules for the Company module.
 *              Uses express-validator. All validators are arrays
 *              of middleware that are consumed by routes.
 * @module validators/companyValidator
 */

"use strict";

const { body, param, query } = require("express-validator");

// ─── Reusable field rules ──────────────────────────────────────────────────────

/** Valid status values for a company record */
const VALID_STATUSES = ["active", "inactive", "suspended"];

/** Validates that the route param :id is a valid UUID */
const validateCompanyId = [
  param("id")
    .isUUID(4)
    .withMessage("Company ID must be a valid UUID"),
];

// ─── Create Company ────────────────────────────────────────────────────────────

/**
 * Validation rules for POST /companies
 */
const validateCreateCompany = [
  body("company_name")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Company name must be between 2 and 150 characters"),

  body("industry")
    .trim()
    .notEmpty()
    .withMessage("Industry is required")
    .isLength({ max: 100 })
    .withMessage("Industry must not exceed 100 characters"),

  body("company_email")
    .trim()
    .notEmpty()
    .withMessage("Company email is required")
    .isEmail()
    .withMessage("Company email must be a valid email address")
    .normalizeEmail(),

  body("website")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Website must be a valid URL (include http:// or https://)"),

  body("logo_url")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Logo URL must be a valid URL"),

  body("status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Update Company ────────────────────────────────────────────────────────────

/**
 * Validation rules for PUT /companies/:id
 * All fields are optional on update (PATCH-style PUT).
 */
const validateUpdateCompany = [
  ...validateCompanyId,

  body("company_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Company name cannot be blank")
    .isLength({ min: 2, max: 150 })
    .withMessage("Company name must be between 2 and 150 characters"),

  body("industry")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Industry cannot be blank")
    .isLength({ max: 100 })
    .withMessage("Industry must not exceed 100 characters"),

  body("company_email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Company email must be a valid email address")
    .normalizeEmail(),

  body("website")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Website must be a valid URL"),

  body("logo_url")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Logo URL must be a valid URL"),

  body("status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Update Company Status ─────────────────────────────────────────────────────

/**
 * Validation rules for PATCH /companies/:id/status
 */
const validateUpdateCompanyStatus = [
  ...validateCompanyId,

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Get / Search / Filter Companies ──────────────────────────────────────────

/**
 * Validation rules for GET /companies (list, search, filter)
 */
const validateGetCompanies = [
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

  query("industry")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry filter must not exceed 100 characters"),

  query("sortBy")
    .optional()
    .trim()
    .isIn(["company_name", "created_at", "updated_at", "industry"])
    .withMessage("sortBy must be one of: company_name, created_at, updated_at, industry"),

  query("sortOrder")
    .optional()
    .trim()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
];

// ─── Get Company By ID ─────────────────────────────────────────────────────────

const validateGetCompanyById = [...validateCompanyId];

// ─── Delete Company ────────────────────────────────────────────────────────────

const validateDeleteCompany = [...validateCompanyId];

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  validateCreateCompany,
  validateUpdateCompany,
  validateUpdateCompanyStatus,
  validateGetCompanies,
  validateGetCompanyById,
  validateDeleteCompany,
};
