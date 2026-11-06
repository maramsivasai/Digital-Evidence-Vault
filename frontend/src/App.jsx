import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
    const [message, setMessage] = useState("Connecting to backend...");

    useEffect(() => {
        const testConnection = async () => {
            try {
                const response = await api.get("/api/test");

                setMessage(response.data.message);
            } catch (error) {
                console.error("Backend connection failed:", error.message);

                setMessage("Unable to connect to backend");
            }
        };

        testConnection();
    }, []);

    return (
        <div>
            <h1>Digital Evidence Vault</h1>
            <p>{message}</p>
        </div>
    );
}

export default App;