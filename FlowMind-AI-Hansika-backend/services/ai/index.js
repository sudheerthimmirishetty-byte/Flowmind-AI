/**
 * services/ai/index.js
 *
 * Public entry point for the AI Foundation Layer.
 * Re-exports the engine API and supporting utilities.
 */

"use strict";

const aiEngine = require("./aiEngine");
const aiConfig = require("./aiConfig");
const aiErrors = require("./aiErrors");
const aiLogger = require("./aiLogger");
const aiResponseFormatter = require("./aiResponseFormatter");
const { extractInformation } = require("./informationExtractor");
const { detectWorkflow } = require("./workflowDetector");
const { planWorkflow } = require("./workflowPlanner");
const { generateDepartmentTasks } = require("./taskGenerator");
const { generateRecommendations } = require("./recommendationEngine");
const { generateDocuments } = require("./documentGenerator");
const { processCommand } = require("./flowMindAIEngine");

module.exports = {
  initialize: aiEngine.initialize,
  execute: aiEngine.execute,
  health: aiEngine.health,
  shutdown: aiEngine.shutdown,
  extractInformation,
  detectWorkflow,
  planWorkflow,
  generateDepartmentTasks,
  generateRecommendations,
  generateDocuments,
  processCommand,
  config: aiConfig,
  errors: aiErrors,
  logger: aiLogger,
  formatter: aiResponseFormatter,
};
