/**
 * services/ai/aiHealth.js
 *
 * Generates a standardised AI health report for the foundation layer.
 */

"use strict";

const { config, validateConfig } = require("./aiConfig");
const geminiClient = require("./geminiClient");
const { formatHealth } = require("./aiResponseFormatter");
const { generateRequestId, logHealthCheck } = require("./aiLogger");

// ─── Check Helpers ────────────────────────────────────────────────────────────

/**
 * Evaluate configuration health.
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
const checkConfiguration = () => {
  const validation = validateConfig(config);

  return {
    ok: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
  };
};

/**
 * Evaluate Gemini client initialisation state.
 * @returns {{ ok: boolean, initialized: boolean }}
 */
const checkInitialization = () => ({
  ok: geminiClient.isInitialized(),
  initialized: geminiClient.isInitialized(),
});

/**
 * Evaluate Gemini reachability via health ping.
 * @param {string} requestId
 * @returns {Promise<{ ok: boolean, reachable: boolean, latencyMs?: number, error?: string }>}
 */
const checkReachability = async (requestId) => {
  if (!geminiClient.isInitialized()) {
    return {
      ok: false,
      reachable: false,
      error: "Gemini client is not initialised.",
    };
  }

  try {
    const ping = await geminiClient.healthPing(requestId);

    return {
      ok: true,
      reachable: ping.reachable,
      latencyMs: ping.latencyMs,
      model: ping.model,
    };
  } catch (error) {
    return {
      ok: false,
      reachable: false,
      error: error.message,
    };
  }
};

/**
 * Derive overall health status from individual checks.
 * @param {object} checks
 * @param {string[]} warnings
 * @returns {"healthy" | "degraded" | "unhealthy"}
 */
const deriveStatus = (checks, warnings) => {
  const configOk = checks.configuration?.ok;
  const initOk = checks.initialization?.ok;
  const reachabilityOk = checks.reachability?.ok;

  if (!configOk) {
    return "unhealthy";
  }

  if (!initOk) {
    return warnings.length > 0 ? "degraded" : "unhealthy";
  }

  if (!reachabilityOk) {
    return "degraded";
  }

  if (warnings.length > 0) {
    return "degraded";
  }

  return "healthy";
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a full AI health report.
 * @param {object} [options]
 * @param {boolean} [options.skipPing=false] - Skip live Gemini ping
 * @returns {Promise<object>}
 */
const generateHealthReport = async (options = {}) => {
  const requestId = generateRequestId();
  const { skipPing = false } = options;

  const configuration = checkConfiguration();
  const initialization = checkInitialization();

  const warnings = [...configuration.warnings];

  let reachability = {
    ok: false,
    reachable: false,
    skipped: true,
  };

  if (!skipPing && configuration.ok && initialization.ok) {
    reachability = {
      ...(await checkReachability(requestId)),
      skipped: false,
    };
  } else if (!initialization.ok) {
    reachability = {
      ok: false,
      reachable: false,
      skipped: skipPing,
      error: "Skipped reachability check because client is not initialised.",
    };
  } else if (!configuration.ok) {
    reachability = {
      ok: false,
      reachable: false,
      skipped: true,
      error: "Skipped reachability check because configuration is invalid.",
    };
  }

  const checks = {
    configuration: {
      ok: configuration.ok,
      errors: configuration.errors,
      warnings: configuration.warnings,
    },
    initialization,
    reachability,
  };

  const status = deriveStatus(checks, warnings);

  const report = formatHealth({
    status,
    checks,
    warnings,
    requestId,
  });

  logHealthCheck({
    requestId,
    status,
    checks,
    warnings,
  });

  return report;
};

module.exports = {
  generateHealthReport,
  checkConfiguration,
  checkInitialization,
  checkReachability,
};
