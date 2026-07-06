/**
 * services/ai/taskGenerator.js
 *
 * Dynamically generates executable department-wise tasks from a detected
 * workflow, extracted information, and workflow plan. Generic by design —
 * supports current and future workflows without architectural changes.
 *
 * Uses aiEngine exclusively; never imports Gemini directly.
 * Task generation only — does not generate recommendations, documents,
 * workflow plans, calendar events, or notifications.
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

/** @type {readonly string[]} */
const TASK_STATUSES = Object.freeze(["Pending", "In Progress", "Completed", "Cancelled"]);

/** @type {RegExp} */
const TASK_ID_PATTERN = /^[A-Z][A-Z0-9]*-\d{3,}$/;

const TASK_GENERATION_CONFIG = Object.freeze({
  temperature: 0.2,
  topP: 0.9,
  maxOutputTokens: 8192,
});

// ─── Prompt ───────────────────────────────────────────────────────────────────

/**
 * Build the system prompt for department task generation.
 * @param {string} workflow
 * @param {object} extractedInformation
 * @param {object} workflowPlan
 * @returns {string}
 */
const buildTaskGenerationPrompt = (workflow, extractedInformation, workflowPlan) => `You are an enterprise department task generation engine for FlowMind AI.

Generate executable department-wise tasks for the given workflow using the workflow plan, departments, and extracted business information.

RULES:
- Return ONLY valid JSON. No markdown, no code fences, no explanation outside JSON.
- Use AI reasoning to determine appropriate tasks for each department based on the workflow type, plan, and context.
- Do NOT hardcode a generic task list — tailor tasks to the specific workflow and extracted information.
- Do NOT generate recommendations, documents, workflow plans, calendar events, or notifications. Department tasks only.
- workflow in the response must exactly match the input workflow identifier.
- departments must be an array covering every department listed in the workflow plan.
- Each department entry must include department (string) and tasks (non-empty array).
- Each task must include id, title, description, priority, estimatedMinutes, and status.
- Task id format must be {DEPARTMENT_PREFIX}-{NUMBER} (e.g. HR-001, FINANCE-002).
- TASK ID PREFIX RULES (strict — validation will reject abbreviations):
  - Never invent abbreviations (e.g. do NOT use MGMT, FIN, COMM, ADMIN).
  - Never shorten department names.
  - Derive the prefix ONLY from the exact department name string for that task group.
  - Remove spaces and special characters from the department name, then convert to uppercase.
  - Use that full normalized name as the prefix — not acronyms, not initials, not shortened forms.
  - Examples:
    - HR -> HR-001
    - IT -> IT-001
    - Finance -> FINANCE-001
    - Management -> MANAGEMENT-001
    - Human Resources -> HUMANRESOURCES-001
    - Information Technology -> INFORMATIONTECHNOLOGY-001
- Task ids must be unique across all departments.
- priority must be one of: High, Medium, Low.
- estimatedMinutes must be a positive integer.
- status for newly generated tasks must be "Pending".
- totalDepartments must equal the number of department entries.
- totalTasks must equal the total count of tasks across all departments.
- estimatedCompletion must be a human-readable duration aligned with the workflow plan (e.g. "30 minutes", "2 hours", "1 day").
- confidence must be a number between 0 and 1 reflecting generation certainty.

Required JSON shape:
{
  "workflow": "string",
  "departments": [
    {
      "department": "string",
      "tasks": [
        {
          "id": "HR-001",
          "title": "string",
          "description": "string",
          "priority": "High | Medium | Low",
          "estimatedMinutes": 0,
          "status": "Pending"
        }
      ]
    }
  ],
  "totalDepartments": 0,
  "totalTasks": 0,
  "estimatedCompletion": "string",
  "confidence": 0.0
}

Workflow:
"""${workflow}"""

Workflow plan:
${JSON.stringify(workflowPlan, null, 2)}

Extracted information:
${JSON.stringify(extractedInformation, null, 2)}`;

// ─── Validation Helpers ───────────────────────────────────────────────────────

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
 * Validate generateDepartmentTasks input parameters.
 * @param {unknown} input
 * @returns {{ workflow: string, extractedInformation: object, workflowPlan: object, planDepartments: string[] }}
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

  const workflow = input.workflow.trim();
  const planDepartments = validateStringArray(
    input.workflowPlan.departments,
    "workflowPlan.departments"
  );

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

  return {
    workflow,
    extractedInformation: input.extractedInformation,
    workflowPlan: input.workflowPlan,
    planDepartments,
  };
};

/**
 * Validate workflow field in the task generation result.
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
 * Validate estimatedCompletion field.
 * @param {unknown} estimatedCompletion
 */
const validateEstimatedCompletion = (estimatedCompletion) => {
  if (typeof estimatedCompletion !== "string" || estimatedCompletion.trim() === "") {
    throw new AIValidationError("estimatedCompletion must be a non-empty string.", {
      field: "estimatedCompletion",
      received: estimatedCompletion,
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
 * Validate status field.
 * @param {unknown} status
 * @param {string} field
 * @returns {string}
 */
const validateStatus = (status, field) => {
  if (typeof status !== "string" || status.trim() === "") {
    throw new AIValidationError(`${field} must be a non-empty string.`, {
      field,
      received: status,
    });
  }

  const normalized = TASK_STATUSES.find(
    (value) => value.toLowerCase() === status.trim().toLowerCase()
  );

  if (!normalized) {
    throw new AIValidationError(
      `${field} must be one of: Pending, In Progress, Completed, Cancelled.`,
      {
        field,
        received: status,
        allowed: TASK_STATUSES,
      }
    );
  }

  return normalized;
};

/**
 * Validate estimatedMinutes field.
 * @param {unknown} estimatedMinutes
 * @param {string} field
 */
const validateEstimatedMinutes = (estimatedMinutes, field) => {
  if (typeof estimatedMinutes !== "number" || !Number.isInteger(estimatedMinutes)) {
    throw new AIValidationError(`${field} must be a positive integer.`, {
      field,
      received: estimatedMinutes,
    });
  }

  if (estimatedMinutes < 1) {
    throw new AIValidationError(`${field} must be a positive integer.`, {
      field,
      received: estimatedMinutes,
    });
  }
};

/**
 * Validate task id field.
 * @param {unknown} id
 * @param {string} field
 * @param {string} department
 * @param {Set<string>} seenTaskIds
 * @returns {string}
 */
const validateTaskId = (id, field, department, seenTaskIds) => {
  if (typeof id !== "string" || id.trim() === "") {
    throw new AIValidationError(`${field} must be a non-empty string.`, {
      field,
      received: id,
    });
  }

  const normalizedId = id.trim().toUpperCase();

  if (!TASK_ID_PATTERN.test(normalizedId)) {
    throw new AIValidationError(
      `${field} must match the format {DEPARTMENT_PREFIX}-{NUMBER} (e.g. HR-001).`,
      {
        field,
        received: id,
      }
    );
  }

  if (seenTaskIds.has(normalizedId)) {
    throw new AIValidationError(`${field} must be unique across all tasks.`, {
      field,
      received: normalizedId,
    });
  }

  seenTaskIds.add(normalizedId);

  const idPrefix = normalizedId.split("-")[0];
  const tokens = department.split(/[\s/&-]+/).filter(Boolean);
  const acronym = tokens.length > 1
    ? tokens.map((token) => token[0].toUpperCase()).join("")
    : department.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const departmentKey = department.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  const prefixMatchesDepartment = idPrefix.length >= 2 && (
    idPrefix === acronym
    || idPrefix === departmentKey
    || departmentKey.startsWith(idPrefix)
    || acronym.startsWith(idPrefix)
    || idPrefix.startsWith(acronym)
    || departmentKey.includes(idPrefix)
  );

  if (!prefixMatchesDepartment) {
    throw new AIValidationError(
      `${field} prefix must correspond to the department name.`,
      {
        field,
        received: normalizedId,
        department,
      }
    );
  }

  return normalizedId;
};

/**
 * Validate a single task object.
 * @param {unknown} task
 * @param {number} index
 * @param {string} department
 * @param {Set<string>} seenTaskIds
 * @returns {object}
 */
const validateTask = (task, index, department, seenTaskIds) => {
  const fieldPrefix = `departments[].tasks[${index}]`;

  if (!task || typeof task !== "object" || Array.isArray(task)) {
    throw new AIValidationError(`${fieldPrefix} must be a plain object.`, {
      field: fieldPrefix,
      received: task,
    });
  }

  const id = validateTaskId(task.id, `${fieldPrefix}.id`, department, seenTaskIds);

  if (typeof task.title !== "string" || task.title.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.title must be a non-empty string.`, {
      field: `${fieldPrefix}.title`,
      received: task.title,
    });
  }

  if (typeof task.description !== "string" || task.description.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.description must be a non-empty string.`, {
      field: `${fieldPrefix}.description`,
      received: task.description,
    });
  }

  const priority = validatePriority(task.priority, `${fieldPrefix}.priority`);
  validateEstimatedMinutes(task.estimatedMinutes, `${fieldPrefix}.estimatedMinutes`);
  const status = validateStatus(task.status, `${fieldPrefix}.status`);

  return {
    id,
    title: task.title.trim(),
    description: task.description.trim(),
    priority,
    estimatedMinutes: task.estimatedMinutes,
    status,
  };
};

/**
 * Validate a single department task group.
 * @param {unknown} entry
 * @param {number} index
 * @param {ReadonlySet<string>} planDepartments
 * @param {Set<string>} seenTaskIds
 * @returns {object}
 */
const validateDepartmentEntry = (entry, index, planDepartments, seenTaskIds) => {
  const fieldPrefix = `departments[${index}]`;

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new AIValidationError(`${fieldPrefix} must be a plain object.`, {
      field: fieldPrefix,
      received: entry,
    });
  }

  if (typeof entry.department !== "string" || entry.department.trim() === "") {
    throw new AIValidationError(`${fieldPrefix}.department must be a non-empty string.`, {
      field: `${fieldPrefix}.department`,
      received: entry.department,
    });
  }

  const department = entry.department.trim();

  if (!planDepartments.has(department)) {
    throw new AIValidationError(
      `${fieldPrefix}.department must be listed in the workflow plan departments.`,
      {
        field: `${fieldPrefix}.department`,
        received: department,
        allowedDepartments: [...planDepartments],
      }
    );
  }

  if (!Array.isArray(entry.tasks) || entry.tasks.length === 0) {
    throw new AIValidationError(`${fieldPrefix}.tasks must be a non-empty array.`, {
      field: `${fieldPrefix}.tasks`,
      received: entry.tasks,
    });
  }

  const tasks = entry.tasks.map((task, taskIndex) => validateTask(
    task,
    taskIndex,
    department,
    seenTaskIds
  ));

  return {
    department,
    tasks,
  };
};

/**
 * Validate departments array in the task generation result.
 * @param {unknown} departments
 * @param {string[]} planDepartments
 * @returns {object[]}
 */
const validateDepartments = (departments, planDepartments) => {
  if (!Array.isArray(departments) || departments.length === 0) {
    throw new AIValidationError("departments must be a non-empty array.", {
      field: "departments",
      received: departments,
    });
  }

  const planDepartmentSet = new Set(planDepartments);
  const seenTaskIds = new Set();

  const validatedDepartments = departments.map((entry, index) => validateDepartmentEntry(
    entry,
    index,
    planDepartmentSet,
    seenTaskIds
  ));

  const resultDepartments = new Set(validatedDepartments.map((entry) => entry.department));
  const missingDepartments = planDepartments.filter(
    (department) => !resultDepartments.has(department)
  );

  if (missingDepartments.length > 0) {
    throw new AIValidationError(
      "departments must include an entry for every department in the workflow plan.",
      {
        field: "departments",
        missingDepartments,
      }
    );
  }

  const duplicateDepartments = validatedDepartments
    .map((entry) => entry.department)
    .filter((department, index, list) => list.indexOf(department) !== index);

  if (duplicateDepartments.length > 0) {
    throw new AIValidationError("departments must not contain duplicate department entries.", {
      field: "departments",
      duplicateDepartments: [...new Set(duplicateDepartments)],
    });
  }

  return validatedDepartments;
};

/**
 * Validate aggregate count fields.
 * @param {unknown} totalDepartments
 * @param {unknown} totalTasks
 * @param {object[]} departments
 */
const validateAggregateCounts = (totalDepartments, totalTasks, departments) => {
  const actualTaskCount = departments.reduce(
    (count, entry) => count + entry.tasks.length,
    0
  );

  if (typeof totalDepartments !== "number" || !Number.isInteger(totalDepartments)) {
    throw new AIValidationError("totalDepartments must be an integer.", {
      field: "totalDepartments",
      received: totalDepartments,
    });
  }

  if (totalDepartments !== departments.length) {
    throw new AIValidationError("totalDepartments must match the number of department entries.", {
      field: "totalDepartments",
      received: totalDepartments,
      expected: departments.length,
    });
  }

  if (typeof totalTasks !== "number" || !Number.isInteger(totalTasks)) {
    throw new AIValidationError("totalTasks must be an integer.", {
      field: "totalTasks",
      received: totalTasks,
    });
  }

  if (totalTasks !== actualTaskCount) {
    throw new AIValidationError("totalTasks must match the total number of tasks generated.", {
      field: "totalTasks",
      received: totalTasks,
      expected: actualTaskCount,
    });
  }
};

/**
 * Validate the full task generation result structure.
 * @param {unknown} result
 * @param {string} expectedWorkflow
 * @param {string[]} planDepartments
 * @returns {object}
 */
const validateTaskGenerationResult = (result, expectedWorkflow, planDepartments) => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new AIValidationError("Task generation result must be a plain object.", {
      field: "result",
      received: result,
    });
  }

  validateWorkflow(result.workflow, expectedWorkflow);

  const departments = validateDepartments(result.departments, planDepartments);

  validateAggregateCounts(result.totalDepartments, result.totalTasks, departments);
  validateEstimatedCompletion(result.estimatedCompletion);
  validateConfidence(result.confidence);

  return {
    workflow: expectedWorkflow,
    departments,
    totalDepartments: result.totalDepartments,
    totalTasks: result.totalTasks,
    estimatedCompletion: result.estimatedCompletion.trim(),
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
 * Generate executable department-wise tasks for a workflow.
 *
 * @param {object} input
 * @param {string} input.workflow - Detected workflow identifier
 * @param {object} input.extractedInformation - Structured data from information extraction
 * @param {object} input.workflowPlan - Execution plan from workflow planner
 * @returns {Promise<{
 *   workflow: string,
 *   departments: Array<{
 *     department: string,
 *     tasks: Array<{
 *       id: string,
 *       title: string,
 *       description: string,
 *       priority: string,
 *       estimatedMinutes: number,
 *       status: string
 *     }>
 *   }>,
 *   totalDepartments: number,
 *   totalTasks: number,
 *   estimatedCompletion: string,
 *   confidence: number
 * }>}
 */
const generateDepartmentTasks = async (input) => {
  const {
    workflow,
    extractedInformation,
    workflowPlan,
    planDepartments,
  } = validateInput(input);
  const requestId = generateRequestId();

  logExecutionStart(requestId, {
    module: "taskGenerator",
    workflow,
    planDepartmentCount: planDepartments.length,
  });

  try {
    const response = await aiEngine.execute({
      prompt: buildTaskGenerationPrompt(workflow, extractedInformation, workflowPlan),
      requestId,
      generationConfig: TASK_GENERATION_CONFIG,
    });

    if (!response.success) {
      throwEngineFailure(response);
    }

    const parsed = parseJsonResponse(response.data.content);
    const result = validateTaskGenerationResult(parsed, workflow, planDepartments);

    logExecutionSuccess(requestId, {
      module: "taskGenerator",
      workflow: result.workflow,
      totalDepartments: result.totalDepartments,
      totalTasks: result.totalTasks,
      confidence: result.confidence,
      usage: response.usage,
    });

    return result;
  } catch (error) {
    logExecutionFailure(requestId, {
      module: "taskGenerator",
      code: error.code,
      message: error.message,
    });

    throw error;
  }
};

module.exports = {
  generateDepartmentTasks,
};
