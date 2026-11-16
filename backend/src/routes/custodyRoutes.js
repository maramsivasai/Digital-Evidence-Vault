import express from "express";

import {
  recordCustody,
  getCustodyHistory,
  getCaseCustodyHistory
} from "../controllers/custodyController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Record custody: Forensic Analyst only.
router.post(
  "/",
  authorizeRoles("forensic_analyst"),
  recordCustody
);

// View evidence custody history.
router.get(
  "/:evidenceId",
  authorizeRoles("forensic_analyst", "authorized_reviewer"),
  getCustodyHistory
);

// View custody history associated with a case.
router.get(
  "/case/:caseId",
  authorizeRoles("forensic_analyst", "authorized_reviewer"),
  getCaseCustodyHistory
);

export default router;