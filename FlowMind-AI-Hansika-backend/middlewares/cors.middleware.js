/**
 * middlewares/cors.middleware.js
 *
 * CORS (Cross-Origin Resource Sharing) Configuration.
 *
 * The frontend (React/Vite) runs on a different origin in development
 * (e.g. http://localhost:5173) and in production (custom domain).
 *
 * This middleware:
 *   - Allows the configured FRONTEND_URL origin(s)
 *   - Permits standard HTTP methods and headers
 *   - Enables credentials (cookies, Authorization header)
 *
 * Usage (in server.js):
 *   const corsMiddleware = require('./middlewares/cors.middleware');
 *   app.use(corsMiddleware);
 */

"use strict";

const cors = require("cors");
const env = require("../config/env");
const logger = require("../utils/logger");

// Parse comma-separated FRONTEND_URL into an array of allowed origins
const allowedOrigins = env.FRONTEND_URL
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

logger.info("CORS allowed origins", { origins: allowedOrigins });

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, be more permissive (localhost on any port)
    if (env.isDev && origin.startsWith("http://localhost")) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  exposedHeaders: ["X-Total-Count"],
  optionsSuccessStatus: 204,
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
