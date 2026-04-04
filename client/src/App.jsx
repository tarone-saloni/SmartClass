import { BrowserRouter } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ThemeContext, themes } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import PublicRoutes from "./routes/PublicRoutes";
import ThemeApplier from "./theme/ThemeApplier";

function AppRoutes() {
  const { user } = useAuth();
  return (
    <BrowserRouter>
      {user ? <ProtectedRoutes /> : <PublicRoutes />}
    </BrowserRouter>
  );
}

function App() {
  const [themeName, setThemeName] = useState(
    () =>
      localStorage.getItem(
        import.meta.env.VITE_STORAGE_THEME_KEY || "smartclass_theme",
      ) || "light",
  );

  useEffect(() => {
    localStorage.setItem(
      import.meta.env.VITE_STORAGE_THEME_KEY || "smartclass_theme",
      themeName,
    );
  }, [themeName]);

  const themeContextValue = useMemo(
    () => ({ themeName, setThemeName, themes }),
    [themeName],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <AuthProvider>
        <ThemeApplier themeName={themeName} />
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
          <AppRoutes />
        </div>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}

export default App;
