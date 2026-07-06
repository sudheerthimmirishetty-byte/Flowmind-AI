/**
 * utils/AppError.js
 *
 * Custom application error class.
 *
 * Allows services and controllers to throw typed errors with an HTTP status
 * code attached.  The global error middleware catches these and formats them
 * using the standard project envelope.
 *
 * Usage:
 *   const AppError = require('../utils/AppError');
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Validation failed', 400, [{ field: 'email', msg: 'Invalid' }]);
 */

"use strict";

class AppError extends Error {
  /**
   * @param {string}  message   - Human-readable error description
   * @param {number}  [status=500] - HTTP status code
   * @param {Array}   [errors=[]]  - Optional detail errors (e.g. validation)
   */
  constructor(message, status = 500, errors = []) {
    super(message);

    this.name = "AppError";
    this.status = status;
    this.errors = errors;

    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

module.exports = AppError;
