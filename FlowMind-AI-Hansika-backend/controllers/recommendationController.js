const { validationResult } = require("express-validator");
const recommendationService = require("../services/recommendationService");

class RecommendationController {
  async createRecommendation(req, res, next) {
    try {
      const result = await recommendationService.createRecommendation(req.body);
      return res.status(201).json({
        success: true,
        message: "Recommendation created successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowRecommendations(req, res, next) {
    try {
      const { workflowId } = req.params;
      const result = await recommendationService.getWorkflowRecommendations(workflowId);
      return res.status(200).json({
        success: true,
        message: "Workflow recommendations retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getConfidencePercentage(req, res, next) {
    try {
      const { id } = req.params;
      const result = await recommendationService.getConfidencePercentage(id);
      if (result === null) {
        return res.status(404).json({
          success: false,
          message: "Recommendation not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Recommendation confidence percentage retrieved successfully",
        data: { confidence_percentage: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const result = await recommendationService.getRecommendationStatus(id);
      if (result === null) {
        return res.status(404).json({
          success: false,
          message: "Recommendation not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Recommendation status retrieved successfully",
        data: { status: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendationHistory(req, res, next) {
    try {
      const { workflowId } = req.params;
      const result = await recommendationService.getRecommendationHistory(workflowId);
      return res.status(200).json({
        success: true,
        message: "Recommendation history retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecommendationController();
