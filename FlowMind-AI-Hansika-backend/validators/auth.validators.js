/**
 * validators/auth.validators.js
 *
 * Validation chains for Authentication routes.
 *
 * Uses the common validator building blocks from common.validators.js.
 * These arrays are passed directly to Express routes before the
 * validate middleware runs.
 *
 * Usage (in auth.routes.js):
 *   router.post('/login', loginValidator, validate, authController.login);
 */

"use strict";

const { body } = require("express-validator");
const {
  emailRule,
  passwordRule,
  strongPasswordRule,
  optionalStringRule,
  phoneRule,
  urlRule,
} = require("./common.validators");

/**
 * POST /api/v1/auth/login
 * Rules: email (valid format) + password (non-empty)
 */
const loginValidator = [
  emailRule("email"),
  passwordRule("password"),
];

/**
 * PUT /api/v1/auth/me
 * All fields optional, at least one should be present (checked at service level).
 */
const updateProfileValidator = [
  body("full_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  phoneRule("phone"),

  body("profile_image")
    .optional()
    .trim()
    .isURL()
    .withMessage("Profile image must be a valid URL"),
];

/**
 * PUT /api/v1/auth/change-password
 * current_password + new_password (strong).
 */
const changePasswordValidator = [
  body("current_password")
    .notEmpty()
    .withMessage("Current password is required"),

  strongPasswordRule("new_password"),

  body("confirm_password")
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.new_password) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),
];

module.exports = {
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
};
