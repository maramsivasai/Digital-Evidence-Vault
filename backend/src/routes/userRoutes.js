import express from "express";
import { createUser, getAllUsers, getUserById, updateUserStatus, updateUser } from "../controllers/userController.js";

const router = express.Router();

// Account creation route
router.post("/", createUser);

router.get("/", getAllUsers);

router.get("/:userId", getUserById);

router.put("/:userId", updateUser);

router.patch("/:userId/status", updateUserStatus);

export default router;