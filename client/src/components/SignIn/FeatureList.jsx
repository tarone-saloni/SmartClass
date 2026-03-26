const FEATURES = [
  { icon: "📚", text: "Manage courses, assignments, and quizzes seamlessly" },
  { icon: "📊", text: "Real-time feedback and progress tracking" },
  { icon: "🔔", text: "Stay informed with alerts and reminders" },
  { icon: "🤝", text: "Built for teachers and students alike" },
];

function FeatureList() {
  return (
    <div className="sc-card-premium glass p-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]/30">
        <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center text-xs">💡</span>
          Why SmartClass?
        </p>
      </div>
      {FEATURES.map((f, i) => (
        <div
          key={f.text}
          className="flex items-center gap-3.5 px-5 py-3.5 border-b border-[var(--border)]/20 last:border-0 
                     hover:bg-[var(--accent)]/6 transition-all duration-300 group cursor-default
                     animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
          style={{ animationDelay: `${200 + i * 80}ms` }}
        >
          <span className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-sm
                         group-hover:bg-[var(--accent)]/20 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
            {f.icon}
          </span>
          <span className="text-sm text-[var(--muted)] group-hover:text-[var(--text)] transition-colors duration-300 font-medium">
            {f.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export default FeatureList;