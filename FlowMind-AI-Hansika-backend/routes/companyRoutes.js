/**
 * @file companyRoutes.js
 * @description Express router for the Company module.
 *
 * Route Map:
 *   GET     /api/companies/all        → getAllCompanies   (lightweight dropdown list)
 *   GET     /api/companies            → getCompanies      (paginated, filterable)
 *   GET     /api/companies/:id        → getCompanyById
 *   POST    /api/companies            → createCompany
 *   PUT     /api/companies/:id        → updateCompany
 *   PATCH   /api/companies/:id/status → updateCompanyStatus
 *   DELETE  /api/companies/:id        → deleteCompany
 *
 * @module routes/companyRoutes
 */

"use strict";

const express            = require("express");
const router             = express.Router();
const companyController  = require("../controllers/companyController");
const {
  validateCreateCompany,
  validateUpdateCompany,
  validateUpdateCompanyStatus,
  validateGetCompanies,
  validateGetCompanyById,
  validateDeleteCompany,
} = require("../validators/companyValidator");

// ─── Assumes authentication middleware is applied in server.js ────────────────
// const authenticate = require("../middlewares/authMiddleware");
// router.use(authenticate);

// ─── Static sub-paths must be declared BEFORE parameterized /:id ──────────────

/**
 * GET /api/companies/all
 * Returns lightweight list of all active companies for dropdowns/selects.
 * No pagination — used by create-user and create-employee forms.
 */
router.get("/all", companyController.getAllCompanies);

// ─── Parameterized routes ─────────────────────────────────────────────────────

/**
 * GET /api/companies
 * Retrieve paginated and filtered list of companies.
 * Supports: search, status, industry, sortBy, sortOrder, page, limit
 */
router.get("/", validateGetCompanies, companyController.getCompanies);

/**
 * GET /api/companies/:id
 * Retrieve a single company by UUID.
 */
router.get("/:id", validateGetCompanyById, companyController.getCompanyById);

/**
 * POST /api/companies
 * Create a new company.
 */
router.post("/", validateCreateCompany, companyController.createCompany);

/**
 * PUT /api/companies/:id
 * Update company details (partial update supported).
 */
router.put("/:id", validateUpdateCompany, companyController.updateCompany);

/**
 * PATCH /api/companies/:id/status
 * Update only the company status field.
 */
router.patch("/:id/status", validateUpdateCompanyStatus, companyController.updateCompanyStatus);

/**
 * DELETE /api/companies/:id
 * Hard-delete a company.
 */
router.delete("/:id", validateDeleteCompany, companyController.deleteCompany);

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = router;
