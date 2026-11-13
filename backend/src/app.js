import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import evidenceRoutes from "./routes/evidenceRoutes.js";

import authMiddleware from "./middleware/authMiddleware.js";
import authorizeRoles from "./middleware/roleMiddleware.js";

import notFoundMiddleware from "./middleware/notFoundMiddleware.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

// 1. General middleware
app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// 2. Public authentication routes
app.use("/api/auth", authRoutes);

// 3. Protected user-management routes
app.use(
  "/api/users",
  authMiddleware,
  authorizeRoles("administrator"),
  userRoutes
);

// 4. Case-management routes
// Authentication and role authorization are handled inside caseRoutes.js
app.use("/api/cases", caseRoutes);

// Evidence routes
app.use("/api/evidence", evidenceRoutes);

// 5. Root API route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Digital Evidence Vault API is running"
  });
});

// 6. Database health check
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    server: "running",
    database: databaseConnected ? "connected" : "disconnected"
  });
});

// 7. Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;