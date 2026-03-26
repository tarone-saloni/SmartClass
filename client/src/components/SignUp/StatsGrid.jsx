const STATS = [
  { value: "12k+", label: "Active learners", icon: "👨‍🎓" },
  { value: "400+", label: "Courses live", icon: "📖" },
  { value: "98%", label: "Satisfaction", icon: "⭐" },
];

function StatsGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STATS.map(({ value, label, icon }, i) => (
        <div
          key={label}
          className="sc-card-premium glass rounded-xl px-4 py-4 text-center group cursor-default
                     animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
          style={{ animationDelay: `${350 + i * 80}ms` }}
        >
          <div className="text-lg mb-1 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <p className="sc-title text-xl sm:text-2xl font-extrabold gradient-text">{value}</p>
          <p className="text-[10px] text-[var(--muted)] mt-0.5 font-semibold uppercase tracking-wider">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default StatsGrid;