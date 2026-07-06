const express = require("express");
const router = express.Router();
const workflowLogController = require("../controllers/workflowLogController");

router.post("/", workflowLogController.createWorkflowLog);
router.get("/workflow/:workflowId", workflowLogController.getWorkflowHistory);
router.get("/workflow/:workflowId/timeline", workflowLogController.getActivityTimeline);
router.get("/recent", workflowLogController.getRecentLogs);
router.get("/workflow/:workflowId/action-history", workflowLogController.getActionHistory);

module.exports = router;
