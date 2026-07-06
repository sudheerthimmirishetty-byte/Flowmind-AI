const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');
const HTTP = require('../constants/httpStatus');
const { randomUUID } = require("crypto");

/**
 * Processes a natural-language business command through the FlowMind AI pipeline.
 */
const processCommand = async (req, res, next) => {
  try {
    const { command } = req.body;

    if (!command || typeof command !== 'string' || !command.trim()) {
      return sendError(
        res,
        HTTP.BAD_REQUEST,
        'Validation failed',
        ['command is required and must be a non-empty string']
      );
    }

    const result = await aiService.processCommand(command.trim());

    // Generate unique workflow ID
    result.workflowId = `WF-${randomUUID()}`;

    if (!result.success) {
      const status =
        result.error?.code === 'AI_VALIDATION_ERROR'
          ? HTTP.BAD_REQUEST
          : HTTP.INTERNAL_SERVER_ERROR;

      return sendError(
        res,
        status,
        result.error?.message || 'AI command processing failed',
        [result.error]
      );
    }

    return sendSuccess(res, 'AI command processed successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles NLP command parsing via the FlowMind AI orchestrator.
 */
const parseCommand = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        res,
        HTTP.BAD_REQUEST,
        'Validation failed',
        errors.array()
      );
    }

    const { command } = req.body;

    if (!command || typeof command !== 'string' || !command.trim()) {
      return sendError(
        res,
        HTTP.BAD_REQUEST,
        'Validation failed',
        ['command is required and must be a non-empty string']
      );
    }

    const result = await aiService.processCommand(command.trim());

    // Generate unique workflow ID
    result.workflowId = `WF-${randomUUID()}`;

    if (!result.success) {
      const status =
        result.error?.code === 'AI_VALIDATION_ERROR'
          ? HTTP.BAD_REQUEST
          : HTTP.INTERNAL_SERVER_ERROR;

      return sendError(
        res,
        status,
        result.error?.message || 'AI command processing failed',
        [result.error]
      );
    }

    return sendSuccess(
      res,
      'Natural language command parsed successfully',
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles chat interactions with the AI assistant.
 */
const chat = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        res,
        HTTP.BAD_REQUEST,
        'Validation failed',
        errors.array()
      );
    }

    const { message, context } = req.body;
    const chatResult = await aiService.getChatResponse(message, context);

    return sendSuccess(res, 'Chat response generated successfully', chatResult);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the list of all AI agents.
 */
const getAgentsList = async (req, res, next) => {
  try {
    const agents = await aiService.getAgents();
    return sendSuccess(res, 'AI agents list retrieved successfully', agents);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves details for a specific AI agent.
 */
const getAgent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        res,
        HTTP.BAD_REQUEST,
        'Validation failed',
        errors.array()
      );
    }

    const { id } = req.params;
    const agent = await aiService.getAgentById(id);

    if (!agent) {
      return sendError(
        res,
        HTTP.NOT_FOUND,
        `AI agent with ID ${id} not found`,
        [`No agent matching ID ${id}`]
      );
    }

    return sendSuccess(res, 'AI agent details retrieved successfully', agent);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates status details for an AI agent.
 */
const updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        res,
        HTTP.BAD_REQUEST,
        'Validation failed',
        errors.array()
      );
    }

    const { id } = req.params;
    const { status } = req.body;

    const updatedAgent = await aiService.updateAgentStatus(id, status);

    return sendSuccess(
      res,
      'AI agent status updated successfully',
      updatedAgent
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processCommand,
  parseCommand,
  chat,
  getAgentsList,
  getAgent,
  updateStatus,
};