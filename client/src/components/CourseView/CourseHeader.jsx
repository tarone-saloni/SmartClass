function CourseHeader({ course, materials, assignments, quizzes, liveClasses, isTeacher, matProgress }) {
  const stats = [
    { icon: "📄", val: materials.length, label: "Materials" },
    { icon: "📋", val: assignments.length, label: "Assignments" },
    { icon: "🧠", val: quizzes.length, label: "Quizzes" },
    { icon: "📹", val: liveClasses.length, label: "Live" },
    { icon: "👨‍🎓", val: course.enrollmentCount, label: "Students" },
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 animate-[slide-down_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] via-[color-mix(in_srgb,var(--accent)_80%,#7c3aed)] to-[color-mix(in_srgb,var(--accent)_60%,#ec4899)]" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="relative p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">{course.title}</h1>
            <p className="text-sm text-white/75 mb-1 font-medium flex items-center gap-1.5">
              👨‍🏫 {course.teacher?.name}
            </p>
            {course.description && (
              <p className="text-sm text-white/60 leading-relaxed mt-2 max-w-xl">{course.description}</p>
            )}
          </div>
          {course.subject && (
            <span className="px-4 py-2 bg-white/15 rounded-xl text-sm font-bold whitespace-nowrap text-white
                             border border-white/15 backdrop-blur-sm">
              {course.subject}
            </span>
          )}
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2 mt-5">
          {stats.map((s) => (
            <div key={s.label} className="px-3.5 py-2 bg-white/12 rounded-xl text-xs font-semibold text-white/85
                                          border border-white/8 backdrop-blur-sm flex items-center gap-1.5
                                          hover:bg-white/18 transition-all duration-300">
              <span>{s.icon}</span>
              <span className="font-bold text-white">{s.val}</span>
              <span className="opacity-70">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar for students */}
        {!isTeacher && materials.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-semibold text-white/80 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Course Progress
              </span>
              <span className="text-white font-bold">{matProgress}%</span>
            </div>
            <div className="h-2.5 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out
                           shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                style={{ width: `${matProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseHeader;