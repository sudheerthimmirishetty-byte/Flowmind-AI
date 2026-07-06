/**
 * services/ai/recommendationEngine.js
 *
 * Intelligently recommends resources required to execute a workflow successfully
 * by analyzing the detected workflow, extracted information, workflow plan, and
 * department tasks. Generic by design — supports current and future workflows
 * without architectural changes.
 *
 * Uses aiEngine exclusively; never imports Gemini directly.
 * Recommendations only — does not generate tasks, workflow plans, documents,
 * calendar events, or notifications.
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
const PRIORITY_LEVELS = Object.freeze(["High", "Medium", "Low"]);

const RECOMMENDATION_GENERATION_CONFIG = Object.freeze({
  temperature: 0.3,
  topP: 0.9,
  maxOutputTokens: 4096,
});

// ─── Prompt ───────────────────────────────────────────────────────────────────

/**
 * Build the system prompt for intelligent recommendation generation.
 * @param {string} workflow
 * @param {object} extractedInformation
 * @param {object} workflowPlan
 * @param {object} departmentTasks
 * @returns {string}
 */
const buildRecommendationPrompt = (
  workflow,
  extractedInformation,
  workflowPlan,
  departmentTasks
) => `You are an enterprise intelligent recommendation engine for FlowMind AI.

Analyze the workflow context and recommend the resources required to execute the workflow successfully.

RULES:
- Return ONLY valid JSON. No markdown, no code fences, no explanation outside JSON.
- Use AI reasoning to determine appropriate recommendations based on workflow type, role, department, plan, tasks, and organization context.
- Do NOT rely on keyword matching or hardcoded recommendation tables — tailor recommendations to the specific context.
- Do NOT generate department tasks, workflow plans, documents, calendar events, or notifications. Recommendations only.
- workflow in the response must exactly match the input workflow identifier.
- recommendations must be a non-empty array of category groups.
- Each recommendation must include category (string) and items (non-empty array).
- Each item must include name (string), reason (string), and priority (High, Medium, or Low).
- Categories should reflect logical resource groupings (e.g. Hardware, Software, Accounts, Access, Training, Facilities).
- reason must explain why the resource is needed in the context of this workflow.
- confidence must be a number between 0 and 1 reflecting recommendation certainty.

Required JSON shape:
{
  "workflow": "string",
  "confidence": 0.0,
  "recommendations": [
    {
      "category": "string",
      "items": [
        {
          "name": "string",
          "reason": "string",
          "priority": "High | Medium | Low"
        }
      ]
    }
  ]
}

Workflow:
"""${workflow}"""

Workflow plan:
${JSON.stringify(workflowPlan, null, 2)}

Department tasks:
${JSON.stringify(departmentTasks, null, 2)}

Extracted information:
${JSON.stringify(extractedInformation, null, 2)}`;

// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Validate generateRecommendations input parameters.
 * @param {unknown} input
 * @returns {{
 *   workflow: string,
 *   extractedInformation: object,
 *   workflowPlan: object,
 *   departmentTasks: object
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
    !Array.isArray(input.departmentTasks.departments)
    || input.departmentTasks.departments.length === 0
  ) {
    throw new AIValidationError("departmentTasks.departments must be a non-empty array.", {
      field: "departmentTasks.departments",
    });
  }

  return {
    workflow,
    extractedInformation: input.extractedInformation,
    workflowPlan: input.workflowPlan,
    departmentTasks: input.departmentTasks,
  };
};

/**
 * Validate workflow field in the recommendation result.
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
 * Validate priority field.
 * @param {unknown} priority
 * @param {string} field
 * @returns {string}
 */
const validatePriority = (priority, field) => {
  if (typeof priority !== "string" || priority.trim() === "") {
    throw new AIValidationError(`${field} must be a non-empty string.`, {
      field,
      received: priority,
    });
  }

  const normalized = PRIORITY_LEVELS.find(
    (level) => level.toLowerCase() === priority.trim().toLowerCase()
  );

  if (!normalized) {
    throw new AIValidationError(`${field} must be one of: High, Medium, Low.`, {
      field,
      received: priority,
      allowed: PRIORITY_LEVELS,
    });
  }

  return normalized;
};

/**
 * Validate a single recommendation item.
 * @param {unknown} item
 * @param {number} index
 * @param {number} categoryIndex
 * @param {Set<string>} seenItemNames
 * @returns {object}
 */
const validateRecommendationItem = (item, index, categoryIndex, seenItemNames) => {
  const fieldPrefix = `recommendations[${categoryIndex}].items[${index}]`;

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new AIValidationError(`${fieldPrefix} must be a plain object.`, {
      field: fieldPrefix,
      received: item,
    });
  }

  if (typeof item.name !== "string" || item.name.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.name must be a non-empty string.`, {
      field: `${fieldPrefix}.name`,
      received: item.name,
    });
  }

  if (typeof item.reason !== "string" || item.reason.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.reason must be a non-empty string.`, {
      field: `${fieldPrefix}.reason`,
      received: item.reason,
    });
  }

  const name = item.name.trim();
  const nameKey = name.toLowerCase();

  if (seenItemNames.has(nameKey)) {
    throw new AIValidationError(`${fieldPrefix}.name must be unique across all recommendations.`, {
      field: `${fieldPrefix}.name`,
      received: name,
    });
  }

  seenItemNames.add(nameKey);

  const priority = validatePriority(item.priority, `${fieldPrefix}.priority`);

  return {
    name,
    reason: item.reason.trim(),
    priority,
  };
};

/**
 * Validate a single recommendation category group.
 * @param {unknown} entry
 * @param {number} index
 * @param {Set<string>} seenCategories
 * @param {Set<string>} seenItemNames
 * @returns {object}
 */
const validateRecommendationCategory = (entry, index, seenCategories, seenItemNames) => {
  const fieldPrefix = `recommendations[${index}]`;

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new AIValidationError(`${fieldPrefix} must be a plain object.`, {
      field: fieldPrefix,
      received: entry,
    });
  }

  if (typeof entry.category !== "string" || entry.category.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.category must be a non-empty string.`, {
      field: `${fieldPrefix}.category`,
      received: entry.category,
    });
  }

  const category = entry.category.trim();
  const categoryKey = category.toLowerCase();

  if (seenCategories.has(categoryKey)) {
    throw new AIValidationError(`${fieldPrefix}.category must be unique.`, {
      field: `${fieldPrefix}.category`,
      received: category,
    });
  }

  seenCategories.add(categoryKey);

  if (!Array.isArray(entry.items) || entry.items.length === 0) {
    throw new AIValidationError(`${fieldPrefix}.items must be a non-empty array.`, {
      field: `${fieldPrefix}.items`,
      received: entry.items,
    });
  }

  const items = entry.items.map((item, itemIndex) => validateRecommendationItem(
    item,
    itemIndex,
    index,
    seenItemNames
  ));

  return {
    category,
    items,
  };
};

/**
 * Validate recommendations array in the result.
 * @param {unknown} recommendations
 * @returns {object[]}
 */
const validateRecommendations = (recommendations) => {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    throw new AIValidationError("recommendations must be a non-empty array.", {
      field: "recommendations",
      received: recommendations,
    });
  }

  const seenCategories = new Set();
  const seenItemNames = new Set();

  return recommendations.map((entry, index) => validateRecommendationCategory(
    entry,
    index,
    seenCategories,
    seenItemNames
  ));
};

/**
 * Validate the full recommendation generation result structure.
 * @param {unknown} result
 * @param {string} expectedWorkflow
 * @returns {object}
 */
const validateRecommendationResult = (result, expectedWorkflow) => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new AIValidationError("Recommendation result must be a plain object.", {
      field: "result",
      received: result,
    });
  }

  validateWorkflow(result.workflow, expectedWorkflow);
  validateConfidence(result.confidence);

  const recommendations = validateRecommendations(result.recommendations);

  return {
    workflow: expectedWorkflow,
    confidence: result.confidence,
    recommendations,
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
 * Generate intelligent resource recommendations for a workflow.
 *
 * @param {object} input
 * @param {string} input.workflow - Detected workflow identifier
 * @param {object} input.extractedInformation - Structured data from information extraction
 * @param {object} input.workflowPlan - Execution plan from workflow planner
 * @param {object} input.departmentTasks - Department tasks from task generator
 * @returns {Promise<{
 *   workflow: string,
 *   confidence: number,
 *   recommendations: Array<{
 *     category: string,
 *     items: Array<{
 *       name: string,
 *       reason: string,
 *       priority: string
 *     }>
 *   }>
 * }>}
 */
const generateRecommendations = async (input) => {
  const {
    workflow,
    extractedInformation,
    workflowPlan,
    departmentTasks,
  } = validateInput(input);
  const requestId = generateRequestId();

  logExecutionStart(requestId, {
    module: "recommendationEngine",
    workflow,
    departmentCount: departmentTasks.departments.length,
  });

  try {
    const response = await aiEngine.execute({
      prompt: buildRecommendationPrompt(
        workflow,
        extractedInformation,
        workflowPlan,
        departmentTasks
      ),
      requestId,
      generationConfig: RECOMMENDATION_GENERATION_CONFIG,
    });

    if (!response.success) {
      throwEngineFailure(response);
    }

    const parsed = parseJsonResponse(response.data.content);
    const result = validateRecommendationResult(parsed, workflow);

    logExecutionSuccess(requestId, {
      module: "recommendationEngine",
      workflow: result.workflow,
      categoryCount: result.recommendations.length,
      itemCount: result.recommendations.reduce(
        (count, entry) => count + entry.items.length,
        0
      ),
      confidence: result.confidence,
      usage: response.usage,
    });

    return result;
  } catch (error) {
    logExecutionFailure(requestId, {
      module: "recommendationEngine",
      code: error.code,
      message: error.message,
    });

    throw error;
  }
};

module.exports = {
  generateRecommendations,
};
