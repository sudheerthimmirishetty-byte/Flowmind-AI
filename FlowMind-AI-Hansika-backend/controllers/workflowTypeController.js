const { validationResult } = require("express-validator");
const workflowTypeService = require("../services/workflowTypeService");

class WorkflowTypeController {
  async createWorkflowType(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const result = await workflowTypeService.createWorkflowType(req.body);
      return res.status(201).json({
        success: true,
        message: "Workflow type created successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWorkflowType(req, res, next) {
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
      const result = await workflowTypeService.updateWorkflowType(id, req.body);
      return res.status(200).json({
        success: true,
        message: "Workflow type updated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkflowType(req, res, next) {
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
      const result = await workflowTypeService.deleteWorkflowType(id);
      return res.status(200).json({
        success: true,
        message: "Workflow type deleted successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowTypes(req, res, next) {
    try {
      const result = await workflowTypeService.getWorkflowTypes();
      return res.status(200).json({
        success: true,
        message: "Workflow types retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowTypeById(req, res, next) {
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
      const result = await workflowTypeService.getWorkflowTypeById(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Workflow type not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Workflow type retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowTypeController();
