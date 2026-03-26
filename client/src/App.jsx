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
    () => localStorage.getItem("smartclass_theme") || "light",
  );

  useEffect(() => {
    localStorage.setItem("smartclass_theme", themeName);
  }, [themeName]);

  const themeContextValue = useMemo(
    () => ({ themeName, setThemeName, themes }),
    [themeName],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <AuthProvider>
        <ThemeApplier themeName={themeName} />
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[var(--accent)]/15 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
          </div>

          <div className="relative z-10">
            <AppRoutes />
          </div>
        </div>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}

export default App;
