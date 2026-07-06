const express = require('express');
const router = express.Router();
const agentExecutionController = require('../controllers/agentExecutionController');
const { authenticate } = require('../middlewares/auth.middleware');

// Routes definition
router.post('/', authenticate, agentExecutionController.createExecution);
router.get('/', authenticate, agentExecutionController.getExecutionsList);
router.get('/workflow/:id', authenticate, agentExecutionController.getExecutionsByWorkflow);

module.exports = router;
