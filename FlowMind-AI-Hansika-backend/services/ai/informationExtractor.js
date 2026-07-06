/**
 * services/ai/informationExtractor.js
 *
 * Converts unstructured natural-language business commands into structured
 * enterprise data. Generic by design — supports current and future workflows.
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

// ─── Schema ───────────────────────────────────────────────────────────────────

/** @type {readonly string[]} */
const EXTRACTED_INFORMATION_FIELDS = Object.freeze([
  "employeeName",
  "role",
  "department",
  "joiningDate",
  "salary",
  "reportingManager",
  "email",
  "phone",
  "location",
  "employmentType",
  "notes",
]);

const EXTRACTION_GENERATION_CONFIG = Object.freeze({
  temperature: 0.1,
  topP: 0.9,
  maxOutputTokens: 2048,
});

// ─── Prompt ───────────────────────────────────────────────────────────────────

/**
 * Build the system prompt for information extraction.
 * @param {string} command
 * @returns {string}
 */
const buildExtractionPrompt = (command) => `You are an enterprise information extraction engine for FlowMind AI.

Extract structured information from the business command below.

RULES:
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- Never hallucinate or invent values not explicitly stated or clearly implied in the command.
- Use null for any field that is missing, unclear, or not mentioned.
- workflowHint must be a snake_case identifier suggesting the most likely workflow (e.g. employee_onboarding, leave_request, travel_request, purchase_request, exit_process, interview_process, general_request).
- confidence must be a number between 0 and 1 reflecting how certain you are about the extraction.
- All extractedInformation values must be either null or a string.

Required JSON shape:
{
  "workflowHint": "string",
  "confidence": 0.0,
  "extractedInformation": {
    "employeeName": null,
    "role": null,
    "department": null,
    "joiningDate": null,
    "salary": null,
    "reportingManager": null,
    "email": null,
    "phone": null,
    "location": null,
    "employmentType": null,
    "notes": null
  }
}

Business command:
"""${command}"""`;

// ─── Validation Helpers ─────────────────────────────────────────────────────────

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const isNullableString = (value) => value === null || typeof value === "string";

/**
 * Validate the input command string.
 * @param {unknown} command
 */
const validateCommand = (command) => {
  if (typeof command !== "string" || command.trim() === "") {
    throw new AIValidationError("Command must be a non-empty string.", { field: "command" });
  }
};

/**
 * Validate workflowHint field.
 * @param {unknown} workflowHint
 */
const validateWorkflowHint = (workflowHint) => {
  if (typeof workflowHint !== "string" || workflowHint.trim() === "") {
    throw new AIValidationError("workflowHint must be a non-empty string.", {
      field: "workflowHint",
      received: workflowHint,
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
 * Validate extractedInformation object structure.
 * @param {unknown} extractedInformation
 */
const validateExtractedInformation = (extractedInformation) => {
  if (!extractedInformation || typeof extractedInformation !== "object" || Array.isArray(extractedInformation)) {
    throw new AIValidationError("extractedInformation must be a plain object.", {
      field: "extractedInformation",
      received: extractedInformation,
    });
  }

  const missingFields = EXTRACTED_INFORMATION_FIELDS.filter(
    (field) => !Object.prototype.hasOwnProperty.call(extractedInformation, field)
  );

  if (missingFields.length > 0) {
    throw new AIValidationError("extractedInformation is missing required fields.", {
      field: "extractedInformation",
      missingFields,
    });
  }

  const invalidFields = EXTRACTED_INFORMATION_FIELDS.filter(
    (field) => !isNullableString(extractedInformation[field])
  );

  if (invalidFields.length > 0) {
    throw new AIValidationError("extractedInformation fields must be null or string.", {
      field: "extractedInformation",
      invalidFields,
    });
  }
};

/**
 * Validate the full extraction result structure.
 * @param {unknown} result
 * @returns {object}
 */
const validateExtractionResult = (result) => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new AIValidationError("Extraction result must be a plain object.", {
      field: "result",
      received: result,
    });
  }

  validateWorkflowHint(result.workflowHint);
  validateConfidence(result.confidence);
  validateExtractedInformation(result.extractedInformation);

  return {
    workflowHint: result.workflowHint.trim(),
    confidence: result.confidence,
    extractedInformation: EXTRACTED_INFORMATION_FIELDS.reduce((acc, field) => {
      const value = result.extractedInformation[field];
      acc[field] = value === null ? null : String(value).trim() || null;
      return acc;
    }, {}),
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
 * Extract structured enterprise information from a natural-language command.
 *
 * @param {string} command - Unstructured business command
 * @returns {Promise<{
 *   workflowHint: string,
 *   confidence: number,
 *   extractedInformation: object
 * }>}
 */
const extractInformation = async (command) => {
  validateCommand(command);

  const requestId = generateRequestId();
  const trimmedCommand = command.trim();

  logExecutionStart(requestId, {
    module: "informationExtractor",
    commandLength: trimmedCommand.length,
  });

  try {
    const response = await aiEngine.execute({
      prompt: buildExtractionPrompt(trimmedCommand),
      requestId,
      generationConfig: EXTRACTION_GENERATION_CONFIG,
    });

    if (!response.success) {
      throwEngineFailure(response);
    }

    const parsed = parseJsonResponse(response.data.content);
    const result = validateExtractionResult(parsed);

    logExecutionSuccess(requestId, {
      module: "informationExtractor",
      workflowHint: result.workflowHint,
      confidence: result.confidence,
      usage: response.usage,
    });

    return result;
  } catch (error) {
    logExecutionFailure(requestId, {
      module: "informationExtractor",
      code: error.code,
      message: error.message,
    });

    throw error;
  }
};

module.exports = {
  extractInformation,
};
