/**
 * constants/messages.js
 *
 * Shared API response message strings.
 *
 * Centralising messages ensures consistency across modules and makes it
 * trivial to update wording or add i18n support later.
 *
 * Usage:
 *   const MSG = require('../constants/messages');
 *   sendSuccess(res, MSG.AUTH.LOGIN_SUCCESS, { token, user });
 *   sendError(res, 401, MSG.AUTH.INVALID_CREDENTIALS);
 */

"use strict";

const MSG = {
  // ─── Auth ────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    INVALID_CREDENTIALS: "Invalid email or password",
    TOKEN_MISSING: "Authentication token is missing",
    TOKEN_INVALID: "Authentication token is invalid or expired",
    TOKEN_EXPIRED: "Authentication token has expired. Please log in again",
    FORBIDDEN: "You do not have permission to perform this action",
    ACCOUNT_INACTIVE: "Your account is inactive. Contact your administrator",
    PASSWORD_CHANGED: "Password updated successfully",
    PROFILE_UPDATED: "Profile updated successfully",
  },

  // ─── Company ─────────────────────────────────────────────────────────────
  COMPANY: {
    CREATED: "Company registered successfully",
    UPDATED: "Company updated successfully",
    DELETED: "Company deleted successfully",
    FETCHED: "Company retrieved successfully",
    LIST_FETCHED: "Companies retrieved successfully",
    NOT_FOUND: "Company not found",
  },

  // ─── Users ───────────────────────────────────────────────────────────────
  USER: {
    CREATED: "User created successfully",
    UPDATED: "User updated successfully",
    DELETED: "User deleted successfully",
    FETCHED: "User retrieved successfully",
    LIST_FETCHED: "Users retrieved successfully",
    NOT_FOUND: "User not found",
    EMAIL_EXISTS: "A user with this email already exists",
  },

  // ─── Departments ─────────────────────────────────────────────────────────
  DEPARTMENT: {
    CREATED: "Department created successfully",
    UPDATED: "Department updated successfully",
    DELETED: "Department deleted successfully",
    FETCHED: "Department retrieved successfully",
    LIST_FETCHED: "Departments retrieved successfully",
    NOT_FOUND: "Department not found",
  },

  // ─── Workflows ───────────────────────────────────────────────────────────
  WORKFLOW: {
    CREATED: "Workflow created successfully",
    UPDATED: "Workflow updated successfully",
    DELETED: "Workflow deleted successfully",
    FETCHED: "Workflow retrieved successfully",
    LIST_FETCHED: "Workflows retrieved successfully",
    NOT_FOUND: "Workflow not found",
  },

  // ─── Employees ───────────────────────────────────────────────────────────
  EMPLOYEE: {
    CREATED: "Employee registered successfully",
    UPDATED: "Employee updated successfully",
    DELETED: "Employee deleted successfully",
    FETCHED: "Employee retrieved successfully",
    LIST_FETCHED: "Employees retrieved successfully",
    NOT_FOUND: "Employee not found",
  },

  // ─── Tasks ───────────────────────────────────────────────────────────────
  TASK: {
    CREATED: "Task created successfully",
    UPDATED: "Task updated successfully",
    DELETED: "Task deleted successfully",
    FETCHED: "Task retrieved successfully",
    LIST_FETCHED: "Tasks retrieved successfully",
    NOT_FOUND: "Task not found",
    STATUS_UPDATED: "Task status updated successfully",
  },

  // ─── Documents ───────────────────────────────────────────────────────────
  DOCUMENT: {
    CREATED: "Document uploaded successfully",
    UPDATED: "Document updated successfully",
    DELETED: "Document deleted successfully",
    FETCHED: "Document retrieved successfully",
    LIST_FETCHED: "Documents retrieved successfully",
    NOT_FOUND: "Document not found",
  },

  // ─── General ─────────────────────────────────────────────────────────────
  GENERAL: {
    VALIDATION_FAILED: "Validation failed",
    INTERNAL_ERROR: "An internal server error occurred",
    NOT_FOUND: "The requested resource was not found",
    BAD_REQUEST: "Bad request",
    SERVER_HEALTHY: "FlowMind AI API is healthy",
  },
};

module.exports = MSG;
