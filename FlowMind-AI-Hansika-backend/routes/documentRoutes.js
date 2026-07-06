const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const {
  validateCreateDocument,
  validateUpdateDocument,
  validateIdParam
} = require("../validators/documentValidator");

router.post("/", validateCreateDocument, documentController.createDocument);
router.put("/:id", validateUpdateDocument, documentController.updateDocument);
router.delete("/:id", validateIdParam, documentController.deleteDocument);
router.get("/workflow/:workflowId", documentController.getWorkflowDocuments);
router.post("/workflow/:workflowId/generate-offer", documentController.generateOfferLetter);
router.post("/workflow/:workflowId/generate-appointment", documentController.generateAppointmentLetter);
router.post("/workflow/:workflowId/generate-welcome", documentController.generateWelcomeLetter);
router.get("/:id/status", validateIdParam, documentController.getDocumentStatus);
router.get("/:id/download", validateIdParam, documentController.downloadDocument);
router.post("/:id/regenerate", validateIdParam, documentController.regenerateDocument);

module.exports = router;
