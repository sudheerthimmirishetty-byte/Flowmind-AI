/**
 * @file employeeService.js
 * @description Business logic and Supabase queries for the Employee module.
 *              Integrates with: employees table, workflows table (FK).
 *              Supports the EmployeeList.jsx page (search, filter, pagination, sort)
 *              and the EmployeeRegistration.jsx form (create).
 * @module services/employeeService
 */

"use strict";

const { supabase } = require("../supabase/client");

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABLE         = "employees";
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 8; // Matches PAGE_SIZE = 8 in EmployeeList.jsx

/**
 * Full column set for employee detail views.
 * Maps directly to the ViewModal and Profile page fields.
 */
const FULL_COLUMNS = `
  id,
  workflow_id,
  employee_name,
  employee_email,
  phone,
  role,
  department,
  joining_date,
  salary,
  manager_name,
  employee_status,
  created_at,
  updated_at
`;

/**
 * Lightweight columns for list/table views.
 * Maps to EmployeeList.jsx table columns:
 *   name, department, email, joiningDate, status, progress (derived)
 */
const LIST_COLUMNS = `
  id,
  workflow_id,
  employee_name,
  employee_email,
  department,
  role,
  joining_date,
  employee_status,
  created_at
`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const buildRange = (page, limit) => {
  const from = (page - 1) * limit;
  return { from, to: from + limit - 1 };
};

// ─── Service Methods ───────────────────────────────────────────────────────────

/**
 * Creates a new employee record.
 * Validates that the provided workflow_id exists (if supplied).
 * Checks for duplicate employee_email.
 *
 * @param {object} payload - Validated form data from EmployeeRegistration.jsx
 * @returns {Promise<object>} Created employee record
 */
const createEmployee = async (payload) => {
  const {
    workflow_id      = null,
    employee_name,
    employee_email,
    phone            = null,
    role,
    department,
    joining_date,
    salary,
    manager_name     = null,
    employee_status  = "Pending",
  } = payload;

  const workflowService = require("./workflowService");
  const documentService = require("./documentService");

  // Duplicate email guard — an employee_email must be unique
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("employee_email", employee_email)
    .maybeSingle();

  if (existing) {
    const error = new Error("An employee with this email address already exists");
    error.statusCode = 409;
    throw error;
  }

  // Automatically create workflow if not provided
  let linkedWorkflowId = workflow_id;
  if (!linkedWorkflowId) {
    try {
      const workflowNumber = `WF-${Math.floor(100000 + Math.random() * 900000)}`;
      const newWf = await workflowService.createWorkflow({
        workflow_number: workflowNumber,
        workflow_name: `Onboarding - ${employee_name}`,
        workflow_status: "In Progress",
        progress_percentage: 15,
        priority: "Medium",
        company_id: "99999999-9999-9999-9999-999999999999"
      });
      linkedWorkflowId = newWf.id;
    } catch (wfErr) {
      console.error("Failed to automatically create onboarding workflow:", wfErr);
    }
  }

  // Validate workflow_id exists (if provided)
  if (linkedWorkflowId) {
    const { data: workflow } = await supabase
      .from("workflows")
      .select("id")
      .eq("id", linkedWorkflowId)
      .maybeSingle();

    if (!workflow) {
      const error = new Error("Referenced workflow does not exist");
      error.statusCode = 400;
      throw error;
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        workflow_id: linkedWorkflowId,
        employee_name,
        employee_email,
        phone,
        role,
        department,
        joining_date,
        salary,
        manager_name,
        employee_status,
      },
    ])
    .select(FULL_COLUMNS)
    .single();

  if (error) throw error;

  // Trigger background document generation
  if (linkedWorkflowId) {
    documentService.generateAllOnboardingDocuments(data.id, linkedWorkflowId, data)
      .catch((err) => console.error("Error generating onboarding documents in background:", err));
    
    workflowService.triggerN8nAutomation(data.id, linkedWorkflowId, data)
      .catch((err) => console.error("Error triggering n8n automation in background:", err));
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates an existing employee record (partial update).
 * Handles email uniqueness guard on change.
 *
 * @param {string} id      - Employee UUID
 * @param {object} payload - Fields to update
 * @returns {Promise<object>} Updated employee record
 */
const updateEmployee = async (id, payload) => {
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("id, employee_email")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  // Duplicate email guard when email changes
  if (payload.employee_email && payload.employee_email !== existing.employee_email) {
    const { data: duplicate } = await supabase
      .from(TABLE)
      .select("id")
      .eq("employee_email", payload.employee_email)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      const error = new Error("An employee with this email address already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  // Validate workflow_id if being updated
  if (payload.workflow_id) {
    const { data: workflow } = await supabase
      .from("workflows")
      .select("id")
      .eq("id", payload.workflow_id)
      .maybeSingle();

    if (!workflow) {
      const error = new Error("Referenced workflow does not exist");
      error.statusCode = 400;
      throw error;
    }
  }

  const updates = {};
  const allowedFields = [
    "workflow_id",
    "employee_name",
    "employee_email",
    "phone",
    "role",
    "department",
    "joining_date",
    "salary",
    "manager_name",
    "employee_status",
  ];
  allowedFields.forEach((field) => {
    if (field in payload) updates[field] = payload[field];
  });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select(FULL_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates employee_status only.
 * Mirrors the status badge change in EmployeeList.jsx EditModal.
 *
 * @param {string} id              - Employee UUID
 * @param {string} employee_status - New status value
 * @returns {Promise<object>} Updated employee record
 */
const updateEmployeeStatus = async (id, employee_status) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ employee_status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(FULL_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard-deletes an employee record by ID.
 * @param {string} id - Employee UUID
 */
const deleteEmployee = async (id) => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves a single employee by UUID with full column projection.
 * Used for Profile and detail view (ViewModal in EmployeeList.jsx).
 *
 * @param {string} id - Employee UUID
 * @returns {Promise<object>} Full employee record
 */
const getEmployeeById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(FULL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const notFound = new Error("Employee not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a paginated, filterable, searchable list of employees.
 *
 * Mirrors EmployeeList.jsx behavior:
 *   - PAGE_SIZE = 8
 *   - STATUS_OPTIONS = ["All", "Pending", "In Progress", "Completed", "Rejected"]
 *   - Search by name, email, department
 *   - Sort by any visible column
 *
 * @param {object} filters - Query parameters
 * @returns {Promise<{ data, total, page, limit, totalPages }>}
 */
const getEmployees = async (filters = {}) => {
  const {
    search          = null,
    employee_status = null,
    department      = null,
    workflow_id     = null,
    sortBy          = "created_at",
    sortOrder       = "desc",
    page            = DEFAULT_PAGE,
    limit           = DEFAULT_LIMIT,
  } = filters;

  const { from, to } = buildRange(page, limit);

  let query = supabase
    .from(TABLE)
    .select(LIST_COLUMNS, { count: "exact" })
    .range(from, to)
    .order(sortBy, { ascending: sortOrder === "asc" });

  // Status filter — skip if "All" or null
  if (employee_status && employee_status !== "All") {
    query = query.eq("employee_status", employee_status);
  }

  if (department)  query = query.ilike("department", `%${department}%`);
  if (workflow_id) query = query.eq("workflow_id", workflow_id);

  // Search across name, email, department
  if (search) {
    query = query.or(
      `employee_name.ilike.%${search}%,employee_email.ilike.%${search}%,department.ilike.%${search}%`
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
 * Returns summary statistics for the HR Dashboard widgets:
 *   - total employees
 *   - pending onboarding (status = "Pending" | "In Progress")
 *   - completed onboarding (status = "Completed")
 *   - rejected (status = "Rejected")
 *
 * Maps directly to the stats array in HRDashboard.jsx.
 *
 * @returns {Promise<object>} stats object
 */
const getEmployeeStats = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("employee_status");

  if (error) throw error;

  const total     = data.length;
  const pending   = data.filter((e) =>
    ["Pending", "In Progress"].includes(e.employee_status)
  ).length;
  const completed = data.filter((e) => e.employee_status === "Completed").length;
  const rejected  = data.filter((e) => e.employee_status === "Rejected").length;

  return { total, pending, completed, rejected };
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
