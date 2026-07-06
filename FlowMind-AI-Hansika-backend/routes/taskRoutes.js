const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const {
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask,
  validateIdParam
} = require("../validators/taskValidator");

// ─── Static sub-paths MUST come before parameterized /:id ─────────────────────
router.get("/pending", taskController.getPendingTasks);
router.get("/completed", taskController.getCompletedTasks);
router.get("/department/:departmentId", taskController.getDepartmentTasks);
router.get("/workflow/:workflowId", taskController.getWorkflowTasks);

// ─── Collection ───────────────────────────────────────────────────────────────
router.post("/", validateCreateTask, taskController.createTask);

// ─── Member routes ────────────────────────────────────────────────────────────
router.put("/:id", validateUpdateTask, taskController.updateTask);
router.delete("/:id", validateIdParam, taskController.deleteTask);
router.put("/:id/assign", validateAssignTask, taskController.assignTask);
router.patch("/:id/complete", validateIdParam, taskController.completeTask);
router.put("/:id/complete", validateIdParam, taskController.completeTask);
router.get("/:id/status", validateIdParam, taskController.getTaskStatus);
router.get("/:id/history", validateIdParam, taskController.getTaskHistory);
router.get("/:id/priority", validateIdParam, taskController.getTaskPriority);
router.put("/:id/execution-order", validateIdParam, taskController.updateExecutionOrder);

module.exports = router;
