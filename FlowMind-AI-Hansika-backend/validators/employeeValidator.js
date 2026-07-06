/**
 * @file employeeValidator.js
 * @description Validation rules for the Employee module.
 *              Mirrors the EmployeeRegistration.jsx form fields precisely.
 * @module validators/employeeValidator
 */

"use strict";

const { body, param, query } = require("express-validator");

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Valid employee_status values.
 * Maps directly to frontend STATUS_OPTIONS in EmployeeList.jsx.
 */
const VALID_STATUSES = ["Pending", "In Progress", "Completed", "Rejected"];

/**
 * Valid role values for an employee within a workflow/department.
 */
const VALID_ROLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "Lead Engineer",
  "Engineering Manager",
  "HR Manager",
  "HR Executive",
  "Finance Manager",
  "Finance Analyst",
  "IT Support",
  "IT Manager",
  "Admin Executive",
  "Department Manager",
  "Director",
  "VP",
  "C-Suite",
  "Intern",
  "Contractor",
];

// ─── Reusable param validator ──────────────────────────────────────────────────

const validateEmployeeId = [
  param("id")
    .isUUID(4)
    .withMessage("Employee ID must be a valid UUID"),
];

// ─── Create Employee ───────────────────────────────────────────────────────────

/**
 * Validation rules for POST /employees
 * Maps exactly to the EmployeeRegistration.jsx form.
 */
const validateCreateEmployee = [
  body("workflow_id")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isUUID(4)
    .withMessage("Workflow ID must be a valid UUID"),

  body("employee_name")
    .trim()
    .notEmpty()
    .withMessage("Employee name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Employee name must be between 2 and 150 characters"),

  body("employee_email")
    .trim()
    .notEmpty()
    .withMessage("Employee email is required")
    .isEmail()
    .withMessage("Employee email must be a valid email address")
    .normalizeEmail(),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Phone must be a valid international phone number"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isLength({ max: 100 })
    .withMessage("Role must not exceed 100 characters"),

  body("department")
    .trim()
    .notEmpty()
    .withMessage("Department is required")
    .isLength({ max: 100 })
    .withMessage("Department must not exceed 100 characters"),

  body("joining_date")
    .notEmpty()
    .withMessage("Joining date is required")
    .isISO8601()
    .withMessage("Joining date must be a valid ISO 8601 date (YYYY-MM-DD)")
    .toDate(),

  body("salary")
    .notEmpty()
    .withMessage("Salary is required")
    .isFloat({ min: 0 })
    .withMessage("Salary must be a non-negative number")
    .toFloat(),

  body("manager_name")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Manager name must not exceed 150 characters"),

  body("employee_status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Employee status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Update Employee ───────────────────────────────────────────────────────────

/**
 * Validation rules for PUT /employees/:id
 * All fields optional — supports partial updates.
 */
const validateUpdateEmployee = [
  ...validateEmployeeId,

  body("workflow_id")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isUUID(4)
    .withMessage("Workflow ID must be a valid UUID"),

  body("employee_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Employee name cannot be blank")
    .isLength({ min: 2, max: 150 })
    .withMessage("Employee name must be between 2 and 150 characters"),

  body("employee_email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Employee email must be a valid email address")
    .normalizeEmail(),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Phone must be a valid international phone number"),

  body("role")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Role cannot be blank")
    .isLength({ max: 100 })
    .withMessage("Role must not exceed 100 characters"),

  body("department")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department cannot be blank")
    .isLength({ max: 100 })
    .withMessage("Department must not exceed 100 characters"),

  body("joining_date")
    .optional()
    .isISO8601()
    .withMessage("Joining date must be a valid ISO 8601 date (YYYY-MM-DD)")
    .toDate(),

  body("salary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Salary must be a non-negative number")
    .toFloat(),

  body("manager_name")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Manager name must not exceed 150 characters"),

  body("employee_status")
    .optional()
    .trim()
    .isIn(VALID_STATUSES)
    .withMessage(`Employee status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Update Employee Status ────────────────────────────────────────────────────

/**
 * Validation rules for PATCH /employees/:id/status
 */
const validateUpdateEmployeeStatus = [
  ...validateEmployeeId,

  body("employee_status")
    .trim()
    .notEmpty()
    .withMessage("Employee status is required")
    .isIn(VALID_STATUSES)
    .withMessage(`Employee status must be one of: ${VALID_STATUSES.join(", ")}`),
];

// ─── Get / Search / Filter Employees ──────────────────────────────────────────

/**
 * Validation rules for GET /employees (list, search, filter, pagination, sort)
 * Supports all filters used by EmployeeList.jsx:
 *   - search (by name, email, department)
 *   - status filter
 *   - department filter
 *   - company filter (via workflow join)
 *   - pagination
 *   - sorting
 */
const validateGetEmployees = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search query must not exceed 200 characters"),

  query("employee_status")
    .optional()
    .trim()
    .isIn([...VALID_STATUSES, "All"])
    .withMessage(`Status filter must be one of: All, ${VALID_STATUSES.join(", ")}`),

  query("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department filter must not exceed 100 characters"),

  query("workflow_id")
    .optional()
    .trim()
    .isUUID(4)
    .withMessage("workflow_id filter must be a valid UUID"),

  query("sortBy")
    .optional()
    .trim()
    .isIn([
      "employee_name",
      "employee_email",
      "department",
      "role",
      "joining_date",
      "salary",
      "employee_status",
      "created_at",
    ])
    .withMessage(
      "sortBy must be one of: employee_name, employee_email, department, role, joining_date, salary, employee_status, created_at"
    ),

  query("sortOrder")
    .optional()
    .trim()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
];

// ─── Singular record lookups ───────────────────────────────────────────────────

const validateGetEmployeeById = [...validateEmployeeId];
const validateDeleteEmployee  = [...validateEmployeeId];

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  validateCreateEmployee,
  validateUpdateEmployee,
  validateUpdateEmployeeStatus,
  validateGetEmployees,
  validateGetEmployeeById,
  validateDeleteEmployee,
  VALID_STATUSES,
};
