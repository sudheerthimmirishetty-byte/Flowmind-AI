/**
 * @file departmentRoutes.js
 * @description Express router for the Department module.
 *
 * Route Map:
 *   GET     /api/departments/company/:company_id  → getAllDepartmentsByCompany (dropdown)
 *   GET     /api/departments                      → getDepartments (paginated, filterable)
 *   GET     /api/departments/:id                  → getDepartmentById
 *   POST    /api/departments                      → createDepartment
 *   PUT     /api/departments/:id                  → updateDepartment
 *   PATCH   /api/departments/:id/status           → updateDepartmentStatus
 *   DELETE  /api/departments/:id                  → deleteDepartment
 *
 * @module routes/departmentRoutes
 */

"use strict";

const express               = require("express");
const router                = express.Router();
const departmentController  = require("../controllers/departmentController");
const {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateUpdateDepartmentStatus,
  validateGetDepartments,
  validateGetDepartmentById,
  validateDeleteDepartment,
} = require("../validators/departmentValidator");

// ─── Assumes authentication middleware is applied in server.js ────────────────
// const authenticate = require("../middlewares/authMiddleware");
// router.use(authenticate);

// ─── Static sub-paths before parameterized /:id ───────────────────────────────

/**
 * GET /api/departments/company/:company_id
 * Returns lightweight list of active departments for a specific company.
 * Used by frontend dropdowns in employee/task creation forms.
 */
router.get(
  "/company/:company_id",
  departmentController.getAllDepartmentsByCompany
);

// ─── Collection routes ────────────────────────────────────────────────────────

/**
 * GET /api/departments
 * Retrieve paginated, filtered, searchable list of departments.
 * Supports: search, status, company_id, sortBy, sortOrder, page, limit
 */
router.get("/", validateGetDepartments, departmentController.getDepartments);

/**
 * POST /api/departments
 * Create a new department within a company.
 */
router.post("/", validateCreateDepartment, departmentController.createDepartment);

// ─── Member routes ────────────────────────────────────────────────────────────

/**
 * GET /api/departments/:id
 * Retrieve a single department by UUID.
 */
router.get("/:id", validateGetDepartmentById, departmentController.getDepartmentById);

/**
 * PUT /api/departments/:id
 * Update department details. Department code is auto-uppercased in service.
 */
router.put("/:id", validateUpdateDepartment, departmentController.updateDepartment);

/**
 * PATCH /api/departments/:id/status
 * Update department status (active / inactive).
 */
router.patch(
  "/:id/status",
  validateUpdateDepartmentStatus,
  departmentController.updateDepartmentStatus
);

/**
 * DELETE /api/departments/:id
 * Hard-delete a department.
 */
router.delete("/:id", validateDeleteDepartment, departmentController.deleteDepartment);

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = router;
