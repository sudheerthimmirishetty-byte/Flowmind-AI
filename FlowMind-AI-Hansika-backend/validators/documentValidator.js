const { body, param } = require("express-validator");

const validateIdParam = [
  param("id").isUUID().withMessage("ID must be a valid UUID")
];

const validateCreateDocument = [
  body("workflow_id").isUUID().withMessage("Workflow ID must be a valid UUID"),
  body("document_name").trim().notEmpty().withMessage("Document name is required"),
  body("document_type").trim().notEmpty().withMessage("Document type is required"),
  body("file_url").trim().isURL().withMessage("File URL must be a valid URL"),
  body("generated_by").optional().trim(),
  body("status").optional().isIn(["Pending", "Approved", "Rejected"]).withMessage("Invalid document status")
];

const validateUpdateDocument = [
  param("id").isUUID().withMessage("ID must be a valid UUID"),
  body("workflow_id").optional().isUUID().withMessage("Workflow ID must be a valid UUID"),
  body("document_name").optional().trim().notEmpty().withMessage("Document name cannot be empty"),
  body("document_type").optional().trim().notEmpty().withMessage("Document type cannot be empty"),
  body("file_url").optional().trim().isURL().withMessage("File URL must be a valid URL"),
  body("generated_by").optional().trim(),
  body("status").optional().isIn(["Pending", "Approved", "Rejected"]).withMessage("Invalid document status")
];

module.exports = {
  validateIdParam,
  validateCreateDocument,
  validateUpdateDocument
};
