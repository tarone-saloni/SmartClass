import { createContext, useContext, useState, useCallback } from "react";
import { apiFetch } from "../utils/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          import.meta.env.VITE_STORAGE_USER_KEY || "smartclass_user",
        ),
      );
    } catch {
      return null;
    }
  });

  const login = useCallback((userData) => {
    localStorage.setItem(
      import.meta.env.VITE_STORAGE_USER_KEY || "smartclass_user",
      JSON.stringify(userData),
    );
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    localStorage.removeItem(
      import.meta.env.VITE_STORAGE_USER_KEY || "smartclass_user",
    );
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
