import { useNavigate } from "react-router-dom";

function QuizzesTab({ quizzes, isTeacher, onDelete, onAddClick }) {
  const navigate = useNavigate();

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/15 flex items-center justify-center text-lg">
            🧠
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)] leading-tight">
              Quizzes
            </h2>
            <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
              {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}{" "}
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
            Create Quiz
          </button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div
          className="text-center py-20 glass-heavy rounded-3xl border border-[var(--border)]/10
                        shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]"
        >
          <div
            className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/15 flex items-center justify-center text-3xl mx-auto mb-5
                          shadow-[0_8px_24px_-8px_rgba(236,72,153,0.15)]"
          >
            🧠
          </div>
          <p className="text-lg font-bold text-[var(--text)] mb-2">
            No quizzes yet
          </p>
          <p className="text-sm text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
            {isTeacher
              ? "Create a quiz to test your students."
              : "No quizzes have been posted yet."}
          </p>
          {isTeacher && (
            <button
              onClick={onAddClick}
              className="mt-6 px-6 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
            >
              + Create Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((q, i) => (
            <div
              key={q.id}
              className="group glass-heavy rounded-2xl border border-[var(--border)]/12 hover:border-[var(--accent)]/20
                         overflow-hidden transition-all duration-400 animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]
                         hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Quiz accent bar */}
              <div className="h-[2px] w-full bg-gradient-to-r from-pink-500 to-rose-500" />

              <div className="p-5 sm:p-6 flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/18 to-rose-500/8 border border-pink-500/18
                                flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-all duration-400"
                >
                  🧠
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-bold text-[var(--text)] mb-1 leading-snug">
                        {q.title}
                      </h4>
                      {q.description && (
                        <p className="text-[13px] text-[var(--muted)] leading-relaxed line-clamp-2">
                          {q.description}
                        </p>
                      )}
                    </div>
                    {!q.isActive && (
                      <span className="shrink-0 px-3 py-1 rounded-xl text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/18 uppercase tracking-[0.1em]">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Stats pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-pink-500/8 text-pink-400 border border-pink-500/12">
                      ❓ {q.questionCount} questions
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/8 text-amber-400 border border-amber-500/12">
                      ⭐ {q.totalPoints} pts
                    </span>
                    {q.timeLimit > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/8 text-emerald-300 border border-emerald-500/12">
                        ⏱ {q.timeLimit} min
                      </span>
                    )}
                    {q.dueDate && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[var(--border)]/8 text-[var(--muted)] border border-[var(--border)]/15">
                        📅 Due{" "}
                        {new Date(q.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5">
                    {!isTeacher && (
                      <button
                        onClick={() => navigate(`/quiz/${q.id}`)}
                        className="flex items-center gap-2 px-5 py-2.5 sc-btn-glow rounded-xl text-xs font-bold cursor-pointer active:scale-95"
                      >
                        Take Quiz
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z" />
                        </svg>
                      </button>
                    )}
                    {isTeacher && (
                      <>
                        <button
                          onClick={() => navigate(`/quiz/${q.id}/results`)}
                          className="px-5 py-2.5 bg-[var(--accent)]/8 hover:bg-[var(--accent)]/14 text-[var(--accent)] rounded-xl text-xs font-bold border border-[var(--accent)]/12 cursor-pointer transition-all duration-300 active:scale-95"
                        >
                          View Results
                        </button>
                        <button
                          onClick={() => onDelete(q.id)}
                          className="px-5 py-2.5 bg-red-500/6 hover:bg-red-500/14 text-red-400 rounded-xl text-xs font-bold border border-red-500/15 cursor-pointer transition-all duration-300 active:scale-95"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuizzesTab;
