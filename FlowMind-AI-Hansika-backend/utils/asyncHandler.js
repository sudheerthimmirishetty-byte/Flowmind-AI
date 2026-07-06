/**
 * utils/asyncHandler.js
 *
 * Express async route handler wrapper.
 *
 * Eliminates the need for try/catch blocks inside every controller.
 * Wraps an async function and forwards any rejected promise to the
 * Express global error handler via next(err).
 *
 * Usage:
 *   const asyncHandler = require('../utils/asyncHandler');
 *
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await userService.getAll();
 *     sendSuccess(res, 'Users fetched', { users });
 *   }));
 */

"use strict";

/**
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
