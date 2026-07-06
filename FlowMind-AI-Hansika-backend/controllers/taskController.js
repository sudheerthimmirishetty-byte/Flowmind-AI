const { validationResult } = require("express-validator");
const taskService = require("../services/taskService");

class TaskController {
  async createTask(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const result = await taskService.createTask(req.body);
      return res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
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
      const result = await taskService.updateTask(id, req.body);
      return res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
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
      const result = await taskService.deleteTask(id);
      return res.status(200).json({
        success: true,
        message: "Task deleted successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async assignTask(req, res, next) {
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
      const { assigned_user } = req.body;
      const result = await taskService.assignTask(id, assigned_user);
      return res.status(200).json({
        success: true,
        message: "Task assigned successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async completeTask(req, res, next) {
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
      const performedBy = req.user ? req.user.full_name : "System";
      const result = await taskService.completeTask(id, performedBy);
      return res.status(200).json({
        success: true,
        message: "Task completed successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingTasks(req, res, next) {
    try {
      const result = await taskService.getPendingTasks();
      return res.status(200).json({
        success: true,
        message: "Pending tasks retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompletedTasks(req, res, next) {
    try {
      const result = await taskService.getCompletedTasks();
      return res.status(200).json({
        success: true,
        message: "Completed tasks retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentTasks(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { departmentId } = req.params;
      const result = await taskService.getDepartmentTasks(departmentId);
      return res.status(200).json({
        success: true,
        message: "Department tasks retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowTasks(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { workflowId } = req.params;
      const result = await taskService.getWorkflowTasks(workflowId);
      return res.status(200).json({
        success: true,
        message: "Workflow tasks retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskStatus(req, res, next) {
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
      const result = await taskService.getTaskStatus(id);
      if (result === null) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Task status retrieved successfully",
        data: { status: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskHistory(req, res, next) {
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
      const result = await taskService.getTaskHistory(id);
      return res.status(200).json({
        success: true,
        message: "Task history retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskPriority(req, res, next) {
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
      const result = await taskService.getTaskPriority(id);
      if (result === null) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Task priority retrieved successfully",
        data: { priority: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateExecutionOrder(req, res, next) {
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
      const { execution_order } = req.body;
      const result = await taskService.updateExecutionOrder(id, execution_order);
      return res.status(200).json({
        success: true,
        message: "Task execution order updated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
