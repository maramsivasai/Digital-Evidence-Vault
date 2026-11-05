import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;
const HOST = "localhost";

app.listen(PORT, () => {
    console.log(`Server running on: http://${HOST}:${PORT}/`);
});