const { validationResult } = require("express-validator");
const workflowDefinitionService = require("../services/workflowDefinitionService");

class WorkflowDefinitionController {
  async createWorkflowDefinition(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const result = await workflowDefinitionService.createWorkflowDefinition(req.body);
      return res.status(201).json({
        success: true,
        message: "Workflow definition created successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWorkflowDefinition(req, res, next) {
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
      const result = await workflowDefinitionService.updateWorkflowDefinition(id, req.body);
      return res.status(200).json({
        success: true,
        message: "Workflow definition updated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkflowDefinition(req, res, next) {
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
      const result = await workflowDefinitionService.deleteWorkflowDefinition(id);
      return res.status(200).json({
        success: true,
        message: "Workflow definition deleted successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowDefinitions(req, res, next) {
    try {
      const result = await workflowDefinitionService.getWorkflowDefinitions();
      return res.status(200).json({
        success: true,
        message: "Workflow definitions retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowDefinitionById(req, res, next) {
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
      const result = await workflowDefinitionService.getWorkflowDefinitionById(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Workflow definition not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Workflow definition retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowDefinitionController();
