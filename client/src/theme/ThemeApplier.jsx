import { useEffect } from "react";

export const themeStyles = {
  light: {
    "--bg": "#f8f9fc",
    "--surface": "#ffffff",
    "--surface-elevated": "#ffffff",
    "--text": "#0f172a",
    "--text-secondary": "#334155",
    "--muted": "#64748b",
    "--accent": "#6366f1",
    "--accent-light": "#818cf8",
    "--accent-contrast": "#ffffff",
    "--border": "#e2e8f0",
    "--border-light": "#f1f5f9",
    "--shadow-color": "220 60% 2%",
    "--glow-color": "239 84% 67%",
    className: "",
  },
  dark: {
    "--bg": "#030712",
    "--surface": "#0f1729",
    "--surface-elevated": "#1a2340",
    "--text": "#f1f5f9",
    "--text-secondary": "#cbd5e1",
    "--muted": "#94a3b8",
    "--accent": "#818cf8",
    "--accent-light": "#a5b4fc",
    "--accent-contrast": "#0f172a",
    "--border": "#1e293b",
    "--border-light": "#1e293b",
    "--shadow-color": "222 47% 4%",
    "--glow-color": "239 84% 67%",
    className: "dark",
  },
  custom: {
    "--bg": "#0c0a1a",
    "--surface": "#150f2d",
    "--surface-elevated": "#1e1745",
    "--text": "#e0e7ff",
    "--text-secondary": "#c7d2fe",
    "--muted": "#8b8d9e",
    "--accent": "#a78bfa",
    "--accent-light": "#c4b5fd",
    "--accent-contrast": "#0c0a1a",
    "--border": "#2e2654",
    "--border-light": "#2e2654",
    "--shadow-color": "260 50% 4%",
    "--glow-color": "263 70% 70%",
    className: "custom-theme",
  },
};

function ThemeApplier({ themeName }) {
  useEffect(() => {
    const current = themeStyles[themeName] || themeStyles.light;
    Object.entries(current).forEach(([key, value]) => {
      if (key.startsWith("--"))
        document.documentElement.style.setProperty(key, value);
    });
    document.documentElement.classList.remove("dark", "custom-theme");
    if (current.className)
      document.documentElement.classList.add(current.className);
    localStorage.setItem("smartclass_theme", themeName);

    // Set meta theme-color for mobile browsers
    const meta = document.querySelector('meta[name="theme-color"]') || document.createElement("meta");
    meta.name = "theme-color";
    meta.content = current["--bg"];
    if (!meta.parentNode) document.head.appendChild(meta);
  }, [themeName]);

  return null;
}

export default ThemeApplier;
