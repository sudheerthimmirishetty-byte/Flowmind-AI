/**
 * services/ai/aiEngine.js
 *
 * Public gateway to the AI Foundation Layer.
 * All future AI modules must interact with Gemini exclusively through this API.
 */

"use strict";

const { config, validateConfig } = require("./aiConfig");
const {
  AIValidationError,
  normalizeError,
} = require("./aiErrors");
const {
  generateRequestId,
  logInitialization,
  logExecutionStart,
  logExecutionSuccess,
  logExecutionFailure,
} = require("./aiLogger");
const {
  formatSuccess,
  formatFailure,
} = require("./aiResponseFormatter");
const geminiClient = require("./geminiClient");
const { generateHealthReport } = require("./aiHealth");

// ─── Engine State ─────────────────────────────────────────────────────────────

let engineInitialized = false;
let shuttingDown = false;

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate execute() input parameters.
 * @param {object} params
 */
const validateExecuteParams = (params) => {
  if (!params || typeof params !== "object") {
    throw new AIValidationError("Execute parameters must be an object.");
  }

  if (!params.prompt || typeof params.prompt !== "string" || params.prompt.trim() === "") {
    throw new AIValidationError("A non-empty prompt string is required.", { field: "prompt" });
  }

  if (params.generationConfig !== undefined) {
    if (typeof params.generationConfig !== "object" || params.generationConfig === null) {
      throw new AIValidationError("generationConfig must be an object when provided.", {
        field: "generationConfig",
      });
    }
  }

  if (params.requestId !== undefined && typeof params.requestId !== "string") {
    throw new AIValidationError("requestId must be a string when provided.", { field: "requestId" });
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise the AI engine and underlying Gemini client.
 * @returns {Promise<object>}
 */
const initialize = async () => {
  const validation = validateConfig(config);

  if (!validation.valid) {
    throw new AIValidationError("AI configuration is invalid.", {
      errors: validation.errors,
    });
  }

  const clientState = await geminiClient.initialize();
  engineInitialized = true;
  shuttingDown = false;

  logInitialization({
    model: clientState.model,
    warnings: validation.warnings,
  });

  return {
    initialized: true,
    model: clientState.model,
    warnings: validation.warnings,
  };
};

/**
 * Execute a Gemini content generation request.
 * @param {object} params
 * @param {string} params.prompt
 * @param {object} [params.generationConfig]
 * @param {string} [params.requestId]
 * @returns {Promise<object>}
 */
const execute = async (params) => {
  if (shuttingDown) {
    return formatFailure({
      requestId: params?.requestId || generateRequestId(),
      error: new AIValidationError("AI engine is shutting down and cannot accept new requests."),
    });
  }

  if (!engineInitialized || !geminiClient.isInitialized()) {
    return formatFailure({
      requestId: params?.requestId || generateRequestId(),
      error: new AIValidationError("AI engine is not initialised. Call initialize() first."),
    });
  }

  const requestId = params?.requestId || generateRequestId();
  const startedAt = Date.now();

  try {
    validateExecuteParams(params);

    logExecutionStart(requestId, {
      model: config.gemini.model,
      promptLength: params.prompt.length,
    });

    const result = await geminiClient.generateContent({
      prompt: params.prompt,
      requestId,
      generationConfig: params.generationConfig,
    });

    const response = formatSuccess({
      requestId,
      content: result.content,
      usage: result.usage,
      model: result.model,
      durationMs: result.durationMs,
      attempt: result.attempt,
    });

    logExecutionSuccess(requestId, {
      model: result.model,
      durationMs: result.durationMs,
      usage: result.usage,
    });

    return response;
  } catch (error) {
    const normalized = normalizeError(error);

    logExecutionFailure(requestId, {
      code: normalized.code,
      message: normalized.message,
      durationMs: Date.now() - startedAt,
    });

    return formatFailure({
      requestId,
      error: normalized,
      model: config.gemini.model,
      durationMs: Date.now() - startedAt,
    });
  }
};

/**
 * Return a standardised AI health report.
 * @param {object} [options]
 * @param {boolean} [options.skipPing=false]
 * @returns {Promise<object>}
 */
const health = async (options = {}) => generateHealthReport(options);

/**
 * Gracefully shut down the AI engine.
 * @returns {Promise<{ shutdown: boolean }>}
 */
const shutdown = async () => {
  shuttingDown = true;
  geminiClient.shutdown();
  engineInitialized = false;

  return { shutdown: true };
};

module.exports = {
  initialize,
  execute,
  health,
  shutdown,
};
