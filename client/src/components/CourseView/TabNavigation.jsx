const TAB_ICONS = {
  materials: "📄",
  assignments: "📋",
  quizzes: "🧠",
  "live-classes": "📹",
  students: "👨‍🎓",
};

function TabNavigation({ tabs, tab, setTab, tabCount, tabLabel }) {
  return (
    <div className="flex gap-1 p-1 glass rounded-xl border border-[var(--border)]/40 mb-8 overflow-x-auto
                    animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
      style={{ animationDelay: "100ms" }}>
      {tabs.map(t => (
        <button key={t} onClick={() => setTab(t)}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 capitalize 
                     bg-transparent border-none cursor-pointer whitespace-nowrap flex items-center gap-2
                     active:scale-95 ${tab === t
              ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_16px_-4px_var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]/8"
            }`}>
          <span className="text-sm">{TAB_ICONS[t] || "📁"}</span>
          <span>{tabLabel[t] || t}</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold min-w-[20px] text-center ${tab === t
              ? "bg-white/20 text-white"
              : "bg-[var(--border)]/50 text-[var(--muted)]"
            }`}>
            {tabCount[t]}
          </span>
        </button>
      ))}
    </div>
  );
}

export default TabNavigation;