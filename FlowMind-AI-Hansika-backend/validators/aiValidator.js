const { body, param, query } = require('express-validator');

const validateChat = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required and cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Message cannot exceed 2000 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be a valid JSON object')
];

const validateAgentId = [
  param('id')
    .isUUID()
    .withMessage('Agent ID must be a valid UUID')
];

const validateAgentStatus = [
  param('id')
    .isUUID()
    .withMessage('Agent ID must be a valid UUID'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'idle', 'running'])
    .withMessage('Status must be one of: active, inactive, idle, running')
];

module.exports = {
  validateChat,
  validateAgentId,
  validateAgentStatus
};
