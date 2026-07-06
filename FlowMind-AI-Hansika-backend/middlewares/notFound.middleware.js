/**
 * middlewares/notFound.middleware.js
 *
 * 404 Not Found Middleware.
 *
 * Catches any request that doesn't match a registered route and returns
 * a structured JSON 404 response.
 *
 * Must be registered AFTER all routes but BEFORE the global error handler.
 *
 * Usage (in server.js):
 *   app.use(notFoundHandler);
 *   app.use(errorHandler);
 */

"use strict";

const { sendError } = require("../utils/response");
const HTTP = require("../constants/httpStatus");

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const notFoundHandler = (req, res) => {
  return sendError(
    res,
    HTTP.NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`
  );
};

module.exports = notFoundHandler;
