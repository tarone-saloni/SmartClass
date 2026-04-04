function CourseHeader({
  course,
  materials,
  assignments,
  quizzes,
  liveClasses,
  isTeacher,
  matProgress,
}) {
  const stats = [
    {
      icon: "📄",
      val: materials.length,
      label: "Materials",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: "📋",
      val: assignments.length,
      label: "Assignments",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: "🧠",
      val: quizzes.length,
      label: "Quizzes",
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      icon: "📹",
      val: liveClasses.length,
      label: "Live",
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      icon: "👨‍🎓",
      val: course.enrollmentCount ?? 0,
      label: "Students",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] mb-6 overflow-hidden shadow-sm transition-colors duration-300">
      <div className="px-6 py-5">
        {/* Top row: breadcrumb + title */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                Course
              </span>
              {course.subject && (
                <>
                  <span className="text-[var(--muted)] text-xs">›</span>
                  <span className="px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-bold uppercase tracking-wide">
                    {course.subject}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight leading-tight mb-1">
              {course.title}
            </h1>

            {/* Teacher */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm">👨‍🏫</span>
              <span className="text-sm text-[var(--text-secondary)] font-medium">
                {course.teacher?.name}
              </span>
            </div>

            {course.description && (
              <p className="text-sm text-[var(--muted)] leading-relaxed mt-2 max-w-2xl line-clamp-1">
                {course.description}
              </p>
            )}
          </div>

          {/* Subject badge (desktop) */}
          {course.subject && (
            <div className="hidden lg:flex items-center justify-center shrink-0 px-4 py-2 rounded-xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 text-center">
              <div>
                <p className="text-[var(--accent)] font-black text-base tracking-wide">
                  {course.subject}
                </p>
                <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Subject
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] ${s.bg} transition-all duration-200 cursor-default hover:-translate-y-0.5`}
            >
              <span className="text-base">{s.icon}</span>
              <div>
                <p
                  className={`text-sm font-black leading-none tabular-nums ${s.color}`}
                >
                  {s.val}
                </p>
                <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider leading-none mt-0.5">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Student progress bar */}
        {!isTeacher && materials.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-3 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)]">
            <span className="text-lg shrink-0">📊</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-[var(--text-secondary)]">
                  Your Progress
                </p>
                <span className="text-sm font-black text-emerald-500 tabular-nums">
                  {matProgress}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${matProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--muted)] mt-1">
                {matProgress < 100
                  ? "Keep going — you're doing great!"
                  : "🎉 All materials completed!"}
              </p>
            </div>
          </div>
        )}

        {/* Teacher mode badges */}
        {isTeacher && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)]/8 rounded-lg border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold">
              🎓 Teaching Mode
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/8 rounded-lg border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Course
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseHeader;
