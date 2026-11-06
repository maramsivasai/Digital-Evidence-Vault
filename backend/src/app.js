import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import notFoundMiddleware from "./middleware/notFoundMiddleware.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

// Allow requests from the React frontend
app.use(cors({
    origin: "http://localhost:5173"
}));

// Parse incoming JSON with a size limit
app.use(express.json({ limit: "1mb" }));

// Basic backend route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Digital Evidence Vault API is running"
    });
});

// Backend and database health check
app.get("/api/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;

    res.status(databaseConnected ? 200 : 503).json({
        success: databaseConnected,
        server: "running",
        database: databaseConnected ? "connected" : "disconnected"
    });
});

// Handle requests to unavailable routes
app.use(notFoundMiddleware);

// Handle application errors
app.use(errorMiddleware);

export default app;