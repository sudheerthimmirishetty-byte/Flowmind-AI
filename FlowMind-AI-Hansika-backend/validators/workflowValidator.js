const { body, param } = require("express-validator");

const validateIdParam = [
  param("id").isUUID().withMessage("ID must be a valid UUID")
];

const validateCreateWorkflowType = [
  body("workflow_code").trim().notEmpty().withMessage("Workflow code is required"),
  body("workflow_name").trim().notEmpty().withMessage("Workflow name is required"),
  body("description").optional().trim(),
  body("icon").optional().trim(),
  body("color").optional().trim(),
  body("status").optional().isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive")
];

const validateUpdateWorkflowType = [
  param("id").isUUID().withMessage("ID must be a valid UUID"),
  body("workflow_code").optional().trim().notEmpty().withMessage("Workflow code cannot be empty"),
  body("workflow_name").optional().trim().notEmpty().withMessage("Workflow name cannot be empty"),
  body("description").optional().trim(),
  body("icon").optional().trim(),
  body("color").optional().trim(),
  body("status").optional().isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive")
];

const validateCreateWorkflowDefinition = [
  body("workflow_type_id").isUUID().withMessage("Workflow type ID must be a valid UUID"),
  body("version").trim().notEmpty().withMessage("Version is required"),
  body("display_name").trim().notEmpty().withMessage("Display name is required"),
  body("description").optional().trim(),
  body("estimated_duration_minutes").optional().isInt({ min: 1 }).withMessage("Duration must be a positive integer"),
  body("approval_required").optional().isBoolean().withMessage("Approval required must be a boolean"),
  body("status").optional().isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive")
];

const validateUpdateWorkflowDefinition = [
  param("id").isUUID().withMessage("ID must be a valid UUID"),
  body("workflow_type_id").optional().isUUID().withMessage("Workflow type ID must be a valid UUID"),
  body("version").optional().trim().notEmpty().withMessage("Version cannot be empty"),
  body("display_name").optional().trim().notEmpty().withMessage("Display name cannot be empty"),
  body("description").optional().trim(),
  body("estimated_duration_minutes").optional().isInt({ min: 1 }).withMessage("Duration must be a positive integer"),
  body("approval_required").optional().isBoolean().withMessage("Approval required must be a boolean"),
  body("status").optional().isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive")
];

const validateCreateWorkflow = [
  body("workflow_number").trim().notEmpty().withMessage("Workflow number is required"),
  body("company_id").isUUID().withMessage("Company ID must be a valid UUID"),
  body("workflow_type_id").isUUID().withMessage("Workflow type ID must be a valid UUID"),
  body("workflow_definition_id").isUUID().withMessage("Workflow definition ID must be a valid UUID"),
  body("created_by").isUUID().withMessage("Created by user ID must be a valid UUID"),
  body("natural_language_command").optional().trim(),
  body("workflow_status").optional().isIn(["Pending", "In Progress", "Completed", "Rejected"]).withMessage("Invalid workflow status"),
  body("progress_percentage").optional().isInt({ min: 0, max: 100 }).withMessage("Progress percentage must be between 0 and 100"),
  body("priority").optional().isIn(["Low", "Medium", "High", "Critical"]).withMessage("Invalid priority level")
];

const validateUpdateWorkflow = [
  param("id").isUUID().withMessage("ID must be a valid UUID"),
  body("workflow_status").optional().isIn(["Pending", "In Progress", "Completed", "Rejected"]).withMessage("Invalid workflow status"),
  body("progress_percentage").optional().isInt({ min: 0, max: 100 }).withMessage("Progress percentage must be between 0 and 100"),
  body("priority").optional().isIn(["Low", "Medium", "High", "Critical"]).withMessage("Invalid priority level")
];

module.exports = {
  validateIdParam,
  validateCreateWorkflowType,
  validateUpdateWorkflowType,
  validateCreateWorkflowDefinition,
  validateUpdateWorkflowDefinition,
  validateCreateWorkflow,
  validateUpdateWorkflow
};
