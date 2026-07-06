/**
 * constants/workflowStatus.js
 *
 * Status constants for all workflow-related entities.
 *
 * Mirrors the status values stored in the Supabase database.
 * Centralising them prevents typo-based bugs when comparing statuses.
 *
 * Usage:
 *   const WF = require('../constants/workflowStatus');
 *   if (workflow.workflow_status === WF.WORKFLOW.PENDING) { ... }
 */

"use strict";

// ─── Workflow Status (workflows.workflow_status) ──────────────────────────────
const WORKFLOW = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
};

// ─── Task Status (tasks.status) ───────────────────────────────────────────────
const TASK = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  BLOCKED: "blocked",
  SKIPPED: "skipped",
};

// ─── Document Status (documents.status) ──────────────────────────────────────
const DOCUMENT = {
  PENDING: "pending",
  UPLOADED: "uploaded",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

// ─── Employee Status (employees.employee_status) ──────────────────────────────
const EMPLOYEE = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ONBOARDING: "onboarding",
  TERMINATED: "terminated",
};

// ─── General Status (used in companies, users, departments, etc.) ─────────────
const GENERAL = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

// ─── Onboarding Status (onboarding_details.onboarding_status) ────────────────
const ONBOARDING = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

// ─── Agent Execution Status (agent_executions.status) ────────────────────────
const AGENT_EXECUTION = {
  PENDING: "pending",
  RUNNING: "running",
  SUCCESS: "success",
  FAILED: "failed",
};

// ─── Recommendation Status (recommendations.status) ──────────────────────────
const RECOMMENDATION = {
  ACTIVE: "active",
  DISMISSED: "dismissed",
  APPLIED: "applied",
};

// ─── Task / Workflow Priority ─────────────────────────────────────────────────
const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

module.exports = {
  WORKFLOW,
  TASK,
  DOCUMENT,
  EMPLOYEE,
  GENERAL,
  ONBOARDING,
  AGENT_EXECUTION,
  RECOMMENDATION,
  PRIORITY,
};
