import express from "express";
import { createCase } from "../controllers/caseController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create a case (Investigation Officer only)
router.post(
  "/",
  authMiddleware,
  authorizeRoles("investigation_officer"),
  createCase
);

export default router;