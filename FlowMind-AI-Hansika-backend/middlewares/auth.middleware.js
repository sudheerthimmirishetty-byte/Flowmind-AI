/**
 * middlewares/auth.middleware.js
 *
 * JWT Authentication Middleware.
 *
 * Responsibilities:
 *   1. Extract Bearer token from the Authorization header.
 *   2. Verify and decode the JWT.
 *   3. Look up the user in Supabase (validates the user still exists & is active).
 *   4. Attach the authenticated user object to req.user.
 *   5. Forward to the next middleware / route handler.
 *
 * If any step fails, it calls sendError() with 401 Unauthorized.
 *
 * Usage:
 *   const { authenticate } = require('../middlewares/auth.middleware');
 *   router.get('/protected', authenticate, handler);
 */

"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { supabase } = require("../supabase/client");
const { sendError } = require("../utils/response");
const MSG = require("../constants/messages");
const HTTP = require("../constants/httpStatus");
const logger = require("../utils/logger");

/**
 * authenticate
 *
 * Verifies the JWT and populates req.user with:
 *   {
 *     id, email, full_name, role, company_id, status,
 *     profile_image, phone
 *   }
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.TOKEN_MISSING);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.TOKEN_MISSING);
    }

    // 2. Verify JWT signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.TOKEN_EXPIRED);
      }
      return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.TOKEN_INVALID);
    }

    // 3. Fetch user from Supabase to ensure they still exist and are active
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, company_id, status, profile_image, phone")
      .eq("id", decoded.sub)
      .single();

    if (error || !user) {
      return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.TOKEN_INVALID);
    }

    if (user.status !== "active") {
      return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.ACCOUNT_INACTIVE);
    }

    // 4. Attach user to request object
    req.user = user;

    next();
  } catch (err) {
    logger.error("Authentication middleware error", { error: err.message });
    return sendError(res, HTTP.INTERNAL_SERVER_ERROR, MSG.GENERAL.INTERNAL_ERROR);
  }
};

/**
 * authorise
 *
 * Role-based access control middleware factory.
 * Must be used AFTER authenticate.
 *
 * @param {...string} allowedRoles - Roles that are permitted to access the route
 *
 * Usage:
 *   const { authenticate, authorise } = require('../middlewares/auth.middleware');
 *   const { HR_ROLES } = require('../constants/roles');
 *
 *   router.post('/workflows', authenticate, authorise(...HR_ROLES), handler);
 *   router.get('/profile',    authenticate, authorise('hr', 'employee'), handler);
 */
const authorise = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, HTTP.UNAUTHORIZED, MSG.AUTH.TOKEN_MISSING);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, HTTP.FORBIDDEN, MSG.AUTH.FORBIDDEN);
    }

    next();
  };
};

module.exports = { authenticate, authorise };
