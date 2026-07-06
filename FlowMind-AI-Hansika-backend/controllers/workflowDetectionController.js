const { validationResult } = require('express-validator');
const workflowDetectionService = require('../services/workflowDetectionService');

/**
 * Classifies a natural language command and stores the result in database.
 */
const detectWorkflow = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { workflow_id, natural_language_command } = req.body;
    const detectionResult = await workflowDetectionService.detectAndLogWorkflow(
      workflow_id,
      natural_language_command
    );

    return res.status(201).json({
      success: true,
      message: 'Workflow classification completed successfully',
      data: detectionResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves lists of workflow detection logs.
 */
const getResults = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const logs = await workflowDetectionService.getDetectionResults(limit);

    return res.status(200).json({
      success: true,
      message: 'Workflow detection history retrieved successfully',
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a single workflow detection log matching the workflow ID.
 */
const getResultByWorkflow = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params; // workflow_id
    const log = await workflowDetectionService.getDetectionResultByWorkflowId(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: `Workflow detection result for workflow ID ${id} not found`,
        errors: [`No detection log matches workflow ID ${id}`]
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Workflow detection result retrieved successfully',
      data: log
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  detectWorkflow,
  getResults,
  getResultByWorkflow
};
