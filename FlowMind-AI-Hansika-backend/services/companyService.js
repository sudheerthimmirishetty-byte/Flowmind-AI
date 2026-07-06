/**
 * @file companyService.js
 * @description Business logic and Supabase queries for the Company module.
 *              All database interactions are isolated in this service layer.
 * @module services/companyService
 */

"use strict";

const { supabase } = require("../supabase/client");

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABLE      = "companies";
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 10;

/**
 * Columns returned in list/search responses (avoids over-fetching).
 * Full details are returned by getCompanyById.
 */
const LIST_COLUMNS = "id, company_name, industry, company_email, website, logo_url, status, created_at, updated_at";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a Supabase pagination range from page/limit params.
 * @param {number} page  - 1-indexed page number
 * @param {number} limit - records per page
 * @returns {{ from: number, to: number }}
 */
const buildRange = (page, limit) => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;
  return { from, to };
};

// ─── Service Methods ───────────────────────────────────────────────────────────

/**
 * Creates a new company record.
 * @param {object} payload - Validated request body
 * @returns {Promise<object>} Created company record
 * @throws {Error} If insertion fails or email is already taken
 */
const createCompany = async (payload) => {
  const {
    company_name,
    industry,
    company_email,
    website     = null,
    logo_url    = null,
    status      = "active",
  } = payload;

  // Check for duplicate company email
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("company_email", company_email)
    .maybeSingle();

  if (existing) {
    const error = new Error("A company with this email address already exists");
    error.statusCode = 409;
    throw error;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        company_name,
        industry,
        company_email,
        website,
        logo_url,
        status,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates an existing company by ID.
 * Only provided fields are updated (partial update pattern).
 * @param {string} id      - Company UUID
 * @param {object} payload - Fields to update
 * @returns {Promise<object>} Updated company record
 * @throws {Error} If company not found or update fails
 */
const updateCompany = async (id, payload) => {
  // Verify the record exists first to return a meaningful 404
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("id, company_email")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  // If a new email is provided, check for conflicts with other companies
  if (payload.company_email && payload.company_email !== existing.company_email) {
    const { data: duplicate } = await supabase
      .from(TABLE)
      .select("id")
      .eq("company_email", payload.company_email)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      const error = new Error("A company with this email address already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  // Strip undefined values — only send fields explicitly provided
  const updates = {};
  const allowedFields = ["company_name", "industry", "company_email", "website", "logo_url", "status"];
  allowedFields.forEach((field) => {
    if (field in payload) updates[field] = payload[field];
  });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Soft-updates company status (active / inactive / suspended).
 * @param {string} id     - Company UUID
 * @param {string} status - New status value
 * @returns {Promise<object>} Updated company record
 */
const updateCompanyStatus = async (id, status) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard-deletes a company by ID.
 * NOTE: This will fail if related records exist (FK constraints).
 * @param {string} id - Company UUID
 * @returns {Promise<void>}
 */
const deleteCompany = async (id) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves a single company by UUID with all fields.
 * @param {string} id - Company UUID
 * @returns {Promise<object>} Company record
 */
const getCompanyById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const notFound = new Error("Company not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves a paginated, filterable, searchable list of companies.
 *
 * Supported filters:
 *   - search   : substring match on company_name, company_email, industry
 *   - status   : exact match
 *   - industry : exact match
 *   - sortBy   : column to sort
 *   - sortOrder: asc | desc
 *   - page     : page number (1-indexed)
 *   - limit    : records per page
 *
 * @param {object} filters - Query parameters from the request
 * @returns {Promise<{ data: object[], total: number, page: number, limit: number, totalPages: number }>}
 */
const getCompanies = async (filters = {}) => {
  const {
    search    = null,
    status    = null,
    industry  = null,
    sortBy    = "created_at",
    sortOrder = "desc",
    page      = DEFAULT_PAGE,
    limit     = DEFAULT_LIMIT,
  } = filters;

  const { from, to } = buildRange(page, limit);

  let query = supabase
    .from(TABLE)
    .select(LIST_COLUMNS, { count: "exact" })
    .range(from, to)
    .order(sortBy, { ascending: sortOrder === "asc" });

  // Exact filters
  if (status)   query = query.eq("status", status);
  if (industry) query = query.ilike("industry", `%${industry}%`);

  // Full-text search across multiple columns using OR
  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,company_email.ilike.%${search}%,industry.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    total      : count,
    page,
    limit,
    totalPages : Math.ceil(count / limit),
  };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convenience alias — returns all companies without pagination filters.
 * Used for dropdown/select lists in the frontend.
 * @returns {Promise<object[]>}
 */
const getAllCompanies = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, company_name, industry, status")
    .eq("status", "active")
    .order("company_name", { ascending: true });

  if (error) throw error;
  return data;
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
