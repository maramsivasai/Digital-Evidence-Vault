import { useEffect, useState } from "react";
import AuthContext from "./AuthContextValue";
import api from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the user's session when the application starts.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem("token");
        }
      } catch {
        // Remove an invalid or expired token.
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Authenticate the user and store the returned JWT.
  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    if (!response.data.success || !response.data.token) {
      throw new Error(response.data.message || "Login failed");
    }

    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);

    return response.data.user;
  };

  // Clear the session and log the user out.
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}