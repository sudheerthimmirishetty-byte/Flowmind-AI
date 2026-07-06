/**
 * @file companyController.js
 * @description HTTP request handlers for the Company module.
 *              Controllers are thin — they validate, delegate to the service,
 *              and return a consistent response. Zero business logic here.
 * @module controllers/companyController
 */

"use strict";

const { validationResult } = require("express-validator");
const companyService        = require("../services/companyService");

// ─── Helper: extract validation errors ────────────────────────────────────────

/**
 * Returns express-validator errors as a formatted array.
 * @param {import('express').Request} req
 * @returns {Array|null}
 */
const getValidationErrors = (req) => {
  const result = validationResult(req);
  return result.isEmpty() ? null : result.array();
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/companies
 * Create a new company.
 */
const createCompany = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const company = await companyService.createCompany(req.body);

    return res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /api/companies/:id
 * Update an existing company.
 */
const updateCompany = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const company = await companyService.updateCompany(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/companies/:id/status
 * Update company status only (active / inactive / suspended).
 */
const updateCompanyStatus = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const company = await companyService.updateCompanyStatus(
      req.params.id,
      req.body.status
    );

    return res.status(200).json({
      success: true,
      message: "Company status updated successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/companies/:id
 * Hard-delete a company.
 */
const deleteCompany = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    await companyService.deleteCompany(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Company deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/companies/:id
 * Retrieve a single company by ID.
 */
const getCompanyById = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const company = await companyService.getCompanyById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Company retrieved successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/companies
 * Retrieve a paginated, filterable list of companies.
 * Supports: search, status, industry, sortBy, sortOrder, page, limit
 */
const getCompanies = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const {
      page      = 1,
      limit     = 10,
      search,
      status,
      industry,
      sortBy    = "created_at",
      sortOrder = "desc",
    } = req.query;

    const result = await companyService.getCompanies({
      page    : Number(page),
      limit   : Number(limit),
      search  : search   || null,
      status  : status   || null,
      industry: industry || null,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Companies retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/companies/all
 * Retrieve all active companies for dropdown/select lists.
 * Returns lightweight payload: id, company_name, industry, status.
 */
const getAllCompanies = async (req, res, next) => {
  try {
    const companies = await companyService.getAllCompanies();

    return res.status(200).json({
      success: true,
      message: "All companies retrieved successfully",
      data: companies,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createCompany,
  updateCompany,
  updateCompanyStatus,
  deleteCompany,
  getCompanyById,
  getCompanies,
  getAllCompanies,
};
