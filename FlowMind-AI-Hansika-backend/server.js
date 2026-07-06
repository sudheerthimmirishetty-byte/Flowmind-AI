/**
 * server.js
 *
 * FlowMind AI — Express Application Entry Point
 *
 * Initialisation order (critical — do not rearrange):
 *   1. Load environment variables & validate
 *   2. Create Express app
 *   3. Register security middleware  (Helmet)
 *   4. Register CORS middleware
 *   5. Register HTTP request logger  (Morgan → Winston)
 *   6. Register body parsers          (JSON, URL-encoded)
 *   7. Mount API routes
 *   8. Register 404 handler
 *   9. Register global error handler  (must be last)
 *  10. Start HTTP server
 */

"use strict";

// ─── 1. Environment (MUST be first) ──────────────────────────────────────────
const env = require("./config/env");

// ─── Core Dependencies ────────────────────────────────────────────────────────
const express = require("express");
const helmet = require("helmet");

// ─── Internal Modules ─────────────────────────────────────────────────────────
const logger = require("./utils/logger");
const { sendSuccess } = require("./utils/response");

// ─── Middlewares ──────────────────────────────────────────────────────────────
const corsMiddleware = require("./middlewares/cors.middleware");
const requestLogger = require("./middlewares/logger.middleware");
const notFoundHandler = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");

// ─── 2. Create App ────────────────────────────────────────────────────────────
const app = express();

// ─── 3. Security Headers (Helmet) ─────────────────────────────────────────────
app.use(
  helmet({
    // Allow inline scripts/styles in development (Vite HMR needs this)
    contentSecurityPolicy: env.isProd ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ─── 4. CORS ──────────────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ─── 5. HTTP Request Logger ───────────────────────────────────────────────────
app.use(requestLogger);

// ─── 6. Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── 7. Health Check (no auth required) ──────────────────────────────────────
/**
 * GET /api/health
 * Returns server health status, version, and environment.
 * Used by load balancers and monitoring systems.
 */
app.get("/api/health", (req, res) => {
  return sendSuccess(res, "FlowMind AI API is healthy", {
    status: "ok",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor(process.uptime()),
  });
});

// ─── 8. API Routes ────────────────────────────────────────────────────────────
try {
  app.use("/api/v1/auth", require("./routes/auth.routes"));
  logger.info("Routes registered: /api/v1/auth");
} catch (err) {
  logger.error("Failed to register auth routes", { error: err.message });
}

try {
  app.use("/api/v1/employees", require("./routes/employeeRoutes"));
  logger.info("Routes registered: /api/v1/employees");
} catch (err) {
  logger.error("Failed to register employee routes", { error: err.message });
}

try {
  app.use("/api/v1/workflows", require("./routes/workflowRoutes"));
  logger.info("Routes registered: /api/v1/workflows");
} catch (err) {
  logger.error("Failed to register workflow routes", { error: err.message });
}

try {
  app.use("/api/v1/dashboard", require("./routes/dashboardRoutes"));
  logger.info("Routes registered: /api/v1/dashboard");
} catch (err) {
  logger.error("Failed to register dashboard routes", { error: err.message });
}

try {
  app.use("/api/v1/companies", require("./routes/companyRoutes"));
  logger.info("Routes registered: /api/v1/companies");
} catch (err) {
  logger.error("Failed to register company routes", { error: err.message });
}

try {
  app.use("/api/v1/departments", require("./routes/departmentRoutes"));
  logger.info("Routes registered: /api/v1/departments");
} catch (err) {
  logger.error("Failed to register department routes", { error: err.message });
}

try {
  app.use("/api/v1/documents", require("./routes/documentRoutes"));
  logger.info("Routes registered: /api/v1/documents");
} catch (err) {
  logger.error("Failed to register document routes", { error: err.message });
}

try {
  app.use("/api/v1/onboarding", require("./routes/onboardingRoutes"));
  logger.info("Routes registered: /api/v1/onboarding");
} catch (err) {
  logger.error("Failed to register onboarding routes", { error: err.message });
}

try {
  app.use("/api/v1/ai", require("./routes/aiRoutes"));
  logger.info("Routes registered: /api/v1/ai");
} catch (err) {
  logger.error("Failed to register AI routes", { error: err.message });
}

try {
  app.use("/api/v1/tasks", require("./routes/taskRoutes"));
  logger.info("Routes registered: /api/v1/tasks");
} catch (err) {
  logger.error("Failed to register task routes", { error: err.message });
}

try {
  app.use("/api/v1/users", require("./routes/userRoutes"));
  logger.info("Routes registered: /api/v1/users");
} catch (err) {
  logger.error("Failed to register user routes", { error: err.message });
}

try {
  app.use("/api/v1/agent-executions", require("./routes/agentExecutionRoutes"));
  logger.info("Routes registered: /api/v1/agent-executions");
} catch (err) {
  logger.warn("Agent execution routes not available", { error: err.message });
}

try {
  app.use("/api/v1/recommendations", require("./routes/recommendationRoutes"));
  logger.info("Routes registered: /api/v1/recommendations");
} catch (err) {
  logger.warn("Recommendation routes not available", { error: err.message });
}

try {
  app.use("/api/v1/workflow-definitions", require("./routes/workflowDefinitionRoutes"));
  logger.info("Routes registered: /api/v1/workflow-definitions");
} catch (err) {
  logger.warn("Workflow definition routes not available", { error: err.message });
}

try {
  app.use("/api/v1/workflow-types", require("./routes/workflowTypeRoutes"));
  logger.info("Routes registered: /api/v1/workflow-types");
} catch (err) {
  logger.warn("Workflow type routes not available", { error: err.message });
}

try {
  app.use("/api/v1/workflow-logs", require("./routes/workflowLogRoutes"));
  logger.info("Routes registered: /api/v1/workflow-logs");
} catch (err) {
  logger.warn("Workflow log routes not available", { error: err.message });
}

try {
  app.use("/api/v1/workflow-detection", require("./routes/workflowDetectionRoutes"));
  logger.info("Routes registered: /api/v1/workflow-detection");
} catch (err) {
  logger.warn("Workflow detection routes not available", { error: err.message });
}

logger.info("All FlowMind routes registration complete");

// ─── 9. 404 Handler ───────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── 10. Global Error Handler (MUST be last middleware) ───────────────────────
app.use(errorHandler);

// ─── 11. Start Server ─────────────────────────────────────────────────────────
let server;

const startServer = async () => {
  // Initialize AI Engine (non-fatal — server starts even if AI unavailable)
  try {
    const { initialize: initializeAI } = require("./services/ai");
    await initializeAI();
    logger.info("FlowMind AI Engine initialized successfully");
  } catch (err) {
    logger.warn("FlowMind AI Engine initialization failed — continuing without AI", {
      error: err.message,
    });
    // Do NOT process.exit(1) — allow server to run without AI
  }

  server = app.listen(env.PORT, () => {
    logger.info("═══════════════════════════════════════════════════");
    logger.info("   FlowMind AI Backend — Server Started");
    logger.info("═══════════════════════════════════════════════════");
    logger.info(`   Environment : ${env.NODE_ENV}`);
    logger.info(`   Port        : ${env.PORT}`);
    logger.info(`   Health      : http://localhost:${env.PORT}/api/health`);
    logger.info(`   API Base    : http://localhost:${env.PORT}/api/v1`);
    logger.info("═══════════════════════════════════════════════════");
  });
};

startServer();

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    const { shutdown: shutdownAI } = require("./services/ai");
    await shutdownAI();
    logger.info("FlowMind AI Engine shut down");
  } catch (err) {
    logger.warn("Could not shut down AI Engine", { error: err.message });
  }

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forcing exit after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// ─── Unhandled Promise Rejections ────────────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", { reason: String(reason) });
  if (env.isProd) {
    shutdown("unhandledRejection");
  }
});

// ─── Uncaught Exceptions ──────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { error: err.message, stack: err.stack });
  shutdown("uncaughtException");
});

module.exports = app; // Exported for testing
