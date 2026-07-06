/**
 * @file employeeRoutes.js
 * @description Express router for the Employee module.
 *
 * Route Map:
 *   GET     /api/employees/stats        → getEmployeeStats   (HR Dashboard widgets)
 *   GET     /api/employees              → getEmployees       (paginated, filterable, searchable)
 *   GET     /api/employees/:id          → getEmployeeById    (ViewModal / Profile page)
 *   POST    /api/employees              → createEmployee     (EmployeeRegistration.jsx)
 *   PUT     /api/employees/:id          → updateEmployee     (EditModal in EmployeeList.jsx)
 *   PATCH   /api/employees/:id/status   → updateEmployeeStatus
 *   DELETE  /api/employees/:id          → deleteEmployee
 *
 * Frontend Consumers:
 *   - HRDashboard.jsx     → GET /employees/stats
 *   - EmployeeList.jsx    → GET /employees?search=&employee_status=&page=&limit=8&sortBy=&sortOrder=
 *   - EmployeeList.jsx    → GET /employees/:id (ViewModal)
 *   - EmployeeList.jsx    → PUT /employees/:id (EditModal save)
 *   - EmployeeList.jsx    → DELETE /employees/:id (delete button)
 *   - EmployeeRegistration.jsx → POST /employees
 *   - EmployeeDashboard.jsx    → GET /employees/:id (own profile)
 *
 * @module routes/employeeRoutes
 */

"use strict";

const express             = require("express");
const router              = express.Router();
const employeeController  = require("../controllers/employeeController");
const {
  validateCreateEmployee,
  validateUpdateEmployee,
  validateUpdateEmployeeStatus,
  validateGetEmployees,
  validateGetEmployeeById,
  validateDeleteEmployee,
} = require("../validators/employeeValidator");

// ─── Assumes authentication middleware is applied in server.js ────────────────
// const authenticate = require("../middlewares/authMiddleware");
// router.use(authenticate);

// ─── Static sub-paths BEFORE parameterized /:id ───────────────────────────────

/**
 * GET /api/employees/stats
 * Aggregate statistics for the HR Dashboard stat cards:
 *   { total, pending, completed, rejected }
 *
 * IMPORTANT: This must be declared before /:id to prevent Express
 *            from treating "stats" as a UUID parameter.
 */
router.get("/stats", employeeController.getEmployeeStats);

// ─── Collection routes ────────────────────────────────────────────────────────

/**
 * GET /api/employees
 * Retrieve a paginated, filtered, searchable list of employees.
 *
 * Query Params:
 *   page            - page number (default: 1)
 *   limit           - per-page count (default: 8, matches EmployeeList PAGE_SIZE)
 *   search          - search by employee_name, employee_email, department
 *   employee_status - All | Pending | In Progress | Completed | Rejected
 *   department      - partial match on department name
 *   workflow_id     - exact UUID match
 *   sortBy          - column name
 *   sortOrder       - asc | desc
 */
router.get("/", validateGetEmployees, employeeController.getEmployees);

/**
 * POST /api/employees
 * Create a new employee record.
 * Maps directly to EmployeeRegistration.jsx form submission.
 */
router.post("/", validateCreateEmployee, employeeController.createEmployee);

// ─── Member routes ────────────────────────────────────────────────────────────

/**
 * GET /api/employees/:id
 * Retrieve full employee profile by UUID.
 * Used by ViewModal, Profile.jsx, and EmployeeDashboard.jsx.
 */
router.get("/:id", validateGetEmployeeById, employeeController.getEmployeeById);

/**
 * PUT /api/employees/:id
 * Update employee record (partial update).
 * Maps to EditModal save in EmployeeList.jsx.
 */
router.put("/:id", validateUpdateEmployee, employeeController.updateEmployee);

/**
 * PATCH /api/employees/:id/status
 * Update employee_status only.
 * Maps to status dropdown change in EmployeeList.jsx EditModal.
 */
router.patch(
  "/:id/status",
  validateUpdateEmployeeStatus,
  employeeController.updateEmployeeStatus
);

/**
 * DELETE /api/employees/:id
 * Hard-delete an employee.
 * Maps to delete button action in EmployeeList.jsx.
 */
router.delete("/:id", validateDeleteEmployee, employeeController.deleteEmployee);

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = router;
