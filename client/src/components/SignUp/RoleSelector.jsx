function RoleSelector({ role, setRole }) {
  const roles = [
    { value: "student", icon: "📚", label: "Student", desc: "Learn & grow" },
    { value: "teacher", icon: "🏫", label: "Teacher", desc: "Teach & inspire" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {roles.map(({ value, icon, label, desc }) => (
        <button
          key={value}
          type="button"
          onClick={() => setRole(value)}
          className={`py-4 rounded-xl border text-sm font-semibold flex flex-col items-center gap-1.5 
                     cursor-pointer transition-all duration-300 outline-none active:scale-95 
                     ${role === value
              ? "sc-role-active"
              : "glass border-[var(--border)]/50 text-[var(--muted)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5"
            }`}
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
          <span className="font-bold">{label}</span>
          <span className="text-[10px] opacity-60 font-medium">{desc}</span>
        </button>
      ))}
    </div>
  );
}

export default RoleSelector;