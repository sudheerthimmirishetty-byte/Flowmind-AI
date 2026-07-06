/**
 * middlewares/logger.middleware.js
 *
 * HTTP Request Logger Middleware (Morgan integration).
 *
 * Streams Morgan HTTP access logs through our Winston logger so that all
 * log output (both application logs and HTTP access logs) goes through a
 * single, consistent pipeline.
 *
 * Format:
 *   Development → 'dev' (coloured concise format)
 *   Production  → 'combined' (Apache-style full format for log aggregators)
 *
 * Usage (in server.js):
 *   const requestLogger = require('./middlewares/logger.middleware');
 *   app.use(requestLogger);
 */

"use strict";

const morgan = require("morgan");
const logger = require("../utils/logger");
const env = require("../config/env");

// Create a Morgan write stream that pipes into Winston
const stream = {
  write: (message) => {
    // Morgan adds a newline, trim it before handing to Winston
    logger.http(message.trim());
  },
};

// Skip health-check endpoints from access logs to reduce noise
const skip = (req) => {
  return req.url === "/api/health" || req.url === "/health";
};

const format = env.isDev ? "dev" : "combined";

const requestLogger = morgan(format, { stream, skip });

module.exports = requestLogger;
