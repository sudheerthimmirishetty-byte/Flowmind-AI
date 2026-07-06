const dashboardService = require('../services/dashboardService');

/**
 * Retrieves dashboard summary counts and trend badges.
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves lists of recent system events and workflow activities.
 */
const getActivities = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 6;
    const activities = await dashboardService.getRecentActivities(limit);
    return res.status(200).json({
      success: true,
      message: 'Recent activity feed retrieved successfully',
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves monthly employee growth trend metrics.
 */
const getGrowth = async (req, res, next) => {
  try {
    const growthData = await dashboardService.getGrowthData();
    return res.status(200).json({
      success: true,
      message: 'Employee growth chart metrics retrieved successfully',
      data: growthData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves department headcount distribution metrics.
 */
const getDepartments = async (req, res, next) => {
  try {
    const deptData = await dashboardService.getDepartmentData();
    return res.status(200).json({
      success: true,
      message: 'Department headcount metrics retrieved successfully',
      data: deptData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves workflow execution count aggregates.
 */
const getWorkflowStats = async (req, res, next) => {
  try {
    const workflowStats = await dashboardService.getWorkflowData();
    return res.status(200).json({
      success: true,
      message: 'Workflow status statistics retrieved successfully',
      data: workflowStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves insights and recommended actions compiled by AI.
 */
const getSuggestions = async (req, res, next) => {
  try {
    const suggestions = await dashboardService.getAISuggestions();
    return res.status(200).json({
      success: true,
      message: 'AI Suggestions and insights retrieved successfully',
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getActivities,
  getGrowth,
  getDepartments,
  getWorkflowStats,
  getSuggestions
};
