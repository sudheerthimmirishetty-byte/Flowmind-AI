const express = require('express');
const router = express.Router();
const workflowDetectionController = require('../controllers/workflowDetectionController');
const { validateDetection, validateDetectionResult } = require('../validators/workflowDetectionValidator');
const { authenticate } = require('../middlewares/auth.middleware');

// Routes definition
router.post('/', authenticate, validateDetection, workflowDetectionController.detectWorkflow);
router.get('/', authenticate, workflowDetectionController.getResults);
router.get('/workflow/:id', authenticate, validateDetectionResult, workflowDetectionController.getResultByWorkflow);

module.exports = router;
