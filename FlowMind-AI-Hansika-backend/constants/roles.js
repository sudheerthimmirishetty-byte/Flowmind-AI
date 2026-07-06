/**
 * constants/roles.js
 *
 * User role constants for the FlowMind AI platform.
 *
 * Roles drive:
 *   - Route-level access control (auth middleware)
 *   - Dashboard redirects on the frontend (hr → /dashboard, employee → /employee-dashboard)
 *   - Feature visibility throughout the system
 *
 * Usage:
 *   const ROLES = require('../constants/roles');
 *   if (req.user.role !== ROLES.HR) throw new AppError('Forbidden', 403);
 */

"use strict";

const ROLES = {
  /** Human Resources manager — full access to workflows, employees, reports */
  HR: "hr",

  /** Regular employee — can view own onboarding status and upload documents */
  EMPLOYEE: "employee",

  /** System administrator — superuser access */
  ADMIN: "admin",
};

/**
 * Roles that have HR-level access (can manage workflows and employees).
 */
const HR_ROLES = [ROLES.HR, ROLES.ADMIN];

/**
 * All valid roles as an array (useful for express-validator .isIn()).
 */
const ALL_ROLES = Object.values(ROLES);

module.exports = { ROLES, HR_ROLES, ALL_ROLES };
