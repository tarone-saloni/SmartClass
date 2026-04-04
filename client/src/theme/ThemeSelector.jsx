import { themes } from "../context/ThemeContext";

const THEME_META = {
  [themes.light]: { label: "Light", icon: "☀️" },
  [themes.dark]: { label: "Dark", icon: "🌙" },
};

function ThemeSelector({ themeName, setThemeName }) {
  return (
    <div className="fixed right-3 top-3 z-50 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-2">
        {Object.keys(themes).map((key) => {
          const active = themeName === key;
          return (
            <button
              key={key}
              onClick={() => setThemeName(key)}
              className={`group relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_8px_20px_-10px_var(--accent)] scale-105"
                  : "bg-[var(--surface-elevated)] text-[var(--muted)] hover:text-[var(--text)] hover:-translate-y-0.5"
              }`}
              type="button"
              title={THEME_META[key]?.label || key}
            >
              <span className="text-sm leading-none">
                {THEME_META[key]?.icon || "🎨"}
              </span>
              <span>{THEME_META[key]?.label || key}</span>
              {active && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent-contrast)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemeSelector;
