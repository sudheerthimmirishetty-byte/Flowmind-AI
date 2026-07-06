const { validationResult } = require("express-validator");
const workflowLogService = require("../services/workflowLogService");

class WorkflowLogController {
  async createWorkflowLog(req, res, next) {
    try {
      const result = await workflowLogService.createWorkflowLog(req.body);
      return res.status(201).json({
        success: true,
        message: "Workflow log created successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowHistory(req, res, next) {
    try {
      const { workflowId } = req.params;
      const result = await workflowLogService.getWorkflowHistory(workflowId);
      return res.status(200).json({
        success: true,
        message: "Workflow history logs retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityTimeline(req, res, next) {
    try {
      const { workflowId } = req.params;
      const result = await workflowLogService.getActivityTimeline(workflowId);
      return res.status(200).json({
        success: true,
        message: "Workflow activity timeline retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentLogs(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const result = await workflowLogService.getRecentLogs(limit);
      return res.status(200).json({
        success: true,
        message: "Recent workflow logs retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getActionHistory(req, res, next) {
    try {
      const { workflowId } = req.params;
      const { action } = req.query;
      const result = await workflowLogService.getActionHistory(workflowId, action);
      return res.status(200).json({
        success: true,
        message: "Workflow action history retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowLogController();
