/**
 * services/ai/aiConfig.js
 *
 * Centralised immutable AI configuration.
 * Loads environment variables, validates values, and exports a frozen config.
 */

"use strict";

require("dotenv").config();

// ─── Parsing Helpers ──────────────────────────────────────────────────────────

/**
 * Parse a numeric environment variable with bounds.
 * @param {string} key
 * @param {number} defaultValue
 * @param {object} [bounds]
 * @param {number} [bounds.min]
 * @param {number} [bounds.max]
 * @returns {number}
 */
const parseNumber = (key, defaultValue, bounds = {}) => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`[AI Config] ${key} must be a valid number. Received: "${raw}"`);
  }

  if (bounds.min !== undefined && parsed < bounds.min) {
    throw new Error(`[AI Config] ${key} must be >= ${bounds.min}. Received: ${parsed}`);
  }

  if (bounds.max !== undefined && parsed > bounds.max) {
    throw new Error(`[AI Config] ${key} must be <= ${bounds.max}. Received: ${parsed}`);
  }

  return parsed;
};

/**
 * Parse a float environment variable with bounds.
 * @param {string} key
 * @param {number} defaultValue
 * @param {object} [bounds]
 * @param {number} [bounds.min]
 * @param {number} [bounds.max]
 * @returns {number}
 */
const parseFloatEnv = (key, defaultValue, bounds = {}) => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }

  const parsed = parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`[AI Config] ${key} must be a valid float. Received: "${raw}"`);
  }

  if (bounds.min !== undefined && parsed < bounds.min) {
    throw new Error(`[AI Config] ${key} must be >= ${bounds.min}. Received: ${parsed}`);
  }

  if (bounds.max !== undefined && parsed > bounds.max) {
    throw new Error(`[AI Config] ${key} must be <= ${bounds.max}. Received: ${parsed}`);
  }

  return parsed;
};

// ─── Configuration Builder ────────────────────────────────────────────────────

/**
 * Build the raw AI configuration from environment variables.
 * @returns {object}
 */
const buildConfig = () => ({
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.AI_GEMINI_MODEL || "gemini-1.5-flash",
    temperature: parseFloatEnv("AI_TEMPERATURE", 0.7, { min: 0, max: 2 }),
    topP: parseFloatEnv("AI_TOP_P", 0.95, { min: 0, max: 1 }),
    topK: parseNumber("AI_TOP_K", 40, { min: 1, max: 100 }),
    maxOutputTokens: parseNumber("AI_MAX_OUTPUT_TOKENS", 8192, { min: 1, max: 1048576 }),
  },
  request: {
    timeoutMs: parseNumber("AI_REQUEST_TIMEOUT_MS", 60000, { min: 1000, max: 600000 }),
    retryMaxAttempts: parseNumber("AI_RETRY_MAX_ATTEMPTS", 3, { min: 1, max: 10 }),
    retryBaseDelayMs: 500,
    retryMaxDelayMs: 8000,
    minRequestIntervalMs: 100,
  },
});

/** @type {ReturnType<typeof buildConfig>} */
let config = buildConfig();

// ─── Validation ─────────────────────────────────────────────────────────────────

/**
 * Validate that required AI configuration is present and well-formed.
 * @param {object} [cfg=config]
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
const validateConfig = (cfg = config) => {
  const errors = [];
  const warnings = [];

  if (!cfg.gemini.apiKey || cfg.gemini.apiKey.trim() === "") {
    errors.push("GEMINI_API_KEY is required but not set.");
  }

  if (!cfg.gemini.model || cfg.gemini.model.trim() === "") {
    errors.push("AI_GEMINI_MODEL must be a non-empty string.");
  }

  if (cfg.request.timeoutMs < 1000) {
    warnings.push("AI_REQUEST_TIMEOUT_MS is very low; requests may fail prematurely.");
  }

  if (cfg.request.retryMaxAttempts > 5) {
    warnings.push("AI_RETRY_MAX_ATTEMPTS is high; this may increase latency on failures.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Reload configuration from environment variables and re-freeze the export.
 * Intended for tests or hot-reload scenarios only.
 */
const reloadConfig = () => {
  config = Object.freeze(buildConfig());
  return config;
};

// Freeze initial config
config = Object.freeze(buildConfig());

module.exports = Object.freeze({
  config,
  validateConfig,
  reloadConfig,
});
