import { themes } from '../context/ThemeContext';

function ThemeSelector({ themeName, setThemeName }) {
  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg text-sm text-[var(--text)]">
      <span className="text-[var(--muted)]">Theme</span>
      <select
        value={themeName}
        onChange={e => setThemeName(e.target.value)}
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[var(--text)] focus:outline-none"
      >
        {Object.keys(themes).map(key => (
          <option key={key} value={key}>{key}</option>
        ))}
      </select>
    </div>
  );
}

export default ThemeSelector;