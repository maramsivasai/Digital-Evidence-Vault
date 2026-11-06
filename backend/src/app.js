import express from "express";
import cors from "cors";

const app = express();

// Allow requests from the React frontend
app.use(cors({
    origin: "http://localhost:5173"
}));

// Parse incoming JSON data
app.use(express.json());

// Basic backend route
app.get("/", (req, res) => {
    res.send("Digital Evidence Vault API is running");
});

// Frontend-backend communication test
app.get("/api/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Frontend and backend communication successful"
    });
});

export default app;