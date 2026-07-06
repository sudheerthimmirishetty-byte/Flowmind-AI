/**
 * utils/response.js
 *
 * Centralised HTTP response helpers.
 *
 * Enforces the project-wide JSON envelope:
 *
 *   Success:  { success: true,  message: string, data: object }
 *   Failure:  { success: false, message: string, errors: array }
 *
 * Usage:
 *   const { sendSuccess, sendError } = require('../utils/response');
 *   sendSuccess(res, 'User retrieved', { user });
 *   sendError(res, 400, 'Validation failed', validationErrors);
 */

"use strict";

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {string}  message   - Human-readable success message
 * @param {*}       [data={}] - Response payload
 * @param {number}  [status=200] - HTTP status code (default 200)
 */
const sendSuccess = (res, message = "Success", data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error JSON response.
 *
 * @param {import('express').Response} res
 * @param {number}   status         - HTTP status code
 * @param {string}   message        - Human-readable error message
 * @param {Array}    [errors=[]]    - Validation / detail error array
 */
const sendError = (res, status = 500, message = "An error occurred", errors = []) => {
  return res.status(status).json({
    success: false,
    message,
    errors,
  });
};

/**
 * Send a created (201) JSON response.
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {*}      [data={}]
 */
const sendCreated = (res, message = "Resource created", data = {}) => {
  return sendSuccess(res, message, data, 201);
};

/**
 * Send a no-content (204) response.
 * Note: 204 responses must not include a body.
 *
 * @param {import('express').Response} res
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

module.exports = { sendSuccess, sendError, sendCreated, sendNoContent };
