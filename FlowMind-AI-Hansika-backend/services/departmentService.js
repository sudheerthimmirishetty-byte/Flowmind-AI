/**
 * @file departmentService.js
 * @description Business logic and Supabase queries for the Department module.
 * @module services/departmentService
 */

"use strict";

const { supabase } = require("../supabase/client");

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABLE         = "departments";
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 10;

const LIST_COLUMNS =
  "id, company_id, department_name, department_code, description, status, created_at, updated_at";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const buildRange = (page, limit) => {
  const from = (page - 1) * limit;
  return { from, to: from + limit - 1 };
};

// ─── Service Methods ───────────────────────────────────────────────────────────

/**
 * Creates a new department.
 * Enforces unique department_code per company.
 * @param {object} payload - Validated request body
 * @returns {Promise<object>} Created department
 */
const createDepartment = async (payload) => {
  const {
    company_id,
    department_name,
    department_code,
    description = null,
    status      = "active",
  } = payload;

  // Unique code guard — per company scope
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("company_id", company_id)
    .ilike("department_code", department_code)
    .maybeSingle();

  if (existing) {
    const error = new Error(
      "A department with this code already exists within the company"
    );
    error.statusCode = 409;
    throw error;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        company_id,
        department_name,
        department_code: department_code.toUpperCase(),
        description,
        status,
      },
    ])
    .select(LIST_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates an existing department by ID.
 * @param {string} id      - Department UUID
 * @param {object} payload - Fields to update
 * @returns {Promise<object>} Updated department
 */
const updateDepartment = async (id, payload) => {
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("id, company_id, department_code")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    throw error;
  }

  // If department_code is being changed, enforce uniqueness within company
  const targetCompany = payload.company_id || existing.company_id;
  if (
    payload.department_code &&
    payload.department_code.toUpperCase() !== existing.department_code.toUpperCase()
  ) {
    const { data: duplicate } = await supabase
      .from(TABLE)
      .select("id")
      .eq("company_id", targetCompany)
      .ilike("department_code", payload.department_code)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      const error = new Error(
        "A department with this code already exists within the company"
      );
      error.statusCode = 409;
      throw error;
    }
  }

  const updates = {};
  const allowedFields = [
    "company_id",
    "department_name",
    "department_code",
    "description",
    "status",
  ];
  allowedFields.forEach((field) => {
    if (field in payload) {
      updates[field] =
        field === "department_code"
          ? payload[field].toUpperCase()
          : payload[field];
    }
  });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select(LIST_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates department status.
 * @param {string} id     - Department UUID
 * @param {string} status - New status
 * @returns {Promise<object>} Updated department
 */
const updateDepartmentStatus = async (id, status) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(LIST_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard-deletes a department.
 * Will fail if tasks or other records reference this department (FK constraint).
 * @param {string} id - Department UUID
 */
const deleteDepartment = async (id) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    throw error;
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves a single department by UUID.
 * @param {string} id - Department UUID
 * @returns {Promise<object>}
 */
const getDepartmentById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(LIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const notFound = new Error("Department not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a paginated, filterable, searchable list of departments.
 *
 * Supported filters: search, status, company_id, sortBy, sortOrder, page, limit
 *
 * @param {object} filters
 * @returns {Promise<{ data, total, page, limit, totalPages }>}
 */
const getDepartments = async (filters = {}) => {
  const {
    search     = null,
    status     = null,
    company_id = null,
    sortBy     = "created_at",
    sortOrder  = "desc",
    page       = DEFAULT_PAGE,
    limit      = DEFAULT_LIMIT,
  } = filters;

  const { from, to } = buildRange(page, limit);

  let query = supabase
    .from(TABLE)
    .select(LIST_COLUMNS, { count: "exact" })
    .range(from, to)
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (status)     query = query.eq("status", status);
  if (company_id) query = query.eq("company_id", company_id);

  if (search) {
    query = query.or(
      `department_name.ilike.%${search}%,department_code.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    total     : count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a lightweight list of all active departments for a given company.
 * Used by frontend dropdowns / select inputs.
 * @param {string} company_id - Company UUID
 * @returns {Promise<object[]>}
 */
const getAllDepartmentsByCompany = async (company_id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, department_name, department_code")
    .eq("company_id", company_id)
    .eq("status", "active")
    .order("department_name", { ascending: true });

  if (error) throw error;
  return data;
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
