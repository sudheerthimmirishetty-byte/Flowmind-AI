const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { validateChat, validateAgentId, validateAgentStatus } = require('../validators/aiValidator');
const { authenticate } = require('../middlewares/auth.middleware');

// Routes definition
router.post('/process', authenticate, aiController.processCommand);
router.post('/chat', authenticate, validateChat, aiController.chat);
router.post('/parse', authenticate, aiController.parseCommand);
router.get('/agents', authenticate, aiController.getAgentsList);
router.get('/agents/:id', authenticate, validateAgentId, aiController.getAgent);
router.put('/agents/:id/status', authenticate, validateAgentStatus, aiController.updateStatus);

module.exports = router;
