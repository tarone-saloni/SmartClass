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
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-500 relative overflow-hidden">
          {/* Animated morphing background orbs */}
          <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />
            <div className="bg-orb bg-orb-3" />
          </div>

          {/* Subtle noise texture overlay */}
          <div
            className="pointer-events-none fixed inset-0 -z-10 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative z-10">
            <AppRoutes />
          </div>
        </div>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}

export default App;
