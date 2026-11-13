import express from "express";

import {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  assignCase
} from "../controllers/caseController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Every Case Management endpoint requires authentication.
router.use(authMiddleware);

// Create a case: Investigation Officer
router.post(
  "/",
  authorizeRoles("investigation_officer"),
  createCase
);

// Search and view cases: authenticated project roles.
// Record-level permissions can be refined when the permission matrix is finalized.
router.get(
  "/",
  authorizeRoles(
    "administrator",
    "investigation_officer",
    "forensic_analyst",
    "authorized_reviewer"
  ),
  getCases
);

router.get(
  "/:caseId",
  authorizeRoles(
    "administrator",
    "investigation_officer",
    "forensic_analyst",
    "authorized_reviewer"
  ),
  getCaseById
);

// Update case: Investigation Officer
router.put(
  "/:caseId",
  authorizeRoles("investigation_officer"),
  updateCase
);

// Assign case: Investigation Officer or Administrator
router.patch(
  "/:caseId/assign",
  authorizeRoles(
    "investigation_officer",
    "administrator"
  ),
  assignCase
);

export default router;