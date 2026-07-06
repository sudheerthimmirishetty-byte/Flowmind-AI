/**
 * validators/common.validators.js
 *
 * Reusable express-validator rule factories.
 *
 * These are BUILDING BLOCKS — not full route validators.
 * Individual feature validators (auth, employee, workflow, etc.)
 * compose these to build their own validation chains.
 *
 * Philosophy:
 *   - Keep rules DRY: define once, reuse everywhere
 *   - Sanitise input at the boundary (trim, escape, normalise)
 *   - Never trust client data
 *
 * Usage:
 *   const { emailRule, passwordRule, uuidRule } = require('../validators/common.validators');
 *
 *   router.post('/login', [emailRule('email'), passwordRule('password')], validate, handler);
 */

"use strict";

const { body, param, query } = require("express-validator");

// ─── Field Rules ──────────────────────────────────────────────────────────────

/**
 * Validates that a field is a valid email address and normalises it.
 * @param {string} field - Request body field name (default: 'email')
 */
const emailRule = (field = "email") =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail();

/**
 * Validates a password field: required, minimum 6 characters.
 * @param {string} field - Request body field name (default: 'password')
 */
const passwordRule = (field = "password") =>
  body(field)
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters");

/**
 * Validates a strong password: min 8 chars, at least one number.
 * @param {string} field
 */
const strongPasswordRule = (field = "password") =>
  body(field)
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number");

/**
 * Validates a UUID param (e.g. /users/:id).
 * @param {string} field - Route param name (default: 'id')
 */
const uuidParamRule = (field = "id") =>
  param(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`);

/**
 * Validates that a required string body field is not empty.
 * @param {string} field
 * @param {string} [label] - Human-readable label for the error message
 */
const requiredStringRule = (field, label) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label || field} is required`);

/**
 * Validates an optional string field — sanitises if present.
 * @param {string} field
 */
const optionalStringRule = (field) =>
  body(field)
    .optional()
    .trim()
    .escape();

/**
 * Validates a phone number field (basic format: digits, spaces, +, -, ()).
 * @param {string} field
 */
const phoneRule = (field = "phone") =>
  body(field)
    .optional()
    .trim()
    .matches(/^[+\d\s\-().]{7,20}$/)
    .withMessage("Enter a valid phone number");

/**
 * Validates an ISO 8601 date string.
 * @param {string} field
 */
const dateRule = (field) =>
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid date (YYYY-MM-DD)`);

/**
 * Validates a URL.
 * @param {string} field
 */
const urlRule = (field) =>
  body(field)
    .optional()
    .trim()
    .isURL()
    .withMessage(`${field} must be a valid URL`);

/**
 * Validates that a value is within an allowed set.
 * @param {string} field
 * @param {string[]} values - Allowed values
 */
const isInRule = (field, values) =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isIn(values)
    .withMessage(`${field} must be one of: ${values.join(", ")}`);

/**
 * Validates an optional enum field.
 * @param {string} field
 * @param {string[]} values
 */
const optionalIsInRule = (field, values) =>
  body(field)
    .optional()
    .isIn(values)
    .withMessage(`${field} must be one of: ${values.join(", ")}`);

/**
 * Validates a positive integer.
 * @param {string} field
 */
const positiveIntRule = (field) =>
  body(field)
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage(`${field} must be an integer between 0 and 100`);

/**
 * Validates a pagination query param (limit / offset).
 * @param {string} field
 * @param {number} [defaultVal]
 */
const paginationRule = (field, defaultVal = 20) =>
  query(field)
    .optional()
    .isInt({ min: 1 })
    .withMessage(`${field} must be a positive integer`)
    .toInt()
    .default(defaultVal);

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  emailRule,
  passwordRule,
  strongPasswordRule,
  uuidParamRule,
  requiredStringRule,
  optionalStringRule,
  phoneRule,
  dateRule,
  urlRule,
  isInRule,
  optionalIsInRule,
  positiveIntRule,
  paginationRule,
};
