import express from "express";

import { getAuditLogs } from "../controllers/auditController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Audit viewing: Authorized Reviewer and Administrator.
router.get(
  "/",
  authorizeRoles("authorized_reviewer", "administrator"),
  getAuditLogs
);

export default router;