const express = require("express");
const router = express.Router();
const workflowTypeController = require("../controllers/workflowTypeController");
const {
  validateCreateWorkflowType,
  validateUpdateWorkflowType,
  validateIdParam
} = require("../validators/workflowValidator");

router.post("/", validateCreateWorkflowType, workflowTypeController.createWorkflowType);
router.put("/:id", validateUpdateWorkflowType, workflowTypeController.updateWorkflowType);
router.delete("/:id", validateIdParam, workflowTypeController.deleteWorkflowType);
router.get("/", workflowTypeController.getWorkflowTypes);
router.get("/:id", validateIdParam, workflowTypeController.getWorkflowTypeById);

module.exports = router;
