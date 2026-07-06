/**
 * services/ai/workflowDetector.js
 *
 * Determines which enterprise workflow should execute based on a business
 * command and previously extracted information. Generic by design — supports
 * current and future workflows without architectural changes.
 *
 * Uses aiEngine exclusively; never imports Gemini directly.
 */

"use strict";

const aiEngine = require("./aiEngine");
const { AIValidationError, AIResponseError } = require("./aiErrors");
const {
  generateRequestId,
  logExecutionStart,
  logExecutionSuccess,
  logExecutionFailure,
} = require("./aiLogger");

// ─── Workflow Catalog ─────────────────────────────────────────────────────────

/** @type {Readonly<Record<string, string>>} */
const WORKFLOW_CATALOG = Object.freeze({
  employee_onboarding: "Employee Onboarding",
  leave_approval: "Leave Approval",
  purchase_request: "Purchase Request",
  expense_claim: "Expense Claim",
  vendor_onboarding: "Vendor Onboarding",
  customer_refund: "Customer Refund",
  asset_request: "Asset Request",
  business_travel: "Business Travel",
  performance_review: "Performance Review",
  unknown: "Unknown",
});

/** @type {readonly string[]} */
const SUPPORTED_WORKFLOWS = Object.freeze(Object.keys(WORKFLOW_CATALOG));

const DETECTION_GENERATION_CONFIG = Object.freeze({
  temperature: 0.1,
  topP: 0.9,
  maxOutputTokens: 1024,
});

// ─── Prompt ───────────────────────────────────────────────────────────────────

/**
 * Build the workflow catalogue section for the detection prompt.
 * @returns {string}
 */
const buildWorkflowCatalogPrompt = () => SUPPORTED_WORKFLOWS.map(
  (workflowId) => `- ${workflowId}: ${WORKFLOW_CATALOG[workflowId]}`
).join("\n");

/**
 * Build the system prompt for workflow detection.
 * @param {string} command
 * @param {object} extractedInformation
 * @returns {string}
 */
const buildDetectionPrompt = (command, extractedInformation) => `You are an enterprise workflow detection engine for FlowMind AI.

Determine which workflow should execute based on the business command and extracted information.

RULES:
- Return ONLY valid JSON. No markdown, no code fences, no explanation outside JSON.
- Use AI reasoning to select the best matching workflow.
- Do NOT rely on simple keyword matching alone — consider full business context.
- workflow must be one of the supported workflow identifiers listed below.
- displayName must exactly match the display name for the selected workflow.
- confidence must be a number between 0 and 1 reflecting classification certainty.
- reasoning must be a concise sentence explaining why this workflow was selected.
- If no workflow clearly applies, use workflow "unknown" with displayName "Unknown".

Supported workflows:
${buildWorkflowCatalogPrompt()}

Required JSON shape:
{
  "workflow": "employee_onboarding",
  "displayName": "Employee Onboarding",
  "confidence": 0.0,
  "reasoning": "string"
}

Business command:
"""${command}"""

Extracted information:
${JSON.stringify(extractedInformation, null, 2)}`;

// ─── Validation Helpers ─────────────────────────────────────────────────────────

/**
 * Validate detectWorkflow input parameters.
 * @param {unknown} input
 * @returns {{ command: string, extractedInformation: object }}
 */
const validateInput = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AIValidationError("Input must be a plain object.", { field: "input" });
  }

  if (typeof input.command !== "string" || input.command.trim() === "") {
    throw new AIValidationError("command must be a non-empty string.", { field: "command" });
  }

  if (
    !input.extractedInformation
    || typeof input.extractedInformation !== "object"
    || Array.isArray(input.extractedInformation)
  ) {
    throw new AIValidationError("extractedInformation must be a plain object.", {
      field: "extractedInformation",
    });
  }

  return {
    command: input.command.trim(),
    extractedInformation: input.extractedInformation,
  };
};

/**
 * Validate workflow identifier.
 * @param {unknown} workflow
 */
const validateWorkflow = (workflow) => {
  if (typeof workflow !== "string" || workflow.trim() === "") {
    throw new AIValidationError("workflow must be a non-empty string.", {
      field: "workflow",
      received: workflow,
    });
  }

  if (!SUPPORTED_WORKFLOWS.includes(workflow.trim())) {
    throw new AIValidationError("workflow must be a supported workflow identifier.", {
      field: "workflow",
      received: workflow,
      supportedWorkflows: SUPPORTED_WORKFLOWS,
    });
  }
};

/**
 * Validate displayName field.
 * @param {unknown} displayName
 * @param {string} workflow
 */
const validateDisplayName = (displayName, workflow) => {
  if (typeof displayName !== "string" || displayName.trim() === "") {
    throw new AIValidationError("displayName must be a non-empty string.", {
      field: "displayName",
      received: displayName,
    });
  }

  const expectedDisplayName = WORKFLOW_CATALOG[workflow];

  if (displayName.trim() !== expectedDisplayName) {
    throw new AIValidationError("displayName must match the selected workflow.", {
      field: "displayName",
      received: displayName,
      expected: expectedDisplayName,
      workflow,
    });
  }
};

/**
 * Validate confidence field.
 * @param {unknown} confidence
 */
const validateConfidence = (confidence) => {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    throw new AIValidationError("confidence must be a finite number.", {
      field: "confidence",
      received: confidence,
    });
  }

  if (confidence < 0 || confidence > 1) {
    throw new AIValidationError("confidence must be between 0 and 1 inclusive.", {
      field: "confidence",
      received: confidence,
    });
  }
};

/**
 * Validate reasoning field.
 * @param {unknown} reasoning
 */
const validateReasoning = (reasoning) => {
  if (typeof reasoning !== "string" || reasoning.trim() === "") {
    throw new AIValidationError("reasoning must be a non-empty string.", {
      field: "reasoning",
      received: reasoning,
    });
  }
};

/**
 * Validate the full workflow detection result structure.
 * @param {unknown} result
 * @returns {object}
 */
const validateDetectionResult = (result) => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new AIValidationError("Detection result must be a plain object.", {
      field: "result",
      received: result,
    });
  }

  const workflow = typeof result.workflow === "string" ? result.workflow.trim() : result.workflow;

  validateWorkflow(workflow);
  validateDisplayName(result.displayName, workflow);
  validateConfidence(result.confidence);
  validateReasoning(result.reasoning);

  return {
    workflow,
    displayName: WORKFLOW_CATALOG[workflow],
    confidence: result.confidence,
    reasoning: result.reasoning.trim(),
  };
};

// ─── Response Parsing ───────────────────────────────────────────────────────────

/**
 * Strip markdown code fences from an AI response.
 * @param {string} content
 * @returns {string}
 */
const stripCodeFences = (content) => {
  const trimmed = content.trim();

  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  return trimmed;
};

/**
 * Parse JSON content from an AI response.
 * @param {string} content
 * @returns {object}
 */
const parseJsonResponse = (content) => {
  if (!content || typeof content !== "string") {
    throw new AIResponseError("AI response content is empty or invalid.", {
      field: "content",
    });
  }

  const sanitized = stripCodeFences(content);

  try {
    return JSON.parse(sanitized);
  } catch (error) {
    throw new AIResponseError("Failed to parse AI response as JSON.", {
      cause: error instanceof Error ? error.message : String(error),
      preview: sanitized.slice(0, 200),
    });
  }
};

/**
 * Map an aiEngine failure envelope to a thrown AIError.
 * @param {object} response
 */
const throwEngineFailure = (response) => {
  const errorPayload = response.error || {};
  const message = errorPayload.message || "AI engine execution failed.";
  const code = errorPayload.code;

  if (code === "AI_VALIDATION_ERROR") {
    throw new AIValidationError(message, errorPayload.details || {});
  }

  throw new AIResponseError(message, errorPayload.details || {});
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detect which enterprise workflow should execute for a business command.
 *
 * @param {object} input
 * @param {string} input.command - Original business command
 * @param {object} input.extractedInformation - Structured data from information extraction
 * @returns {Promise<{
 *   workflow: string,
 *   displayName: string,
 *   confidence: number,
 *   reasoning: string
 * }>}
 */
const detectWorkflow = async (input) => {
  const { command, extractedInformation } = validateInput(input);
  const requestId = generateRequestId();

  logExecutionStart(requestId, {
    module: "workflowDetector",
    commandLength: command.length,
  });

  try {
    const response = await aiEngine.execute({
      prompt: buildDetectionPrompt(command, extractedInformation),
      requestId,
      generationConfig: DETECTION_GENERATION_CONFIG,
    });

    if (!response.success) {
      throwEngineFailure(response);
    }

    const parsed = parseJsonResponse(response.data.content);
    const result = validateDetectionResult(parsed);

    logExecutionSuccess(requestId, {
      module: "workflowDetector",
      workflow: result.workflow,
      confidence: result.confidence,
      usage: response.usage,
    });

    return result;
  } catch (error) {
    logExecutionFailure(requestId, {
      module: "workflowDetector",
      code: error.code,
      message: error.message,
    });

    throw error;
  }
};

module.exports = {
  detectWorkflow,
};
