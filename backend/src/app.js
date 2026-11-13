import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import authorizeRoles from "./middleware/roleMiddleware.js";
import notFoundMiddleware from "./middleware/notFoundMiddleware.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import caseRoutes from "./routes/caseRoutes.js";

const app = express();

// 1. Middleware for incoming requests
// Parse incoming request data
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Public authentication routes
app.use("/api/auth", authRoutes);

// Protected user-management routes
app.use(
  "/api/users",
  authMiddleware,
  authorizeRoles("administrator"),
  userRoutes
);

// Protected case-management routes
app.use("/api/cases", caseRoutes);

// 2. Basic API route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Digital Evidence Vault API is running"
    });
});

// 3. Database health check
app.get("/api/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;

    res.status(databaseConnected ? 200 : 503).json({
        success: databaseConnected,
        server: "running",
        database: databaseConnected ? "connected" : "disconnected"
    });
});

// 4. Application routes
app.use("/api/auth", authRoutes);

// 5. Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;