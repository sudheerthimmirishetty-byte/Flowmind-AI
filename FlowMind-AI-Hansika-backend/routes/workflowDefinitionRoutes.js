const express = require("express");
const router = express.Router();
const workflowDefinitionController = require("../controllers/workflowDefinitionController");
const {
  validateCreateWorkflowDefinition,
  validateUpdateWorkflowDefinition,
  validateIdParam
} = require("../validators/workflowValidator");

router.post("/", validateCreateWorkflowDefinition, workflowDefinitionController.createWorkflowDefinition);
router.put("/:id", validateUpdateWorkflowDefinition, workflowDefinitionController.updateWorkflowDefinition);
router.delete("/:id", validateIdParam, workflowDefinitionController.deleteWorkflowDefinition);
router.get("/", workflowDefinitionController.getWorkflowDefinitions);
router.get("/:id", validateIdParam, workflowDefinitionController.getWorkflowDefinitionById);

module.exports = router;
