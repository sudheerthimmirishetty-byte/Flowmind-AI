/**
 * @file departmentController.js
 * @description HTTP request handlers for the Department module.
 *              Delegates all logic to departmentService.
 * @module controllers/departmentController
 */

"use strict";

const { validationResult } = require("express-validator");
const departmentService     = require("../services/departmentService");

// ─── Helper ───────────────────────────────────────────────────────────────────

const getValidationErrors = (req) => {
  const result = validationResult(req);
  return result.isEmpty() ? null : result.array();
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/departments
 * Create a new department within a company.
 */
const createDepartment = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const department = await departmentService.createDepartment(req.body);

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /api/departments/:id
 * Update an existing department.
 */
const updateDepartment = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const department = await departmentService.updateDepartment(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/departments/:id/status
 * Update department status (active / inactive).
 */
const updateDepartmentStatus = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const department = await departmentService.updateDepartmentStatus(
      req.params.id,
      req.body.status
    );

    return res.status(200).json({
      success: true,
      message: "Department status updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/departments/:id
 * Hard-delete a department (fails if tasks reference it via FK).
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    await departmentService.deleteDepartment(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/departments/:id
 * Retrieve a single department by UUID.
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const department = await departmentService.getDepartmentById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Department retrieved successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/departments
 * Retrieve a paginated, filterable list of departments.
 * Supports: search, status, company_id, sortBy, sortOrder, page, limit
 */
const getDepartments = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const {
      page       = 1,
      limit      = 10,
      search,
      status,
      company_id,
      sortBy     = "created_at",
      sortOrder  = "desc",
    } = req.query;

    const result = await departmentService.getDepartments({
      page      : Number(page),
      limit     : Number(limit),
      search    : search     || null,
      status    : status     || null,
      company_id: company_id || null,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Departments retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/departments/company/:company_id
 * Retrieve all active departments for a specific company.
 * Lightweight response for frontend dropdown/select lists.
 */
const getAllDepartmentsByCompany = async (req, res, next) => {
  try {
    const { company_id } = req.params;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
        errors: [{ param: "company_id", msg: "Company ID is required" }],
      });
    }

    const departments = await departmentService.getAllDepartmentsByCompany(company_id);

    return res.status(200).json({
      success: true,
      message: "Departments retrieved successfully",
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  getAllDepartmentsByCompany,
};
