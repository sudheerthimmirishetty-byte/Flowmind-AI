/**
 * services/ai/geminiClient.js
 *
 * Low-level Gemini SDK wrapper.
 * This is the ONLY module permitted to import @google/generative-ai.
 */

"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");

const { config } = require("./aiConfig");
const {
  AIValidationError,
  AIConnectionError,
  AIRateLimitError,
  AITimeoutError,
  AIResponseError,
  normalizeError,
  isRetryableError,
} = require("./aiErrors");
const {
  logRetry,
  logWarning,
} = require("./aiLogger");
const { normalizeUsage } = require("./aiResponseFormatter");

// ─── Client State ─────────────────────────────────────────────────────────────

/** @type {GoogleGenerativeAI | null} */
let client = null;

/** @type {import('@google/generative-ai').GenerativeModel | null} */
let model = null;

let initialized = false;
let lastRequestAt = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Compute exponential backoff delay with jitter.
 * @param {number} attempt
 * @returns {number}
 */
const getRetryDelay = (attempt) => {
  const base = config.request.retryBaseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 100);
  return Math.min(base + jitter, config.request.retryMaxDelayMs);
};

/**
 * Enforce a minimum interval between outbound requests.
 * @returns {Promise<void>}
 */
const enforceRateLimit = async () => {
  const elapsed = Date.now() - lastRequestAt;
  const waitMs = config.request.minRequestIntervalMs - elapsed;

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  lastRequestAt = Date.now();
};

/**
 * Run an async operation with a timeout.
 * @template T
 * @param {() => Promise<T>} operation
 * @param {number} timeoutMs
 * @param {string} [label]
 * @returns {Promise<T>}
 */
const withTimeout = async (operation, timeoutMs, label = "Gemini request") => {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new AITimeoutError(`${label} timed out after ${timeoutMs}ms`, { timeoutMs }));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Map Gemini SDK errors to AI error classes.
 * @param {unknown} error
 * @returns {import('./aiErrors').AIError}
 */
const mapSdkError = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  const status = error && typeof error === "object" && "status" in error
    ? Number(error.status)
    : undefined;

  if (status === 429 || /rate limit|quota|resource exhausted/i.test(message)) {
    return new AIRateLimitError(message, { status });
  }

  if (status === 408 || /timeout|timed out/i.test(message)) {
    return new AITimeoutError(message, { status });
  }

  if (/network|fetch failed|ECONN|ENOTFOUND|service unavailable|503/i.test(message)) {
    return new AIConnectionError(message, { status });
  }

  if (/invalid|bad request|400|validation/i.test(message)) {
    return new AIValidationError(message, { status });
  }

  return normalizeError(error, "Gemini request failed");
};

/**
 * Extract text content from a Gemini generateContent result.
 * @param {object} result
 * @returns {string}
 */
const extractText = (result) => {
  const response = result?.response;

  if (!response) {
    throw new AIResponseError("Gemini returned an empty response object.");
  }

  try {
    const text = response.text();

    if (!text || text.trim() === "") {
      throw new AIResponseError("Gemini returned empty content.");
    }

    return text;
  } catch (error) {
    if (error instanceof AIResponseError) {
      throw error;
    }

    throw new AIResponseError("Failed to extract text from Gemini response.", {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Build generation configuration for the model.
 * @param {object} [overrides]
 * @returns {object}
 */
const buildGenerationConfig = (overrides = {}) => ({
  temperature: overrides.temperature ?? config.gemini.temperature,
  topP: overrides.topP ?? config.gemini.topP,
  topK: overrides.topK ?? config.gemini.topK,
  maxOutputTokens: overrides.maxOutputTokens ?? config.gemini.maxOutputTokens,
});

// ─── Public Client API ────────────────────────────────────────────────────────

/**
 * Initialise the Gemini client and model.
 * @returns {Promise<{ initialized: boolean, model: string }>}
 */
const initialize = async () => {
  if (!config.gemini.apiKey) {
    throw new AIValidationError("GEMINI_API_KEY is required to initialise the Gemini client.");
  }

  client = new GoogleGenerativeAI(config.gemini.apiKey);
  model = client.getGenerativeModel({
    model: config.gemini.model,
    generationConfig: buildGenerationConfig(),
  });

  initialized = true;

  return {
    initialized: true,
    model: config.gemini.model,
  };
};

/**
 * Whether the Gemini client has been initialised.
 * @returns {boolean}
 */
const isInitialized = () => initialized;

/**
 * Perform a lightweight health ping against Gemini.
 * @param {string} [requestId]
 * @returns {Promise<{ reachable: boolean, latencyMs: number, model: string }>}
 */
const healthPing = async (requestId) => {
  if (!initialized || !model) {
    throw new AIConnectionError("Gemini client is not initialised.");
  }

  const startedAt = Date.now();

  await executeWithRetry({
    requestId: requestId || "health-ping",
    operation: async () => {
      await enforceRateLimit();
      const pingResult = await withTimeout(
        () => model.generateContent("Reply with OK"),
        Math.min(config.request.timeoutMs, 15000),
        "Gemini health ping"
      );
      extractText(pingResult);
      return pingResult;
    },
    maxAttempts: 1,
  });

  return {
    reachable: true,
    latencyMs: Date.now() - startedAt,
    model: config.gemini.model,
  };
};

/**
 * Execute an operation with retry semantics.
 * @param {object} params
 * @param {string} params.requestId
 * @param {() => Promise<*>} params.operation
 * @param {number} [params.maxAttempts]
 * @returns {Promise<{ result: *, attempt: number }>}
 */
const executeWithRetry = async ({ requestId, operation, maxAttempts }) => {
  const attempts = maxAttempts ?? config.request.retryMaxAttempts;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await operation();
      return { result, attempt };
    } catch (error) {
      const mapped = mapSdkError(error);
      lastError = mapped;

      const canRetry = attempt < attempts && isRetryableError(mapped);

      if (!canRetry) {
        throw mapped;
      }

      const delayMs = getRetryDelay(attempt);

      logRetry(requestId, {
        attempt,
        maxAttempts: attempts,
        delayMs,
        code: mapped.code,
        message: mapped.message,
      });

      await sleep(delayMs);
    }
  }

  throw lastError;
};

/**
 * Generate content via Gemini.
 * @param {object} params
 * @param {string} params.prompt
 * @param {string} params.requestId
 * @param {object} [params.generationConfig]
 * @returns {Promise<{ content: string, usage: object, model: string, attempt: number, durationMs: number }>}
 */
const generateContent = async ({ prompt, requestId, generationConfig = {} }) => {
  if (!initialized || !model) {
    throw new AIConnectionError("Gemini client is not initialised. Call initialize() first.");
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new AIValidationError("Prompt must be a non-empty string.", { field: "prompt" });
  }

  const startedAt = Date.now();

  const { result, attempt } = await executeWithRetry({
    requestId,
    operation: async () => {
      await enforceRateLimit();

      const activeModel = Object.keys(generationConfig).length > 0
        ? client.getGenerativeModel({
          model: config.gemini.model,
          generationConfig: buildGenerationConfig(generationConfig),
        })
        : model;

      return withTimeout(
        () => activeModel.generateContent(prompt),
        config.request.timeoutMs,
        "Gemini generateContent"
      );
    },
  });

  const content = extractText(result);
  const usage = normalizeUsage(result?.response?.usageMetadata || {});

  return {
    content,
    usage,
    model: config.gemini.model,
    attempt,
    durationMs: Date.now() - startedAt,
  };
};

/**
 * Shut down the Gemini client and release references.
 */
const shutdown = () => {
  client = null;
  model = null;
  initialized = false;
  lastRequestAt = 0;
  logWarning("Gemini client shut down");
};

module.exports = {
  initialize,
  isInitialized,
  healthPing,
  generateContent,
  shutdown,
};
