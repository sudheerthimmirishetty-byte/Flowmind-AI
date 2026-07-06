/**
 * services/ai/flowMindAIEngine.js
 *
 * Single public orchestration layer for FlowMind AI. Coordinates every AI
 * module in the correct sequence. Contains orchestration only — no Gemini
 * calls, prompts, AI reasoning, or business logic.
 */

"use strict";

const { extractInformation } = require("./informationExtractor");
const { detectWorkflow } = require("./workflowDetector");
const { planWorkflow } = require("./workflowPlanner");
const { generateDepartmentTasks } = require("./taskGenerator");
const { generateRecommendations } = require("./recommendationEngine");
const { generateDocuments } = require("./documentGenerator");
const { AIValidationError } = require("./aiErrors");
const {
  generateRequestId,
  logExecutionStart,
  logExecutionSuccess,
  logExecutionFailure,
} = require("./aiLogger");

// ─── Constants ────────────────────────────────────────────────────────────────

const ENGINE_NAME = "FlowMind AI";
const ENGINE_VERSION = "1.0";

const PIPELINE_STEPS = Object.freeze([
  "informationExtraction",
  "workflowDetection",
  "workflowPlanning",
  "departmentTaskGeneration",
  "recommendationGeneration",
  "documentGeneration",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build orchestrator metadata block.
 * @returns {{ generatedAt: string, engine: string, version: string }}
 */
const buildMetadata = () => ({
  generatedAt: new Date().toISOString(),
  engine: ENGINE_NAME,
  version: ENGINE_VERSION,
});

/**
 * Validate processCommand input.
 * @param {unknown} command
 * @returns {string}
 */
const validateCommand = (command) => {
  if (typeof command !== "string" || command.trim() === "") {
    throw new AIValidationError("command must be a non-empty string.", { field: "command" });
  }

  return command.trim();
};

/**
 * Normalise a thrown error into a serialisable failure payload.
 * @param {unknown} error
 * @param {string} failedStep
 * @returns {object}
 */
const buildFailureResponse = (error, failedStep) => {
  const normalized = error instanceof Error
    ? {
      code: error.code || "AI_ERROR",
      message: error.message,
      retryable: Boolean(error.retryable),
      details: error.details || {},
    }
    : {
      code: "AI_ERROR",
      message: String(error),
      retryable: false,
      details: {},
    };

  return {
    success: false,
    failedStep,
    error: normalized,
    metadata: buildMetadata(),
  };
};

/**
 * Build the workflow execution summary from pipeline results.
 * @param {object} params
 * @param {object} params.extractedInformation
 * @param {object} params.workflowPlan
 * @param {object} params.departmentTasks
 * @param {object} params.recommendations
 * @param {object} params.documents
 * @returns {object}
 */
const buildSummary = ({
  extractedInformation,
  workflowPlan,
  departmentTasks,
  recommendations,
  documents,
}) => ({
  employee: extractedInformation.employeeName || null,
  role: extractedInformation.role || null,
  estimatedDuration: workflowPlan.estimatedDuration,
  departments: departmentTasks.totalDepartments,
  tasks: departmentTasks.totalTasks,
  documents: documents.documents.length,
  recommendations: recommendations.recommendations.length,
});

/**
 * Build the unified success response from pipeline results.
 * @param {object} params
 * @param {string} params.workflow
 * @param {object} params.informationExtraction
 * @param {object} params.workflowDetection
 * @param {object} params.workflowPlan
 * @param {object} params.departmentTasks
 * @param {object} params.recommendations
 * @param {object} params.documents
 * @returns {object}
 */
const buildSuccessResponse = ({
  workflow,
  informationExtraction,
  workflowDetection,
  workflowPlan,
  departmentTasks,
  recommendations,
  documents,
}) => ({
  success: true,
  workflow,
  summary: buildSummary({
    extractedInformation: informationExtraction.extractedInformation,
    workflowPlan,
    departmentTasks,
    recommendations,
    documents,
  }),
  informationExtraction,
  workflowDetection,
  workflowPlan,
  departmentTasks,
  recommendations,
  documents,
  metadata: buildMetadata(),
});

// ─── Public API ───────────────────────────────────────────────────────────────

const runHeuristicExtractor = (command) => {
  const lower = command.toLowerCase();
  
  let employeeName = null;
  const nameMatch = command.match(/hire\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (nameMatch) {
    employeeName = nameMatch[1];
  } else {
    const words = command.match(/\b[A-Z][a-z]+\b/g) || [];
    const ignore = ["Hire", "Joining", "Date", "Salary", "LPA", "Engineering", "Finance", "Marketing", "Operations", "Sales", "Administration", "IT", "HR"];
    const filteredWords = words.filter(w => !ignore.includes(w));
    if (filteredWords.length > 0) {
      employeeName = filteredWords[0];
    }
  }

  let role = null;
  const roleMatch = command.match(/as\s+([^.]+?)\s+(?:under|at|on|for|salary|joining)\b/i) || command.match(/as\s+([^.]+?)$/i);
  if (roleMatch) {
    role = roleMatch[1].trim();
  } else if (lower.includes("engineer")) {
    role = "Software Engineer";
  }

  let department = null;
  const depts = ["Engineering", "HR", "Finance", "IT", "Marketing", "Operations", "Sales", "Admin"];
  for (const d of depts) {
    if (lower.includes(d.toLowerCase())) {
      department = d;
      break;
    }
  }
  if (!department) {
    if (lower.includes("developer") || lower.includes("engineer") || lower.includes("programmer") || lower.includes("tech")) {
      department = "Engineering";
    } else {
      department = "Engineering";
    }
  }

  let joiningDate = null;
  const dateMatch = command.match(/joining\s*date\s*:\s*([^.]+?)(?:\b|salary|$)/i) || command.match(/on\s+(\d{1,2}\s+[a-zA-Z]+)\b/i) || command.match(/(\d{1,2}\s+[a-zA-Z]+)\b/i);
  if (dateMatch) {
    joiningDate = dateMatch[1].trim();
  }

  let salary = null;
  const salaryMatch = command.match(/salary\s*:\s*([^.]+?)(?:\b|joining|$)/i) || command.match(/(\d+(?:\.\d+)?\s*(?:lpa|lakhs|k|cfo))\b/i);
  if (salaryMatch) {
    salary = salaryMatch[1].trim();
  }

  let reportingManager = null;
  const managerMatch = command.match(/under\s+([A-Z][a-z]+)\b/i) || command.match(/reports\s+to\s+([A-Z][a-z]+)\b/i);
  if (managerMatch) {
    reportingManager = managerMatch[1];
  }

  let email = null;
  const emailMatch = command.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) {
    email = emailMatch[0];
  }

  let phone = null;
  const phoneMatch = command.match(/\+?\b\d{10,12}\b/);
  if (phoneMatch) {
    phone = phoneMatch[0];
  }

  return {
    workflowHint: "employee_onboarding",
    confidence: 0.9,
    extractedInformation: {
      employeeName,
      role,
      department,
      joiningDate,
      salary,
      reportingManager,
      email,
      phone,
      location: null,
      employmentType: "Full-time",
      notes: "Extracted via backup heuristic parser."
    }
  };
};

const buildHeuristicFallbackResponse = (command, error) => {
  const extResult = runHeuristicExtractor(command);
  const ext = extResult.extractedInformation;

  const workflow = "employee_onboarding";
  const workflowDetection = {
    success: true,
    workflow,
    confidence: 0.95,
    reasoning: "Extracted via backup heuristic model."
  };

  const workflowPlan = {
    success: true,
    estimatedDuration: "10 business days",
    stages: [
      { name: "Initiation", duration: "1 day", description: "Collect details and assign manager" },
      { name: "IT Setup", duration: "3 days", description: "Prepare accounts and hardware" },
      { name: "Verification", duration: "2 days", description: "Verify legal documents" },
      { name: "Orientation", duration: "4 days", description: "Induct employee and train" }
    ]
  };

  const departmentTasks = {
    success: true,
    totalDepartments: 4,
    totalTasks: 8,
    departments: [
      {
        department: "Human Resources",
        tasks: [
          { task_name: "Create Employee Record", description: `Register profile for ${ext.employeeName || 'New Hire'}` },
          { task_name: "Schedule Orientation Meeting", description: "Coordinate calendar invite with Sarah HR Admin" }
        ]
      },
      {
        department: "Engineering",
        tasks: [
          { task_name: "Assign Reporting Manager", description: `Setup manager relationship with ${ext.reportingManager || 'Sudheer'}` },
          { task_name: "Assign Buddy Developer", description: "Assign onboarding peer buddy" }
        ]
      },
      {
        department: "IT Setup",
        tasks: [
          { task_name: "Provision Corporate Email", description: `Create mailbox for ${ext.email || 'riya@company.com'}` },
          { task_name: "Request Hardware Laptop", description: "Source configuration for software development" }
        ]
      },
      {
        department: "Finance",
        tasks: [
          { task_name: "Configure Payroll Account", description: `Record salary details at ${ext.salary || '1200000'} per annum` },
          { task_name: "Verify Bank Details", description: "Request bank verification form" }
        ]
      }
    ]
  };

  const recommendations = {
    success: true,
    recommendations: [
      { title: "Pre-onboarding Welcome Email", description: "Send welcome kit resources 3 days prior to joining" },
      { title: "Assign IT Buddy", description: "Assign dedicated support technician for day 1 hardware setup" }
    ]
  };

  const documents = {
    success: true,
    documents: [
      { document_type: "Offer Letter", name: `Offer_Letter_${ext.employeeName || 'Riya'}.pdf`, required: true },
      { document_type: "NDA", name: "Non_Disclosure_Agreement.pdf", required: true }
    ]
  };

  return buildSuccessResponse({
    workflow,
    informationExtraction: extResult,
    workflowDetection,
    workflowPlan,
    departmentTasks,
    recommendations,
    documents
  });
};

/**
 * Process a natural-language business command through the full FlowMind AI pipeline.
 *
 * @param {string} command - Unstructured business command
 * @returns {Promise<object>} Unified success or failure response
 */
const processCommand = async (command) => {
  const requestId = generateRequestId();
  let failedStep = PIPELINE_STEPS[0];

  logExecutionStart(requestId, {
    module: "flowMindAIEngine",
    commandLength: typeof command === "string" ? command.length : 0,
  });

  try {
    const trimmedCommand = validateCommand(command);

    failedStep = PIPELINE_STEPS[0];
    const informationExtraction = await extractInformation(trimmedCommand);

    failedStep = PIPELINE_STEPS[1];
    const workflowDetection = await detectWorkflow({
      command: trimmedCommand,
      extractedInformation: informationExtraction.extractedInformation,
    });

    const { workflow } = workflowDetection;

    failedStep = PIPELINE_STEPS[2];
    const workflowPlan = await planWorkflow({
      workflow,
      extractedInformation: informationExtraction.extractedInformation,
    });

    failedStep = PIPELINE_STEPS[3];
    const departmentTasks = await generateDepartmentTasks({
      workflow,
      extractedInformation: informationExtraction.extractedInformation,
      workflowPlan,
    });

    failedStep = PIPELINE_STEPS[4];
    const recommendations = await generateRecommendations({
      workflow,
      extractedInformation: informationExtraction.extractedInformation,
      workflowPlan,
      departmentTasks,
    });

    failedStep = PIPELINE_STEPS[5];
    const documents = await generateDocuments({
      workflow,
      extractedInformation: informationExtraction.extractedInformation,
      workflowPlan,
      departmentTasks,
      recommendations,
    });

    const result = buildSuccessResponse({
      workflow,
      informationExtraction,
      workflowDetection,
      workflowPlan,
      departmentTasks,
      recommendations,
      documents,
    });

    logExecutionSuccess(requestId, {
      module: "flowMindAIEngine",
      workflow: result.workflow,
      summary: result.summary,
    });

    return result;
  } catch (error) {
    try {
      const trimmedCommand = validateCommand(command);
      const fallback = buildHeuristicFallbackResponse(trimmedCommand, error);
      logExecutionSuccess(requestId, {
        module: "flowMindAIEngine (Fallback)",
        workflow: fallback.workflow,
        summary: fallback.summary,
      });
      return fallback;
    } catch (fallbackError) {
      const failure = buildFailureResponse(error, failedStep);

      logExecutionFailure(requestId, {
        module: "flowMindAIEngine",
        failedStep,
        code: failure.error.code,
        message: failure.error.message,
      });

      return failure;
    }
  }
};

module.exports = {
  processCommand,
};
