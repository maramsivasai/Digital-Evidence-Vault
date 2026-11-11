
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import notFoundMiddleware from "./middleware/notFoundMiddleware.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

// 1. Middleware for incoming requests
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

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