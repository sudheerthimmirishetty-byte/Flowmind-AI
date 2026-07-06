/**
 * @file userController.js
 * @description HTTP request handlers for the User module.
 *              Delegates all logic to userService.
 *              Authentication and JWT are handled by the Auth module.
 * @module controllers/userController
 */

"use strict";

const { validationResult } = require("express-validator");
const userService           = require("../services/userService");

// ─── Helper ───────────────────────────────────────────────────────────────────

const getValidationErrors = (req) => {
  const result = validationResult(req);
  return result.isEmpty() ? null : result.array();
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/users
 * Create a new user account.
 * Password is hashed inside userService.
 */
const createUser = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const user = await userService.createUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /api/users/:id
 * Update user profile fields (not password — use Auth module for that).
 */
const updateUser = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const user = await userService.updateUser(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/users/:id/role
 * Update a user's role.
 */
const updateUserRole = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const user = await userService.updateUserRole(req.params.id, req.body.role);

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/users/:id/status
 * Update a user's status (active / inactive / suspended).
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const user = await userService.updateUserStatus(req.params.id, req.body.status);

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/users/:id
 * Hard-delete a user account.
 */
const deleteUser = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    await userService.deleteUser(req.params.id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/users/:id
 * Retrieve a single user by UUID (no password_hash in response).
 */
const getUserById = async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const user = await userService.getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/users
 * Retrieve a paginated, filterable list of users.
 * Supports: search, status, role, company_id, sortBy, sortOrder, page, limit
 */
const getUsers = async (req, res, next) => {
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
      role,
      company_id,
      sortBy     = "created_at",
      sortOrder  = "desc",
    } = req.query;

    const result = await userService.getUsers({
      page      : Number(page),
      limit     : Number(limit),
      search    : search     || null,
      status    : status     || null,
      role      : role       || null,
      company_id: company_id || null,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserById,
  getUsers,
};
