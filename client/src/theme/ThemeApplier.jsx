import { useEffect } from "react";

const themeStyles = {
  light: {
    "--bg": "#f1f5f9",
    "--surface": "#ffffff",
    "--surface-elevated": "#ffffff",
    "--surface-hover": "#f8fafc",
    "--text": "#0f172a",
    "--text-secondary": "#334155",
    "--muted": "#64748b",
    "--accent": "#4f46e5",
    "--accent-light": "#6366f1",
    "--accent-contrast": "#ffffff",
    "--border": "#e2e8f0",
    "--border-light": "#f1f5f9",
    "--shadow-color": "220 60% 2%",
    "--glow-color": "239 84% 67%",
    "--success": "#16a34a",
    "--warning": "#d97706",
    "--danger": "#dc2626",
    "--info": "#0284c7",
    className: "light",
  },
  dark: {
    "--bg": "#0f172a",
    "--surface": "#1e293b",
    "--surface-elevated": "#273549",
    "--surface-hover": "#253044",
    "--text": "#f1f5f9",
    "--text-secondary": "#cbd5e1",
    "--muted": "#94a3b8",
    "--accent": "#818cf8",
    "--accent-light": "#a5b4fc",
    "--accent-contrast": "#0f172a",
    "--border": "#334155",
    "--border-light": "#293547",
    "--shadow-color": "222 47% 4%",
    "--glow-color": "239 84% 67%",
    "--success": "#22c55e",
    "--warning": "#f59e0b",
    "--danger": "#f87171",
    "--info": "#38bdf8",
    className: "dark",
  },
};

function ThemeApplier({ themeName }) {
  useEffect(() => {
    const current = themeStyles[themeName] || themeStyles.light;

    // Apply all CSS custom properties to :root
    Object.entries(current).forEach(([key, value]) => {
      if (key.startsWith("--"))
        document.documentElement.style.setProperty(key, value);
    });

    // Toggle dark class for Tailwind dark: utilities
    document.documentElement.classList.remove("light", "dark");
    if (current.className) {
      document.documentElement.classList.add(current.className);
    }

    // Persist selection
    localStorage.setItem("smartclass_theme", themeName);

    // Set mobile browser chrome colour
    const meta =
      document.querySelector('meta[name="theme-color"]') ||
      document.createElement("meta");
    meta.name = "theme-color";
    meta.content = current["--bg"];
    if (!meta.parentNode) document.head.appendChild(meta);
  }, [themeName]);

  return null;
}

export default ThemeApplier;
