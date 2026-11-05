import "dotenv/config";
import app from "./app.js";
import connectDB  from "./config/db.js";

const PORT = process.env.PORT || 5000;
const HOST = "localhost";

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT,HOST, () => {
            console.log(`Server running on http://${HOST}:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();