function QuizHeader({ quiz, answered, total }) {
  return (
    <div className="mb-8 animate-[slide-down_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-2xl">🧠</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] sc-title">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-sm text-[var(--muted)] mt-0.5 font-medium">{quiz.description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        <span className="px-3 py-1.5 glass rounded-lg text-xs font-bold text-[var(--text)] border border-[var(--border)]/40">
          📝 {total} questions
        </span>
        <span className="px-3 py-1.5 glass rounded-lg text-xs font-bold text-[var(--accent)] border border-[var(--accent)]/20">
          ✅ {answered} answered
        </span>
        {quiz.timeLimit > 0 && (
          <span className="px-3 py-1.5 glass rounded-lg text-xs font-bold text-amber-500 border border-amber-500/20">
            ⏱️ {quiz.timeLimit} min
          </span>
        )}
      </div>
    </div>
  );
}

export default QuizHeader;