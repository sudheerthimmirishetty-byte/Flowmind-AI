/**
 * utils/logger.js
 *
 * Centralised Winston logger.
 *
 * In development  → pretty-prints coloured logs to the console.
 * In production   → writes structured JSON to stdout (picked up by log
 *                   aggregators such as Datadog, Papertrail, CloudWatch).
 *
 * Usage:
 *   const logger = require('../utils/logger');
 *   logger.info('Server started');
 *   logger.error('Something went wrong', { error: err.message });
 */

"use strict";

const { createLogger, format, transports } = require("winston");
const env = require("../config/env");

const { combine, timestamp, printf, colorize, errors, json } = format;

// ─── Development formatter ────────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
  })
);

// ─── Production formatter (structured JSON) ───────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: env.LOG_LEVEL,
  format: env.isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
  ],
  // Do not exit on handled exceptions
  exitOnError: false,
});

module.exports = logger;
