const { body, param } = require("express-validator");

const validateIdParam = [
  param("id").isUUID().withMessage("ID must be a valid UUID")
];

const validateCreateTask = [
  body("workflow_id").isUUID().withMessage("Workflow ID must be a valid UUID"),
  body("department_id").optional().isUUID().withMessage("Department ID must be a valid UUID"),
  body("assigned_user").optional().isUUID().withMessage("Assigned user ID must be a valid UUID"),
  body("task_name").trim().notEmpty().withMessage("Task name is required"),
  body("task_description").optional().trim(),
  body("execution_order").isInt({ min: 1 }).withMessage("Execution order must be a positive integer"),
  body("priority").optional().isIn(["Low", "Medium", "High", "Critical"]).withMessage("Invalid priority level"),
  body("status").optional().isIn(["Pending", "In Progress", "Completed", "Rejected"]).withMessage("Invalid task status"),
  body("due_date").optional().isISO8601().withMessage("Due date must be a valid date timestamp")
];

const validateUpdateTask = [
  param("id").isUUID().withMessage("ID must be a valid UUID"),
  body("workflow_id").optional().isUUID().withMessage("Workflow ID must be a valid UUID"),
  body("department_id").optional().isUUID().withMessage("Department ID must be a valid UUID"),
  body("assigned_user").optional().isUUID().withMessage("Assigned user ID must be a valid UUID"),
  body("task_name").optional().trim().notEmpty().withMessage("Task name cannot be empty"),
  body("task_description").optional().trim(),
  body("execution_order").optional().isInt({ min: 1 }).withMessage("Execution order must be a positive integer"),
  body("priority").optional().isIn(["Low", "Medium", "High", "Critical"]).withMessage("Invalid priority level"),
  body("status").optional().isIn(["Pending", "In Progress", "Completed", "Rejected"]).withMessage("Invalid task status"),
  body("due_date").optional().isISO8601().withMessage("Due date must be a valid date timestamp")
];

const validateAssignTask = [
  param("id").isUUID().withMessage("ID must be a valid UUID"),
  body("assigned_user").isUUID().withMessage("Assigned user ID must be a valid UUID")
];

module.exports = {
  validateIdParam,
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask
};
