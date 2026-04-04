const AVATAR_COLORS = [
  "from-violet-500/35 to-purple-500/15 text-violet-300 border-violet-500/18",
  "from-blue-500/35 to-indigo-500/15 text-blue-300 border-blue-500/18",
  "from-emerald-500/35 to-teal-500/15 text-emerald-300 border-emerald-500/18",
  "from-pink-500/35 to-rose-500/15 text-pink-300 border-pink-500/18",
  "from-amber-500/35 to-orange-500/15 text-amber-300 border-amber-500/18",
  "from-cyan-500/35 to-sky-500/15 text-cyan-300 border-cyan-500/18",
];

function StudentsTab({ students }) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/15 flex items-center justify-center text-lg">
            👨‍🎓
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)] leading-tight">
              Enrolled Students
            </h2>
            <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
              {students.length} total enrolled
            </p>
          </div>
        </div>
        <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-black border border-emerald-500/18 tabular-nums">
          {students.length} {students.length === 1 ? "student" : "students"}
        </span>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <div
            className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-3xl mx-auto mb-5
                          shadow-[0_8px_24px_-8px_rgba(16,185,129,0.15)]"
          >
            👨‍🎓
          </div>
          <p className="text-lg font-bold text-[var(--text)] mb-2">
            No students enrolled yet
          </p>
          <p className="text-sm text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
            Students will appear here once they enroll in this course.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {students.map((s, i) => {
              const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div
                  key={s.id}
                  className="group bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--accent)]/40
                             flex items-center gap-3.5 transition-all duration-300
                             hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)]
                             animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Avatar */}
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${colorClass} border
                                   flex items-center justify-center text-sm font-black shrink-0
                                   group-hover:scale-110 transition-all duration-400
                                   shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]`}
                  >
                    {s.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[var(--text)] truncate leading-snug">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-[var(--muted)] truncate font-medium mt-0.5">
                      {s.email}
                    </p>
                  </div>

                  {/* Enrolled check */}
                  <div
                    className="w-8 h-8 rounded-xl bg-emerald-500/8 border border-emerald-500/12 flex items-center justify-center shrink-0
                                  opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-100 scale-75"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="text-emerald-400"
                    >
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer info */}
          <div className="mt-5 px-4 py-3 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] flex items-center gap-2.5">
            <span className="text-[12px] text-[var(--muted)] font-medium">
              💡 {students.length} student{students.length !== 1 ? "s" : ""}{" "}
              enrolled in this course
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default StudentsTab;
