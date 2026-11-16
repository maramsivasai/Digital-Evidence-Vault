import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

import {
  generateCaseReport,
  generateEvidenceReport,
  generateCustodyReport,
  generateAuditReport
} from "../controllers/reportController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("authorized_reviewer"));

// 5.1 Generate Case Report
router.get("/cases/:caseId", generateCaseReport);

// 5.2 Generate Evidence Report
router.get("/evidence/:evidenceId", generateEvidenceReport);

// 5.3 Generate Custody Report
router.get("/custody", generateCustodyReport);

// 5.4 Generate Audit Report
router.get("/audit", generateAuditReport);

export default router;