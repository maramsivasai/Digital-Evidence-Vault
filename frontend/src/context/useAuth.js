import { useContext } from "react";
import AuthContext from "./AuthContextValue";

// Provides access to the authenticated user's information and actions.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}