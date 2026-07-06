/**
 * services/ai/aiLogger.js
 *
 * Enterprise logging utility for the AI Foundation Layer.
 * Delegates to the project Winston logger and never exposes secrets.
 */

"use strict";

const { v4: uuidv4 } = require("uuid");
const baseLogger = require("../../utils/logger");
const { config } = require("./aiConfig");

const LOG_PREFIX = "[AI]";

// ─── Secret Sanitisation ──────────────────────────────────────────────────────

const SECRET_KEYS = new Set([
  "apikey",
  "api_key",
  "gemini_api_key",
  "authorization",
  "token",
  "password",
  "secret",
]);

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z\-_]{20,}/g,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
];

/**
 * Recursively redact sensitive values from metadata.
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {unknown}
 */
const sanitizeValue = (value, depth = 0) => {
  if (depth > 6) {
    return "[Truncated]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    let sanitized = value;
    for (const pattern of SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
    if (config.gemini.apiKey && sanitized.includes(config.gemini.apiKey)) {
      sanitized = sanitized.split(config.gemini.apiKey).join("[REDACTED]");
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const result = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SECRET_KEYS.has(key.toLowerCase())) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeValue(nested, depth + 1);
      }
    }
    return result;
  }

  return value;
};

/**
 * Build a structured log payload.
 * @param {string} event
 * @param {object} [meta]
 * @returns {object}
 */
const buildPayload = (event, meta = {}) => ({
  component: "ai-foundation",
  event,
  ...sanitizeValue(meta),
});

// ─── Request ID ───────────────────────────────────────────────────────────────

/**
 * Generate a unique request identifier for AI operations.
 * @returns {string}
 */
const generateRequestId = () => uuidv4();

// ─── Log Methods ──────────────────────────────────────────────────────────────

/**
 * Log AI layer initialisation.
 * @param {object} [meta]
 */
const logInitialization = (meta = {}) => {
  baseLogger.info(`${LOG_PREFIX} Initialization`, buildPayload("initialization", meta));
};

/**
 * Log the start of an AI execution.
 * @param {string} requestId
 * @param {object} [meta]
 */
const logExecutionStart = (requestId, meta = {}) => {
  baseLogger.info(
    `${LOG_PREFIX} Execution started`,
    buildPayload("execution_start", { requestId, ...meta })
  );
};

/**
 * Log a successful AI execution.
 * @param {string} requestId
 * @param {object} [meta]
 */
const logExecutionSuccess = (requestId, meta = {}) => {
  baseLogger.info(
    `${LOG_PREFIX} Execution succeeded`,
    buildPayload("execution_success", { requestId, ...meta })
  );
};

/**
 * Log a failed AI execution.
 * @param {string} requestId
 * @param {object} [meta]
 */
const logExecutionFailure = (requestId, meta = {}) => {
  baseLogger.error(
    `${LOG_PREFIX} Execution failed`,
    buildPayload("execution_failure", { requestId, ...meta })
  );
};

/**
 * Log a retry attempt.
 * @param {string} requestId
 * @param {object} [meta]
 */
const logRetry = (requestId, meta = {}) => {
  baseLogger.warn(
    `${LOG_PREFIX} Retrying operation`,
    buildPayload("retry", { requestId, ...meta })
  );
};

/**
 * Log a non-fatal warning.
 * @param {string} message
 * @param {object} [meta]
 */
const logWarning = (message, meta = {}) => {
  baseLogger.warn(`${LOG_PREFIX} ${message}`, buildPayload("warning", meta));
};

/**
 * Log a health check event.
 * @param {object} [meta]
 */
const logHealthCheck = (meta = {}) => {
  baseLogger.info(`${LOG_PREFIX} Health check`, buildPayload("health_check", meta));
};

module.exports = {
  generateRequestId,
  sanitizeValue,
  logInitialization,
  logExecutionStart,
  logExecutionSuccess,
  logExecutionFailure,
  logRetry,
  logWarning,
  logHealthCheck,
};
