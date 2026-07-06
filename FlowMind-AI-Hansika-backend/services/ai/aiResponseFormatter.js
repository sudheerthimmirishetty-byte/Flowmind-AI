/**
 * services/ai/aiResponseFormatter.js
 *
 * Standardises every AI Foundation response into a single envelope.
 * Raw Gemini responses are never exposed to consumers.
 */

"use strict";

const { AIError } = require("./aiErrors");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise usage metadata from Gemini into a stable shape.
 * @param {object} [usage]
 * @returns {object}
 */
const normalizeUsage = (usage = {}) => ({
  promptTokens: usage.promptTokenCount ?? usage.promptTokens ?? 0,
  completionTokens: usage.candidatesTokenCount ?? usage.completionTokens ?? 0,
  totalTokens: usage.totalTokenCount ?? usage.totalTokens ?? 0,
});

/**
 * Build metadata block shared across response types.
 * @param {object} params
 * @param {string} params.requestId
 * @param {string} [params.model]
 * @param {number} [params.durationMs]
 * @param {number} [params.attempt]
 * @returns {object}
 */
const buildMetadata = ({ requestId, model, durationMs, attempt }) => {
  const metadata = { requestId };

  if (model) {
    metadata.model = model;
  }

  if (typeof durationMs === "number") {
    metadata.durationMs = durationMs;
  }

  if (typeof attempt === "number") {
    metadata.attempt = attempt;
  }

  metadata.timestamp = new Date().toISOString();

  return metadata;
};

// ─── Formatters ───────────────────────────────────────────────────────────────

/**
 * Format a successful AI execution response.
 * @param {object} params
 * @param {string} params.requestId
 * @param {string} params.content
 * @param {object} [params.usage]
 * @param {string} [params.model]
 * @param {number} [params.durationMs]
 * @param {number} [params.attempt]
 * @param {object} [params.extra]
 * @returns {object}
 */
const formatSuccess = ({
  requestId,
  content,
  usage = {},
  model,
  durationMs,
  attempt,
  extra = {},
}) => ({
  success: true,
  data: {
    content,
    ...extra,
  },
  usage: normalizeUsage(usage),
  metadata: buildMetadata({ requestId, model, durationMs, attempt }),
});

/**
 * Format a failed AI execution response.
 * @param {object} params
 * @param {string} params.requestId
 * @param {AIError|Error} params.error
 * @param {string} [params.model]
 * @param {number} [params.durationMs]
 * @param {number} [params.attempt]
 * @returns {object}
 */
const formatFailure = ({
  requestId,
  error,
  model,
  durationMs,
  attempt,
}) => {
  const aiError = error instanceof AIError
    ? error
    : new AIError(error.message || "An unexpected AI error occurred", {
      details: { originalName: error.name },
    });

  return {
    success: false,
    error: aiError.toJSON(),
    usage: normalizeUsage(),
    metadata: buildMetadata({ requestId, model, durationMs, attempt }),
  };
};

/**
 * Format a health check response.
 * @param {object} params
 * @param {string} status - "healthy" | "degraded" | "unhealthy"
 * @param {object} [params.checks]
 * @param {string[]} [params.warnings]
 * @param {string} [params.requestId]
 * @returns {object}
 */
const formatHealth = ({
  status,
  checks = {},
  warnings = [],
  requestId,
}) => ({
  success: status === "healthy" || status === "degraded",
  health: {
    status,
    checks,
    warnings,
  },
  usage: normalizeUsage(),
  metadata: buildMetadata({ requestId }),
});

module.exports = {
  normalizeUsage,
  formatSuccess,
  formatFailure,
  formatHealth,
};
