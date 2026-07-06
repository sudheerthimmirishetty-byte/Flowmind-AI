const { validationResult } = require('express-validator');
const onboardingService = require('../services/onboardingService');

/**
 * Retrieves onboarding details and checkboxes for an employee.
 */
const getDetails = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const details = await onboardingService.getOnboardingDetails(employeeId);

    if (!details) {
      return res.status(404).json({
        success: false,
        message: `Onboarding details for employee ID ${employeeId} not found`,
        errors: [`No employee onboarding record matches ID ${employeeId}`]
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Onboarding details retrieved successfully',
      data: details
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates onboarding checkmarks and triggers progress calculations.
 */
const updateDetails = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { employeeId } = req.params;
    const updatedDetails = await onboardingService.updateOnboardingDetails(
      employeeId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Onboarding details updated successfully',
      data: updatedDetails
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDetails,
  updateDetails
};
