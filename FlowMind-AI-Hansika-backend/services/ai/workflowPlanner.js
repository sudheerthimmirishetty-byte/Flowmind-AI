/**
 * services/ai/workflowPlanner.js
 *
 * Dynamically creates enterprise execution plans from a detected workflow and
 * extracted information. Generic by design — supports current and future
 * workflows without architectural changes.
 *
 * Uses aiEngine exclusively; never imports Gemini directly.
 * Planning only — does not generate tasks, documents, notifications, or events.
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
const COMPLEXITY_LEVELS = Object.freeze(["low", "medium", "high"]);

const PLANNING_GENERATION_CONFIG = Object.freeze({
  temperature: 0.2,
  topP: 0.9,
  maxOutputTokens: 4096,
});

// ─── Prompt ───────────────────────────────────────────────────────────────────

/**
 * Build the system prompt for workflow planning.
 * @param {string} workflow
 * @param {object} extractedInformation
 * @returns {string}
 */
const buildPlanningPrompt = (workflow, extractedInformation) => `You are an enterprise workflow planning engine for FlowMind AI.

Create a dynamic execution plan for the given workflow using the extracted business information.

RULES:
- Return ONLY valid JSON. No markdown, no code fences, no explanation outside JSON.
- Use AI reasoning to determine departments, execution stages, dependencies, estimated duration, and complexity based on the workflow type and context.
- Do NOT hardcode a generic template — tailor the plan to the specific workflow and extracted information.
- Do NOT generate tasks, recommendations, documents, notifications, or calendar events. Planning structure only.
- workflow in the response must exactly match the input workflow identifier.
- departments must list every department involved across all stages (unique values).
- executionStages must be ordered by stage number starting at 1 with no gaps.
- Each execution stage must include stage (number), name (string), departments (string array), and dependsOn (string array of department names that must complete before this stage).
- dependsOn may be empty for stages with no prerequisites.
- estimatedDuration must be a human-readable duration (e.g. "30 minutes", "2 hours", "1 day").
- complexity must be one of: low, medium, high.
- confidence must be a number between 0 and 1 reflecting planning certainty.

Required JSON shape:
{
  "workflow": "string",
  "estimatedDuration": "string",
  "complexity": "low | medium | high",
  "departments": ["string"],
  "executionStages": [
    {
      "stage": 1,
      "name": "string",
      "departments": ["string"],
      "dependsOn": ["string"]
    }
  ],
  "confidence": 0.0
}

Workflow:
"""${workflow}"""

Extracted information:
${JSON.stringify(extractedInformation, null, 2)}`;

// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Validate planWorkflow input parameters.
 * @param {unknown} input
 * @returns {{ workflow: string, extractedInformation: object }}
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

  return {
    workflow: input.workflow.trim(),
    extractedInformation: input.extractedInformation,
  };
};

/**
 * Validate workflow field in the planning result.
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
 * Validate estimatedDuration field.
 * @param {unknown} estimatedDuration
 */
const validateEstimatedDuration = (estimatedDuration) => {
  if (typeof estimatedDuration !== "string" || estimatedDuration.trim() === "") {
    throw new AIValidationError("estimatedDuration must be a non-empty string.", {
      field: "estimatedDuration",
      received: estimatedDuration,
    });
  }
};

/**
 * Validate complexity field.
 * @param {unknown} complexity
 * @returns {string}
 */
const validateComplexity = (complexity) => {
  if (typeof complexity !== "string" || complexity.trim() === "") {
    throw new AIValidationError("complexity must be a non-empty string.", {
      field: "complexity",
      received: complexity,
    });
  }

  const normalized = complexity.trim().toLowerCase();

  if (!COMPLEXITY_LEVELS.includes(normalized)) {
    throw new AIValidationError("complexity must be one of: low, medium, high.", {
      field: "complexity",
      received: complexity,
      allowed: COMPLEXITY_LEVELS,
    });
  }

  return normalized;
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
 * Validate a string array field containing non-empty strings.
 * @param {unknown} value
 * @param {string} field
 * @param {object} [options]
 * @param {boolean} [options.allowEmpty=false]
 * @returns {string[]}
 */
const validateStringArray = (value, field, options = {}) => {
  const { allowEmpty = false } = options;

  if (!Array.isArray(value)) {
    throw new AIValidationError(`${field} must be an array.`, {
      field,
      received: value,
    });
  }

  if (!allowEmpty && value.length === 0) {
    throw new AIValidationError(`${field} must be a non-empty array.`, {
      field,
      received: value,
    });
  }

  const invalidEntries = value.filter(
    (entry) => typeof entry !== "string" || entry.trim() === ""
  );

  if (invalidEntries.length > 0) {
    throw new AIValidationError(`${field} must contain only non-empty strings.`, {
      field,
      invalidEntries,
    });
  }

  return value.map((entry) => entry.trim());
};

/**
 * Validate departments field.
 * @param {unknown} departments
 * @returns {string[]}
 */
const validateDepartments = (departments) => validateStringArray(departments, "departments");

/**
 * Validate a single execution stage.
 * @param {unknown} stage
 * @param {number} index
 * @param {ReadonlySet<string>} knownDepartments
 * @returns {object}
 */
const validateExecutionStage = (stage, index, knownDepartments) => {
  const fieldPrefix = `executionStages[${index}]`;

  if (!stage || typeof stage !== "object" || Array.isArray(stage)) {
    throw new AIValidationError(`${fieldPrefix} must be a plain object.`, {
      field: fieldPrefix,
      received: stage,
    });
  }

  if (typeof stage.stage !== "number" || !Number.isInteger(stage.stage) || stage.stage < 1) {
    throw new AIValidationError(`${fieldPrefix}.stage must be a positive integer.`, {
      field: `${fieldPrefix}.stage`,
      received: stage.stage,
    });
  }

  if (typeof stage.name !== "string" || stage.name.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.name must be a non-empty string.`, {
      field: `${fieldPrefix}.name`,
      received: stage.name,
    });
  }

  const stageDepartments = validateStringArray(stage.departments, `${fieldPrefix}.departments`);

  const unknownStageDepartments = stageDepartments.filter(
    (department) => !knownDepartments.has(department)
  );

  if (unknownStageDepartments.length > 0) {
    throw new AIValidationError(
      `${fieldPrefix}.departments must only reference departments listed in departments.`,
      {
        field: `${fieldPrefix}.departments`,
        unknownDepartments: unknownStageDepartments,
      }
    );
  }

  const dependsOn = validateStringArray(
    stage.dependsOn,
    `${fieldPrefix}.dependsOn`,
    { allowEmpty: true }
  );

  const unknownDependencies = dependsOn.filter(
    (department) => !knownDepartments.has(department)
  );

  if (unknownDependencies.length > 0) {
    throw new AIValidationError(
      `${fieldPrefix}.dependsOn must only reference departments listed in departments.`,
      {
        field: `${fieldPrefix}.dependsOn`,
        unknownDepartments: unknownDependencies,
      }
    );
  }

  return {
    stage: stage.stage,
    name: stage.name.trim(),
    departments: stageDepartments,
    dependsOn,
  };
};

/**
 * Validate executionStages field.
 * @param {unknown} executionStages
 * @param {ReadonlySet<string>} knownDepartments
 * @returns {object[]}
 */
const validateExecutionStages = (executionStages, knownDepartments) => {
  if (!Array.isArray(executionStages) || executionStages.length === 0) {
    throw new AIValidationError("executionStages must be a non-empty array.", {
      field: "executionStages",
      received: executionStages,
    });
  }

  const validatedStages = executionStages.map((stage, index) => validateExecutionStage(
    stage,
    index,
    knownDepartments
  ));

  const stageNumbers = validatedStages.map((stage) => stage.stage);
  const uniqueStageNumbers = new Set(stageNumbers);

  if (uniqueStageNumbers.size !== stageNumbers.length) {
    throw new AIValidationError("executionStages must have unique stage numbers.", {
      field: "executionStages",
      stageNumbers,
    });
  }

  const sortedStageNumbers = [...stageNumbers].sort((a, b) => a - b);
  const expectedSequence = validatedStages.map((_, index) => index + 1);

  const isSequential = sortedStageNumbers.every(
    (stageNumber, index) => stageNumber === expectedSequence[index]
  );

  if (!isSequential) {
    throw new AIValidationError(
      "executionStages must be numbered sequentially starting at 1 with no gaps.",
      {
        field: "executionStages",
        stageNumbers: sortedStageNumbers,
      }
    );
  }

  validatedStages.sort((a, b) => a.stage - b.stage);

  return validatedStages;
};

/**
 * Validate the full workflow planning result structure.
 * @param {unknown} result
 * @param {string} expectedWorkflow
 * @returns {object}
 */
const validatePlanningResult = (result, expectedWorkflow) => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new AIValidationError("Planning result must be a plain object.", {
      field: "result",
      received: result,
    });
  }

  validateWorkflow(result.workflow, expectedWorkflow);
  validateEstimatedDuration(result.estimatedDuration);

  const complexity = validateComplexity(result.complexity);
  const departments = validateDepartments(result.departments);
  const knownDepartments = new Set(departments);
  const executionStages = validateExecutionStages(result.executionStages, knownDepartments);

  validateConfidence(result.confidence);

  const referencedDepartments = new Set(
    executionStages.flatMap((stage) => stage.departments)
  );

  const unreferencedDepartments = departments.filter(
    (department) => !referencedDepartments.has(department)
  );

  if (unreferencedDepartments.length > 0) {
    throw new AIValidationError(
      "All departments must be referenced by at least one execution stage.",
      {
        field: "departments",
        unreferencedDepartments,
      }
    );
  }

  return {
    workflow: expectedWorkflow,
    estimatedDuration: result.estimatedDuration.trim(),
    complexity,
    departments,
    executionStages,
    confidence: result.confidence,
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
 * Create a dynamic enterprise execution plan for a detected workflow.
 *
 * @param {object} input
 * @param {string} input.workflow - Detected workflow identifier
 * @param {object} input.extractedInformation - Structured data from information extraction
 * @returns {Promise<{
 *   workflow: string,
 *   estimatedDuration: string,
 *   complexity: string,
 *   departments: string[],
 *   executionStages: Array<{
 *     stage: number,
 *     name: string,
 *     departments: string[],
 *     dependsOn: string[]
 *   }>,
 *   confidence: number
 * }>}
 */
const planWorkflow = async (input) => {
  const { workflow, extractedInformation } = validateInput(input);
  const requestId = generateRequestId();

  logExecutionStart(requestId, {
    module: "workflowPlanner",
    workflow,
  });

  try {
    const response = await aiEngine.execute({
      prompt: buildPlanningPrompt(workflow, extractedInformation),
      requestId,
      generationConfig: PLANNING_GENERATION_CONFIG,
    });

    if (!response.success) {
      throwEngineFailure(response);
    }

    const parsed = parseJsonResponse(response.data.content);
    const result = validatePlanningResult(parsed, workflow);

    logExecutionSuccess(requestId, {
      module: "workflowPlanner",
      workflow: result.workflow,
      complexity: result.complexity,
      stageCount: result.executionStages.length,
      confidence: result.confidence,
      usage: response.usage,
    });

    return result;
  } catch (error) {
    logExecutionFailure(requestId, {
      module: "workflowPlanner",
      code: error.code,
      message: error.message,
    });

    throw error;
  }
};

module.exports = {
  planWorkflow,
};
