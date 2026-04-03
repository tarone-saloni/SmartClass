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
      gradient: "from-emerald-500 to-teal-500",
      bgGlow: "bg-emerald-500/10",
    },
    {
      icon: "📋",
      val: assignments.length,
      label: "Assignments",
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
    },
    {
      icon: "🧠",
      val: quizzes.length,
      label: "Quizzes",
      gradient: "from-pink-500 to-rose-600",
      bgGlow: "bg-pink-500/10",
    },
    {
      icon: "📹",
      val: liveClasses.length,
      label: "Live",
      gradient: "from-red-500 to-red-700",
      bgGlow: "bg-red-500/10",
    },
    {
      icon: "👨‍🎓",
      val: course.enrollmentCount ?? 0,
      label: "Students",
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="relative rounded-[2rem] overflow-hidden mb-8 animate-[slide-down_0.6s_cubic-bezier(0.16,1,0.3,1)_both] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)]">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] via-violet-600 to-fuchsia-600" />

      {/* Animated mesh overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(236,72,153,0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 60%)
          `,
        }}
      />

      {/* Floating orbs */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/8 blur-3xl animate-float pointer-events-none" />
      <div
        className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-pink-400/15 blur-3xl animate-float pointer-events-none"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/3 right-1/3 w-32 h-32 rounded-full bg-violet-300/10 blur-2xl animate-float pointer-events-none"
        style={{ animationDelay: "4s" }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative px-8 py-9 sm:px-10 sm:py-10">
        {/* Top: breadcrumb + subject badge */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-base ring-1 ring-white/10">
                📚
              </div>
              <span className="text-white/60 text-[11px] font-bold uppercase tracking-[0.15em]">
                Course
              </span>
              {course.subject && (
                <>
                  <span className="text-white/25 text-xs">›</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white/80 text-[11px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm ring-1 ring-white/10">
                    {course.subject}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-[2.5rem] font-black text-white mb-3 tracking-[-0.03em] leading-[1.1] drop-shadow-lg">
              {course.title}
            </h1>

            {/* Teacher name */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-xs ring-1 ring-white/10">
                👨‍🏫
              </div>
              <span className="text-white/75 text-sm font-semibold">
                {course.teacher?.name}
              </span>
            </div>

            {course.description && (
              <p className="text-sm text-white/50 leading-relaxed mt-3.5 max-w-2xl line-clamp-2 font-medium">
                {course.description}
              </p>
            )}
          </div>

          {/* Subject badge (desktop) */}
          {course.subject && (
            <div className="shrink-0 hidden lg:block">
              <div className="px-6 py-4 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-md text-center ring-1 ring-white/5">
                <p className="text-white font-black text-lg tracking-wide mb-0.5">
                  {course.subject}
                </p>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.15em]">
                  Subject
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group flex items-center gap-3 px-4 py-3 bg-white/8 hover:bg-white/14 rounded-2xl
                         border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 cursor-default
                         hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]"
            >
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-sm
                              shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-white font-black text-lg leading-none tabular-nums">
                  {s.val}
                </p>
                <p className="text-white/50 text-[9px] font-bold uppercase tracking-[0.15em] leading-none mt-1">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Student progress bar */}
        {!isTeacher && materials.length > 0 && (
          <div className="bg-white/8 rounded-2xl px-5 py-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-bold text-white/80 mb-3">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="uppercase tracking-[0.1em] text-[11px]">
                  Your Progress
                </span>
              </span>
              <span className="text-white font-black text-base tabular-nums">
                {matProgress}%
              </span>
            </div>
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/80 to-white rounded-full
                           transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                style={{ width: `${matProgress}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_2.5s_infinite]" />
            </div>
            <p className="text-white/40 text-[11px] font-medium mt-2">
              {matProgress < 100
                ? "Keep going — you're doing great!"
                : "🎉 All materials completed!"}
            </p>
          </div>
        )}

        {/* Teacher badges */}
        {isTeacher && (
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/12 text-white/80 text-xs font-bold backdrop-blur-sm">
              <span>🎓</span> Teaching Mode
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/12 text-white/80 text-xs font-bold backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              Active Course
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseHeader;
