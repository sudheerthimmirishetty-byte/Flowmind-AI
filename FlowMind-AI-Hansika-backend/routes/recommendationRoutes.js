const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");

router.post("/", recommendationController.createRecommendation);
router.get("/workflow/:workflowId", recommendationController.getWorkflowRecommendations);
router.get("/:id/confidence", recommendationController.getConfidencePercentage);
router.get("/:id/status", recommendationController.getRecommendationStatus);
router.get("/workflow/:workflowId/history", recommendationController.getRecommendationHistory);

module.exports = router;
