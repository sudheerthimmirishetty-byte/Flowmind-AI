/**
 * services/ai/documentGenerator.js
 *
 * Generates all business documents required for a workflow by analyzing the
 * detected workflow, extracted information, workflow plan, department tasks,
 * and recommendations. Generic by design — supports current and future
 * workflows without architectural changes.
 *
 * Uses aiEngine exclusively; never imports Gemini directly.
 * Documents only — does not generate workflow plans, department tasks,
 * recommendations, calendar events, or notifications.
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

// ─── Constants ────────────────────────────────────────────────────────────────

/** @type {readonly string[]} */
const DOCUMENT_FORMATS = Object.freeze(["text", "html", "markdown"]);

const DOCUMENT_GENERATION_CONFIG = Object.freeze({
  temperature: 0.4,
  topP: 0.9,
  maxOutputTokens: 16384,
});

// ─── Prompt ───────────────────────────────────────────────────────────────────

/**
 * Build the system prompt for business document generation.
 * @param {string} workflow
 * @param {object} extractedInformation
 * @param {object} workflowPlan
 * @param {object} departmentTasks
 * @param {object} recommendations
 * @returns {string}
 */
const buildDocumentGenerationPrompt = (
  workflow,
  extractedInformation,
  workflowPlan,
  departmentTasks,
  recommendations
) => `You are an enterprise business document generation engine for FlowMind AI.

Analyze the workflow context and generate all business documents required to execute the workflow successfully.

RULES:
- Return ONLY valid JSON. No markdown code fences wrapping the outer response, no explanation outside JSON.
- Use AI reasoning to determine which documents are required based on workflow type, extracted information, plan, tasks, and recommendations.
- Do NOT hardcode document templates — generate document content dynamically and contextually.
- Do NOT generate workflow plans, department tasks, recommendations, calendar events, or notifications. Business documents only.
- workflow in the response must exactly match the input workflow identifier.
- documents must be a non-empty array of generated business documents.
- Each document must include type, title, content, and format.
- type must describe the document category (e.g. Offer Letter, Appointment Letter, Welcome Email, Onboarding Checklist).
- title must be a descriptive document title appropriate for the workflow context.
- content must contain the full generated document body as a string.
- format must be one of: text, html, markdown.
- Document types must be unique within the documents array.
- confidence must be a number between 0 and 1 reflecting generation certainty.

Required JSON shape:
{
  "workflow": "string",
  "confidence": 0.0,
  "documents": [
    {
      "type": "string",
      "title": "string",
      "content": "string",
      "format": "text | html | markdown"
    }
  ]
}

Workflow:
"""${workflow}"""

Workflow plan:
${JSON.stringify(workflowPlan, null, 2)}

Department tasks:
${JSON.stringify(departmentTasks, null, 2)}

Recommendations:
${JSON.stringify(recommendations, null, 2)}

Extracted information:
${JSON.stringify(extractedInformation, null, 2)}`;

// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Validate generateDocuments input parameters.
 * @param {unknown} input
 * @returns {{
 *   workflow: string,
 *   extractedInformation: object,
 *   workflowPlan: object,
 *   departmentTasks: object,
 *   recommendations: object
 * }}
 */
const validateInput = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AIValidationError("Input must be a plain object.", { field: "input" });
  }

  if (typeof input.workflow !== "string" || input.workflow.trim() === "") {
    throw new AIValidationError("workflow must be a non-empty string.", { field: "workflow" });
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

  if (
    !input.workflowPlan
    || typeof input.workflowPlan !== "object"
    || Array.isArray(input.workflowPlan)
  ) {
    throw new AIValidationError("workflowPlan must be a plain object.", {
      field: "workflowPlan",
    });
  }

  if (
    !input.departmentTasks
    || typeof input.departmentTasks !== "object"
    || Array.isArray(input.departmentTasks)
  ) {
    throw new AIValidationError("departmentTasks must be a plain object.", {
      field: "departmentTasks",
    });
  }

  if (
    !input.recommendations
    || typeof input.recommendations !== "object"
    || Array.isArray(input.recommendations)
  ) {
    throw new AIValidationError("recommendations must be a plain object.", {
      field: "recommendations",
    });
  }

  const workflow = input.workflow.trim();

  if (
    typeof input.workflowPlan.workflow === "string"
    && input.workflowPlan.workflow.trim() !== workflow
  ) {
    throw new AIValidationError("workflowPlan.workflow must match the requested workflow identifier.", {
      field: "workflowPlan.workflow",
      received: input.workflowPlan.workflow,
      expected: workflow,
    });
  }

  if (
    typeof input.departmentTasks.workflow === "string"
    && input.departmentTasks.workflow.trim() !== workflow
  ) {
    throw new AIValidationError(
      "departmentTasks.workflow must match the requested workflow identifier.",
      {
        field: "departmentTasks.workflow",
        received: input.departmentTasks.workflow,
        expected: workflow,
      }
    );
  }

  if (
    typeof input.recommendations.workflow === "string"
    && input.recommendations.workflow.trim() !== workflow
  ) {
    throw new AIValidationError(
      "recommendations.workflow must match the requested workflow identifier.",
      {
        field: "recommendations.workflow",
        received: input.recommendations.workflow,
        expected: workflow,
      }
    );
  }

  if (
    !Array.isArray(input.departmentTasks.departments)
    || input.departmentTasks.departments.length === 0
  ) {
    throw new AIValidationError("departmentTasks.departments must be a non-empty array.", {
      field: "departmentTasks.departments",
    });
  }

  if (
    !Array.isArray(input.recommendations.recommendations)
    || input.recommendations.recommendations.length === 0
  ) {
    throw new AIValidationError("recommendations.recommendations must be a non-empty array.", {
      field: "recommendations.recommendations",
    });
  }

  return {
    workflow,
    extractedInformation: input.extractedInformation,
    workflowPlan: input.workflowPlan,
    departmentTasks: input.departmentTasks,
    recommendations: input.recommendations,
  };
};

/**
 * Validate workflow field in the document generation result.
 * @param {unknown} workflow
 * @param {string} expectedWorkflow
 */
const validateWorkflow = (workflow, expectedWorkflow) => {
  if (typeof workflow !== "string" || workflow.trim() === "") {
    throw new AIValidationError("workflow must be a non-empty string.", {
      field: "workflow",
      received: workflow,
    });
  }

  if (workflow.trim() !== expectedWorkflow) {
    throw new AIValidationError("workflow must match the requested workflow identifier.", {
      field: "workflow",
      received: workflow,
      expected: expectedWorkflow,
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
 * Validate document format field.
 * @param {unknown} format
 * @param {string} field
 * @returns {string}
 */
const validateFormat = (format, field) => {
  if (typeof format !== "string" || format.trim() === "") {
    throw new AIValidationError(`${field} must be a non-empty string.`, {
      field,
      received: format,
    });
  }

  const normalized = DOCUMENT_FORMATS.find(
    (value) => value.toLowerCase() === format.trim().toLowerCase()
  );

  if (!normalized) {
    throw new AIValidationError(`${field} must be one of: text, html, markdown.`, {
      field,
      received: format,
      allowed: DOCUMENT_FORMATS,
    });
  }

  return normalized;
};

/**
 * Validate a single generated document.
 * @param {unknown} document
 * @param {number} index
 * @param {Set<string>} seenDocumentTypes
 * @returns {object}
 */
const validateDocument = (document, index, seenDocumentTypes) => {
  const fieldPrefix = `documents[${index}]`;

  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new AIValidationError(`${fieldPrefix} must be a plain object.`, {
      field: fieldPrefix,
      received: document,
    });
  }

  if (typeof document.type !== "string" || document.type.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.type must be a non-empty string.`, {
      field: `${fieldPrefix}.type`,
      received: document.type,
    });
  }

  const type = document.type.trim();
  const typeKey = type.toLowerCase();

  if (seenDocumentTypes.has(typeKey)) {
    throw new AIValidationError(`${fieldPrefix}.type must be unique within documents.`, {
      field: `${fieldPrefix}.type`,
      received: type,
    });
  }

  seenDocumentTypes.add(typeKey);

  if (typeof document.title !== "string" || document.title.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.title must be a non-empty string.`, {
      field: `${fieldPrefix}.title`,
      received: document.title,
    });
  }

  if (typeof document.content !== "string" || document.content.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.content must be a non-empty string.`, {
      field: `${fieldPrefix}.content`,
      received: document.content,
    });
  }

  const format = validateFormat(document.format, `${fieldPrefix}.format`);

  return {
    type,
    title: document.title.trim(),
    content: document.content,
    format,
  };
};

/**
 * Validate documents array in the result.
 * @param {unknown} documents
 * @returns {object[]}
 */
const validateDocuments = (documents) => {
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new AIValidationError("documents must be a non-empty array.", {
      field: "documents",
      received: documents,
    });
  }

  const seenDocumentTypes = new Set();

  return documents.map((document, index) => validateDocument(
    document,
    index,
    seenDocumentTypes
  ));
};

/**
 * Validate the full document generation result structure.
 * @param {unknown} result
 * @param {string} expectedWorkflow
 * @returns {object}
 */
const validateDocumentGenerationResult = (result, expectedWorkflow) => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new AIValidationError("Document generation result must be a plain object.", {
      field: "result",
      received: result,
    });
  }

  validateWorkflow(result.workflow, expectedWorkflow);
  validateConfidence(result.confidence);

  const documents = validateDocuments(result.documents);

  return {
    workflow: expectedWorkflow,
    confidence: result.confidence,
    documents,
  };
};

// ─── Response Parsing ─────────────────────────────────────────────────────────

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
 * Generate all business documents required for a workflow.
 *
 * @param {object} input
 * @param {string} input.workflow - Detected workflow identifier
 * @param {object} input.extractedInformation - Structured data from information extraction
 * @param {object} input.workflowPlan - Execution plan from workflow planner
 * @param {object} input.departmentTasks - Department tasks from task generator
 * @param {object} input.recommendations - Recommendations from recommendation engine
 * @returns {Promise<{
 *   workflow: string,
 *   confidence: number,
 *   documents: Array<{
 *     type: string,
 *     title: string,
 *     content: string,
 *     format: string
 *   }>
 * }>}
 */
const generateDocuments = async (input) => {
  const {
    workflow,
    extractedInformation,
    workflowPlan,
    departmentTasks,
    recommendations,
  } = validateInput(input);
  const requestId = generateRequestId();

  logExecutionStart(requestId, {
    module: "documentGenerator",
    workflow,
    departmentCount: departmentTasks.departments.length,
    recommendationCount: recommendations.recommendations.length,
  });

  try {
    const response = await aiEngine.execute({
      prompt: buildDocumentGenerationPrompt(
        workflow,
        extractedInformation,
        workflowPlan,
        departmentTasks,
        recommendations
      ),
      requestId,
      generationConfig: DOCUMENT_GENERATION_CONFIG,
    });

    if (!response.success) {
      throwEngineFailure(response);
    }

    const parsed = parseJsonResponse(response.data.content);
    const result = validateDocumentGenerationResult(parsed, workflow);

    logExecutionSuccess(requestId, {
      module: "documentGenerator",
      workflow: result.workflow,
      documentCount: result.documents.length,
      confidence: result.confidence,
      usage: response.usage,
    });

    return result;
  } catch (error) {
    logExecutionFailure(requestId, {
      module: "documentGenerator",
      code: error.code,
      message: error.message,
    });

    throw error;
  }
};

module.exports = {
  generateDocuments,
};
