const { validationResult } = require("express-validator");
const documentService = require("../services/documentService");

class DocumentController {
  async createDocument(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const result = await documentService.createDocument(req.body);
      return res.status(201).json({
        success: true,
        message: "Document created successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDocument(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await documentService.updateDocument(id, req.body);
      return res.status(200).json({
        success: true,
        message: "Document updated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await documentService.deleteDocument(id);
      return res.status(200).json({
        success: true,
        message: "Document deleted successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowDocuments(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { workflowId } = req.params;
      const result = await documentService.getWorkflowDocuments(workflowId);
      return res.status(200).json({
        success: true,
        message: "Workflow documents retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async generateOfferLetter(req, res, next) {
    try {
      const { workflowId } = req.params;
      const result = await documentService.generateOfferLetter(workflowId, req.body);
      return res.status(201).json({
        success: true,
        message: "Offer letter generated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async generateAppointmentLetter(req, res, next) {
    try {
      const { workflowId } = req.params;
      const result = await documentService.generateAppointmentLetter(workflowId, req.body);
      return res.status(201).json({
        success: true,
        message: "Appointment letter generated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async generateWelcomeLetter(req, res, next) {
    try {
      const { workflowId } = req.params;
      const result = await documentService.generateWelcomeLetter(workflowId, req.body);
      return res.status(201).json({
        success: true,
        message: "Welcome letter generated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await documentService.getDocumentStatus(id);
      if (result === null) {
        return res.status(404).json({
          success: false,
          message: "Document not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Document status retrieved successfully",
        data: { status: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadDocument(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await documentService.downloadDocument(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Document not found",
          errors: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "Document file details retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async regenerateDocument(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const result = await documentService.regenerateDocument(id);
      return res.status(200).json({
        success: true,
        message: "Document regenerated successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();
