/**
 * middlewares/validate.middleware.js
 *
 * Express-Validator integration middleware.
 *
 * After defining a chain of express-validator rules in a validator file,
 * this middleware:
 *   1. Runs all validation rules via validationResult()
 *   2. If there are validation errors, returns a 400 response with the
 *      standard project error envelope.
 *   3. If validation passes, calls next() to continue.
 *
 * Usage:
 *   const { body } = require('express-validator');
 *   const validate = require('../middlewares/validate.middleware');
 *
 *   router.post('/login',
 *     [
 *       body('email').isEmail().normalizeEmail(),
 *       body('password').notEmpty(),
 *     ],
 *     validate,
 *     authController.login
 *   );
 */

"use strict";

const { validationResult } = require("express-validator");
const { sendError } = require("../utils/response");
const HTTP = require("../constants/httpStatus");
const MSG = require("../constants/messages");

/**
 * Reads express-validator results and short-circuits the request
 * with a 400 error if any rules failed.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    // Map express-validator errors to { field, message } pairs
    const errors = result.array().map((err) => ({
      field: err.path || err.param || "unknown",
      message: err.msg,
    }));

    return sendError(res, HTTP.BAD_REQUEST, MSG.GENERAL.VALIDATION_FAILED, errors);
  }

  next();
};

module.exports = validate;
