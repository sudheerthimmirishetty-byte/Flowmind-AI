const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticate } = require('../middlewares/auth.middleware');

// Routes definition
router.get('/:employeeId', authenticate, onboardingController.getDetails);
router.put('/:employeeId', authenticate, onboardingController.updateDetails);

module.exports = router;
