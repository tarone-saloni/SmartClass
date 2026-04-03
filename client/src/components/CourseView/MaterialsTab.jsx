import MaterialCard from "./MaterialCard";

function MaterialsTab({
  materials,
  isTeacher,
  completedMats,
  onToggleComplete,
  onDelete,
  onAddClick,
}) {
  const doneCount = completedMats?.size ?? 0;
  const pct = materials.length
    ? Math.round((doneCount / materials.length) * 100)
    : 0;

  return (
    <div>
      {/* Section header + Add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border border-emerald-500/15 flex items-center justify-center text-lg">
            📄
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)] leading-tight">
              Course Materials
            </h2>
            <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
              {materials.length} {materials.length === 1 ? "item" : "items"}{" "}
              available
            </p>
          </div>
        </div>
        {isTeacher && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-2.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95
                       shadow-[0_8px_24px_-8px_var(--accent)]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
            </svg>
            Add Material
          </button>
        )}
      </div>

      {/* Student progress bar */}
      {!isTeacher && materials.length > 0 && (
        <div
          className="flex items-center gap-4 mb-6 px-5 py-4 glass-heavy rounded-2xl border border-[var(--border)]/12
                        shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/12 border border-emerald-500/15 flex items-center justify-center text-lg shrink-0">
            📊
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[13px] font-bold text-[var(--text)]">
                {doneCount} of {materials.length} completed
              </p>
              <span className="text-sm font-black text-emerald-400 tabular-nums">
                {pct}%
              </span>
            </div>
            <div className="h-2 bg-[var(--border)]/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out
                           shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Material list or empty state */}
      {materials.length === 0 ? (
        <div
          className="text-center py-20 glass-heavy rounded-3xl border border-[var(--border)]/10
                        shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]"
        >
          <div
            className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-3xl mx-auto mb-5
                          shadow-[0_8px_24px_-8px_rgba(16,185,129,0.15)]"
          >
            📄
          </div>
          <p className="text-lg font-bold text-[var(--text)] mb-2">
            No materials yet
          </p>
          <p className="text-sm text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
            {isTeacher
              ? "Add your first material to get started."
              : "Your teacher hasn't added materials yet."}
          </p>
          {isTeacher && (
            <button
              onClick={onAddClick}
              className="mt-6 px-6 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
            >
              + Add First Material
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m, i) => (
            <div
              key={m.id}
              className="animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <MaterialCard
                material={m}
                isTeacher={isTeacher}
                isDone={completedMats.has(m.id)}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MaterialsTab;
