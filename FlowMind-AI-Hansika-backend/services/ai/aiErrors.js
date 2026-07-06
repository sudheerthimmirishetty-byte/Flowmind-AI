/**
 * services/ai/aiErrors.js
 *
 * Enterprise custom error classes for the AI Foundation Layer.
 * Every AI error carries a stable code, retry hint, and serialisable payload.
 */

"use strict";

// ─── Error Codes ──────────────────────────────────────────────────────────────

const ERROR_CODES = Object.freeze({
  AI_ERROR: "AI_ERROR",
  AI_VALIDATION_ERROR: "AI_VALIDATION_ERROR",
  AI_CONNECTION_ERROR: "AI_CONNECTION_ERROR",
  AI_RATE_LIMIT_ERROR: "AI_RATE_LIMIT_ERROR",
  AI_TIMEOUT_ERROR: "AI_TIMEOUT_ERROR",
  AI_RESPONSE_ERROR: "AI_RESPONSE_ERROR",
});

// ─── Base Error ───────────────────────────────────────────────────────────────

/**
 * Base AI error with structured metadata.
 */
class AIError extends Error {
  /**
   * @param {string} message
   * @param {object} [options]
   * @param {string} [options.code]
   * @param {boolean} [options.retryable]
   * @param {object} [options.details]
   */
  constructor(message, options = {}) {
    super(message);

    this.name = "AIError";
    this.code = options.code || ERROR_CODES.AI_ERROR;
    this.retryable = Boolean(options.retryable);
    this.details = options.details || {};

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIError);
    }
  }

  /**
   * Serialise error for logging and API responses.
   * @returns {object}
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

// ─── Specialised Errors ───────────────────────────────────────────────────────

class AIValidationError extends AIError {
  /**
   * @param {string} message
   * @param {object} [details]
   */
  constructor(message, details = {}) {
    super(message, {
      code: ERROR_CODES.AI_VALIDATION_ERROR,
      retryable: false,
      details,
    });
    this.name = "AIValidationError";
  }
}

class AIConnectionError extends AIError {
  /**
   * @param {string} message
   * @param {object} [details]
   */
  constructor(message, details = {}) {
    super(message, {
      code: ERROR_CODES.AI_CONNECTION_ERROR,
      retryable: true,
      details,
    });
    this.name = "AIConnectionError";
  }
}

class AIRateLimitError extends AIError {
  /**
   * @param {string} message
   * @param {object} [details]
   */
  constructor(message, details = {}) {
    super(message, {
      code: ERROR_CODES.AI_RATE_LIMIT_ERROR,
      retryable: true,
      details,
    });
    this.name = "AIRateLimitError";
  }
}

class AITimeoutError extends AIError {
  /**
   * @param {string} message
   * @param {object} [details]
   */
  constructor(message, details = {}) {
    super(message, {
      code: ERROR_CODES.AI_TIMEOUT_ERROR,
      retryable: true,
      details,
    });
    this.name = "AITimeoutError";
  }
}

class AIResponseError extends AIError {
  /**
   * @param {string} message
   * @param {object} [details]
   */
  constructor(message, details = {}) {
    super(message, {
      code: ERROR_CODES.AI_RESPONSE_ERROR,
      retryable: false,
      details,
    });
    this.name = "AIResponseError";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determine whether an unknown error is retryable.
 * @param {unknown} error
 * @returns {boolean}
 */
const isRetryableError = (error) => {
  if (error instanceof AIError) {
    return error.retryable;
  }
  return false;
};

/**
 * Normalise any thrown value into an AIError instance.
 * @param {unknown} error
 * @param {string} [fallbackMessage]
 * @returns {AIError}
 */
const normalizeError = (error, fallbackMessage = "An unexpected AI error occurred") => {
  if (error instanceof AIError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const details = error instanceof Error ? { originalName: error.name } : {};

  if (/timeout|timed out|ETIMEDOUT|ESOCKETTIMEDOUT/i.test(message)) {
    return new AITimeoutError(message, details);
  }

  if (/rate limit|quota|429|resource exhausted/i.test(message)) {
    return new AIRateLimitError(message, details);
  }

  if (/network|ECONNREFUSED|ENOTFOUND|fetch failed|connection/i.test(message)) {
    return new AIConnectionError(message, details);
  }

  return new AIError(fallbackMessage, {
    code: ERROR_CODES.AI_ERROR,
    retryable: false,
    details: { cause: message, ...details },
  });
};

module.exports = {
  ERROR_CODES,
  AIError,
  AIValidationError,
  AIConnectionError,
  AIRateLimitError,
  AITimeoutError,
  AIResponseError,
  isRetryableError,
  normalizeError,
};
