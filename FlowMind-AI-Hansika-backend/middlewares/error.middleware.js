/**
 * middlewares/error.middleware.js
 *
 * Global Express Error Handler.
 *
 * Express recognises a middleware with 4 parameters as an error handler.
 * It must be registered LAST in server.js, after all routes.
 *
 * Catches:
 *   - AppError instances (operational errors thrown intentionally)
 *   - Supabase errors
 *   - JWT errors (when not caught by auth middleware)
 *   - Generic unhandled errors
 *
 * Always returns the standard project JSON envelope:
 *   { success: false, message: string, errors: [] }
 */

"use strict";

const AppError = require("../utils/AppError");
const { sendError } = require("../utils/response");
const logger = require("../utils/logger");
const HTTP = require("../constants/httpStatus");
const MSG = require("../constants/messages");
const env = require("../config/env");

/**
 * @param {Error} err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next  - Required by Express (do not remove)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the error for observability
  logger.error("Unhandled error", {
    name: err.name,
    message: err.message,
    status: err.status,
    path: req.path,
    method: req.method,
    // Only include stack in development
    ...(env.isDev && { stack: err.stack }),
  });

  // ─── AppError (operational, expected) ────────────────────────────────────
  if (err instanceof AppError) {
    return sendError(res, err.status, err.message, err.errors);
  }

  // ─── JWT errors (should normally be caught in auth middleware) ────────────
  if (err.name === "JsonWebTokenError") {
    return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.TOKEN_INVALID);
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.TOKEN_EXPIRED);
  }

  // ─── Express body-parser errors ───────────────────────────────────────────
  if (err.type === "entity.parse.failed") {
    return sendError(res, HTTP.BAD_REQUEST, "Invalid JSON in request body");
  }

  // ─── Supabase errors ──────────────────────────────────────────────────────
  // Supabase returns { code, message, hint } for DB errors
  if (err.code && err.code.startsWith("P")) {
    // Postgres error codes (prefixed with P in Supabase)
    return sendError(res, HTTP.INTERNAL_SERVER_ERROR, "A database error occurred");
  }

  // ─── Generic / unexpected errors ─────────────────────────────────────────
  // In production, hide implementation details
  const message = env.isProd ? MSG.GENERAL.INTERNAL_ERROR : err.message;

  return sendError(res, HTTP.INTERNAL_SERVER_ERROR, message);
};

module.exports = errorHandler;
