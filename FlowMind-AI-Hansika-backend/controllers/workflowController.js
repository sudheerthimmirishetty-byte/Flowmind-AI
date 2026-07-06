const { validationResult } = require("express-validator");
const workflowService = require("../services/workflowService");

class WorkflowController {
  async createWorkflow(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const result = await workflowService.createWorkflow(req.body);
      return res.status(201).json({
        success: true,
        message: "Workflow created successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWorkflow(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.updateWorkflow(id, req.body);
      return res.status(200).json({
        success: true,
        message: "Workflow updated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkflow(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.deleteWorkflow(id);
      return res.status(200).json({
        success: true,
        message: "Workflow deleted successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflows(req, res, next) {
    try {
      const result = await workflowService.getWorkflows();
      return res.status(200).json({
        success: true,
        message: "Workflows retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowById(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.getWorkflowById(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Workflow not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Workflow retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.getWorkflowStatus(id);
      if (result === null) {
        return res.status(404).json({
          success: false,
          message: "Workflow not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Workflow status retrieved successfully",
        data: { workflow_status: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowProgress(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.getWorkflowProgress(id);
      if (result === null) {
        return res.status(404).json({
          success: false,
          message: "Workflow not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Workflow progress retrieved successfully",
        data: { progress_percentage: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowHistory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.getWorkflowHistory(id);
      return res.status(200).json({
        success: true,
        message: "Workflow history retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowPriority(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.getWorkflowPriority(id);
      if (result === null) {
        return res.status(404).json({
          success: false,
          message: "Workflow not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Workflow priority retrieved successfully",
        data: { priority: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowTimeline(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.getWorkflowTimeline(id);
      return res.status(200).json({
        success: true,
        message: "Workflow timeline retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowSummary(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.getWorkflowSummary(id);
      return res.status(200).json({
        success: true,
        message: "Workflow summary retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async retryAutomation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await workflowService.retryAutomation(id);
      return res.status(200).json({
        success: true,
        message: "Workflow automation retried successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowController();
