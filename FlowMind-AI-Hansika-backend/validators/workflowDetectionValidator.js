const { body, param } = require('express-validator');

const validateDetection = [
  body('natural_language_command')
    .trim()
    .notEmpty()
    .withMessage('Natural language command is required')
    .isLength({ max: 5000 })
    .withMessage('Command cannot exceed 5000 characters'),
  body('company_id')
    .optional()
    .isUUID()
    .withMessage('Company ID must be a valid UUID')
];

const validateDetectionResult = [
  param('id')
    .isUUID()
    .withMessage('Detection result ID must be a valid UUID')
];

module.exports = {
  validateDetection,
  validateDetectionResult
};
