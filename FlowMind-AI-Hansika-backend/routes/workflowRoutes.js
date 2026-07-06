const express = require("express");
const router = express.Router();
const workflowController = require("../controllers/workflowController");
const {
  validateCreateWorkflow,
  validateUpdateWorkflow,
  validateIdParam
} = require("../validators/workflowValidator");

router.post("/", validateCreateWorkflow, workflowController.createWorkflow);
router.put("/:id", validateUpdateWorkflow, workflowController.updateWorkflow);
router.delete("/:id", validateIdParam, workflowController.deleteWorkflow);
router.get("/", workflowController.getWorkflows);
router.get("/:id", validateIdParam, workflowController.getWorkflowById);
router.get("/:id/status", validateIdParam, workflowController.getWorkflowStatus);
router.get("/:id/progress", validateIdParam, workflowController.getWorkflowProgress);
router.get("/:id/history", validateIdParam, workflowController.getWorkflowHistory);
router.get("/:id/priority", validateIdParam, workflowController.getWorkflowPriority);
router.get("/:id/timeline", validateIdParam, workflowController.getWorkflowTimeline);
router.get("/:id/summary", validateIdParam, workflowController.getWorkflowSummary);
router.post("/:id/retry-automation", validateIdParam, workflowController.retryAutomation);

module.exports = router;
