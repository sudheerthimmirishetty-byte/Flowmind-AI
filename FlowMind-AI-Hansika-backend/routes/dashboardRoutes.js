const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth.middleware');

// Routes definition
router.get('/stats', authenticate, dashboardController.getStats);
router.get('/activities', authenticate, dashboardController.getActivities);
router.get('/growth', authenticate, dashboardController.getGrowth);
router.get('/departments', authenticate, dashboardController.getDepartments);
router.get('/workflow-stats', authenticate, dashboardController.getWorkflowStats);
router.get('/ai-suggestions', authenticate, dashboardController.getSuggestions);

module.exports = router;
