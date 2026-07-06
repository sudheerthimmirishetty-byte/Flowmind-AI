/**
 * @file employeeController.js
 * @description HTTP request handlers for the Employee module.
 *              Supports all frontend pages:
 *                - EmployeeRegistration.jsx  → POST /employees
 *                - EmployeeList.jsx          → GET /employees (search/filter/paginate/sort)
 *                - ViewModal                 → GET /employees/:id
 *                - EditModal                 → PUT /employees/:id
 *                - Status badge change       → PATCH /employees/:id/status
 *                - HRDashboard stats widget  → GET /employees/stats
 * @module controllers/employeeController
 */

"use strict";

const { validationResult } = require("express-validator");
const employeeService       = require("../services/employeeService");

// ─── Helper ───────────────────────────────────────────────────────────────────

const getValidationErrors = (req) => {
  const result = validationResult(req);
  return result.isEmpty() ? null : result.array();
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/employees
 * Create a new employee.
 * Body maps to EmployeeRegistration.jsx form fields.
 */
const createEmployee = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const employee = await employeeService.createEmployee(req.body);

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /api/employees/:id
 * Update an existing employee.
 * Supports partial update — only provided fields are changed.
 */
const updateEmployee = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const employee = await employeeService.updateEmployee(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/employees/:id/status
 * Update employee_status only.
 * Maps to the status dropdown in EmployeeList.jsx EditModal.
 */
const updateEmployeeStatus = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const employee = await employeeService.updateEmployeeStatus(
      req.params.id,
      req.body.employee_status
    );

    return res.status(200).json({
      success: true,
      message: "Employee status updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/employees/:id
 * Hard-delete an employee record.
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    await employeeService.deleteEmployee(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/employees/:id
 * Retrieve full employee details.
 * Maps to ViewModal in EmployeeList.jsx and Profile.jsx.
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const employee = await employeeService.getEmployeeById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/employees
 * Retrieve a paginated, filterable, searchable list of employees.
 *
 * Query Params (mirrors EmployeeList.jsx behavior):
 *   page            - 1-indexed page (default: 1)
 *   limit           - records per page (default: 8, matches PAGE_SIZE)
 *   search          - search by name, email, department
 *   employee_status - filter by status (All | Pending | In Progress | Completed | Rejected)
 *   department      - filter by department name (partial match)
 *   workflow_id     - filter by workflow UUID
 *   sortBy          - column to sort on
 *   sortOrder       - asc | desc
 */
const getEmployees = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const {
      page            = 1,
      limit           = 8,
      search,
      employee_status,
      department,
      workflow_id,
      sortBy          = "created_at",
      sortOrder       = "desc",
    } = req.query;

    const result = await employeeService.getEmployees({
      page           : Number(page),
      limit          : Number(limit),
      search         : search          || null,
      employee_status: employee_status || null,
      department     : department      || null,
      workflow_id    : workflow_id     || null,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/employees/stats
 * Returns aggregated employee statistics for the HR Dashboard widgets.
 *
 * Response maps to HRDashboard.jsx stats array:
 *   total      → "Total Employees"
 *   pending    → "Pending Onboarding" (Pending + In Progress)
 *   completed  → "Completed"
 *   rejected   → "Rejected"
 */
const getEmployeeStats = async (req, res, next) => {
  try {
    const stats = await employeeService.getEmployeeStats();

    return res.status(200).json({
      success: true,
      message: "Employee statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  getEmployeeStats,
};
