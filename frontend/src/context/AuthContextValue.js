import { createContext } from "react";

// Shared context used by AuthProvider and the useAuth hook.
const AuthContext = createContext(null);

export default AuthContext;