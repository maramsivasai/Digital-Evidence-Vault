import express from "express";
import { loginUser } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route: user login
router.post("/login", loginUser);

// Protected route: get current logged-in user
router.get("/me", authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

export default router;