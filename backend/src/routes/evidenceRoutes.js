import express from "express";

import {
  uploadEvidence,
  getEvidence,
  getEvidenceById,
  downloadEvidence,
  verifyEvidenceIntegrity
} from "../controllers/evidenceController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import uploadEvidenceFile from "../middleware/evidenceUploadMiddleware.js";

const router = express.Router();

// All evidence endpoints require authentication.
router.use(authMiddleware);

// Upload: Investigation Officer only.
router.post(
  "/",
  authorizeRoles("investigation_officer"),
  uploadEvidenceFile,
  uploadEvidence
);

// Read/search: provisional access for all four project roles.
router.get(
  "/",
  authorizeRoles(
    "administrator",
    "investigation_officer",
    "forensic_analyst",
    "authorized_reviewer"
  ),
  getEvidence
);

router.get(
  "/:evidenceId",
  authorizeRoles(
    "administrator",
    "investigation_officer",
    "forensic_analyst",
    "authorized_reviewer"
  ),
  getEvidenceById
);

router.get(
  "/:evidenceId/download",
  authorizeRoles(
    "administrator",
    "investigation_officer",
    "forensic_analyst",
    "authorized_reviewer"
  ),
  downloadEvidence
);

router.post(
  "/:evidenceId/verify",
  authorizeRoles(
    "administrator",
    "investigation_officer",
    "forensic_analyst",
    "authorized_reviewer"
  ),
  verifyEvidenceIntegrity
);

export default router;