const { validationResult } = require('express-validator');
const agentExecutionService = require('../services/agentExecutionService');

/**
 * Creates a log entry for an agent execution event.
 */
const createExecution = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const execution = await agentExecutionService.logExecution(req.body);
    return res.status(201).json({
      success: true,
      message: 'Agent execution log recorded successfully',
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the overall log history of agent execution metrics.
 */
const getExecutionsList = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const executions = await agentExecutionService.getExecutions(limit);

    return res.status(200).json({
      success: true,
      message: 'Agent execution log history retrieved successfully',
      data: executions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves agent executions linked to a single workflow.
 */
const getExecutionsByWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params; // workflow_id
    const executions = await agentExecutionService.getExecutionsByWorkflowId(id);

    return res.status(200).json({
      success: true,
      message: `Agent execution logs for workflow ID ${id} retrieved successfully`,
      data: executions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExecution,
  getExecutionsList,
  getExecutionsByWorkflow
};
