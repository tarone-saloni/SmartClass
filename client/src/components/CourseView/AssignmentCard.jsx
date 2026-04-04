const scorePct = (score, max) => Math.round((score / max) * 100);
const scoreColor = (pct) =>
  pct >= 70
    ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/20"
    : pct >= 40
      ? "bg-amber-500/12 text-amber-400 border-amber-500/20"
      : "bg-red-500/12 text-red-400 border-red-500/20";

function AssignmentCard({
  assignment,
  isTeacher,
  mySubmission,
  submissions,
  submissionText,
  isLocked,
  lockedByTitle,
  lockedByOrder,
  onSubmit,
  onToggleSubs,
  onDelete,
  onGrade,
}) {
  const isOverdue =
    assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const hasSubmission = !!mySubmission;
  const isGraded = mySubmission?.status === "graded";

  const statusConfig = isLocked
    ? {
        bar: "from-slate-500 to-slate-600",
        iconBg: "bg-slate-500/12 border-slate-500/18",
        icon: "🔒",
      }
    : isOverdue && !hasSubmission
      ? {
          bar: "from-red-500 to-red-600",
          iconBg: "bg-red-500/12 border-red-500/18",
          icon: "⚠️",
        }
      : hasSubmission
        ? {
            bar: "from-emerald-500 to-teal-500",
            iconBg: "bg-emerald-500/12 border-emerald-500/18",
            icon: "✅",
          }
        : {
            bar: "from-amber-500 to-orange-500",
            iconBg: "bg-amber-500/12 border-amber-500/18",
            icon: "📋",
          };

  return (
    <div
      className={`group bg-[var(--surface)] rounded-2xl border transition-all duration-300 overflow-hidden
                    ${
                      isLocked
                        ? "border-[var(--border)]/40 opacity-70"
                        : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)]"
                    }`}
    >
      {/* Sequential order indicator */}
      <div
        className={`h-0.5 w-full bg-gradient-to-r ${statusConfig.bar} opacity-60`}
      />

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Status icon */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border
                             ${statusConfig.iconBg} ${!isLocked ? "group-hover:scale-105 transition-transform duration-300" : ""}`}
            >
              {statusConfig.icon}
            </div>
            {/* Order badge */}
            <span className="text-[9px] font-black text-[var(--muted)] bg-[var(--border)]/15 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              #{assignment.order ?? "—"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Title + actions */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <h4 className="text-[15px] font-bold text-[var(--text)] leading-snug">
                {assignment.title}
              </h4>
              <div className="flex items-center gap-2 shrink-0">
                {isTeacher ? (
                  <>
                    <button
                      onClick={() => onToggleSubs(assignment.id)}
                      className="px-4 py-2 bg-[var(--accent)]/8 hover:bg-[var(--accent)]/15 text-[var(--accent)] rounded-xl text-xs font-bold
                                 border border-[var(--accent)]/12 cursor-pointer transition-all duration-300 active:scale-95"
                    >
                      {submissions !== undefined ? "Hide" : "Submissions"}
                    </button>
                    <button
                      onClick={() => onDelete(assignment.id)}
                      className="px-4 py-2 bg-red-500/6 hover:bg-red-500/14 text-red-400 rounded-xl text-xs font-bold
                                 border border-red-500/15 cursor-pointer transition-all duration-300 active:scale-95"
                    >
                      Delete
                    </button>
                  </>
                ) : isLocked ? (
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-500/10 text-slate-400 rounded-xl text-xs font-bold border border-slate-500/18">
                    🔒 Locked
                  </span>
                ) : isGraded ? (
                  <span
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black border ${scoreColor(scorePct(mySubmission.score, assignment.maxScore))}`}
                  >
                    {mySubmission.score}/{assignment.maxScore} pts
                  </span>
                ) : hasSubmission ? (
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/18">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                    Submitted
                  </span>
                ) : null}
              </div>
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {assignment.dueDate && (
                <span
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border
                  ${
                    isOverdue
                      ? "bg-red-500/10 text-red-400 border-red-500/18"
                      : "bg-[var(--border)]/10 text-[var(--muted)] border-[var(--border)]/15"
                  }`}
                >
                  {isOverdue ? "⚠ Overdue" : "📅"}{" "}
                  {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[var(--border)]/8 text-[var(--muted)] border border-[var(--border)]/15">
                ⭐ {assignment.maxScore} pts max
              </span>
            </div>

            {/* Description */}
            {assignment.description && (
              <p className="text-[13px] text-[var(--muted)] leading-relaxed line-clamp-2">
                {assignment.description}
              </p>
            )}
          </div>
        </div>

        {/* Locked notice for student */}
        {!isTeacher && isLocked && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]/10">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-500/6 border border-slate-500/15">
              <span className="text-xl">🔒</span>
              <div>
                <p className="text-[13px] font-bold text-[var(--text)]">
                  Complete Assignment #{lockedByOrder} first
                </p>
                <p className="text-[12px] text-[var(--muted)] mt-0.5">
                  Submit "{lockedByTitle}" before you can work on this
                  assignment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Student: submission form */}
        {!isTeacher && !hasSubmission && !isLocked && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <p className="text-[11px] font-bold text-[var(--muted)] mb-2.5 uppercase tracking-[0.12em]">
              Your Answer
            </p>
            <textarea
              className="w-full px-4 py-3.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl text-sm outline-none
                         resize-y focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/12
                         transition-all duration-300 text-[var(--text)] placeholder:text-[var(--muted)] min-h-[100px] font-medium"
              placeholder="Write your answer here..."
              value={submissionText || ""}
              onChange={(e) => onSubmit(assignment.id, e.target.value, true)}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => onSubmit(assignment.id, submissionText, false)}
                disabled={!submissionText?.trim()}
                className="px-6 py-2.5 sc-btn-glow disabled:opacity-35 rounded-xl text-xs font-bold cursor-pointer disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Submit Answer →
              </button>
            </div>
          </div>
        )}

        {/* Student: submitted view */}
        {!isTeacher && hasSubmission && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]/10">
            <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-[0.12em] mb-2.5">
              Your Submission
            </p>
            <div className="glass rounded-2xl px-5 py-4 border border-[var(--border)]/12">
              <p className="text-sm text-[var(--text)] leading-relaxed">
                {mySubmission.content}
              </p>
              {mySubmission.feedback && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]/12">
                  <p className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1.5">
                    <span>💬</span> Teacher Feedback
                  </p>
                  <p className="text-sm text-[var(--text)]/80 leading-relaxed italic">
                    "{mySubmission.feedback}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teacher: submissions list */}
        {isTeacher && submissions !== undefined && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]/10">
            <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-[0.12em] mb-3">
              Student Submissions ({submissions.length})
            </p>
            {submissions.length === 0 ? (
              <p className="text-[13px] text-[var(--muted)] text-center py-6 glass rounded-2xl border border-[var(--border)]/10">
                No submissions yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {submissions.map((s) => {
                  const pct =
                    s.status === "graded"
                      ? scorePct(s.score, assignment.maxScore)
                      : null;
                  return (
                    <div
                      key={s.id}
                      className="glass rounded-2xl px-5 py-4 border border-[var(--border)]/12 hover:border-[var(--border)]/25 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/12 flex items-center justify-center text-xs font-black text-[var(--accent)]">
                            {s.student?.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-[var(--text)]">
                              {s.student?.name}
                            </p>
                            <p className="text-[11px] text-[var(--muted)]">
                              {new Date(s.submittedAt).toLocaleString()}
                              {s.status === "late" && (
                                <span className="ml-2 text-red-400 font-bold">
                                  ⏰ Late
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pct !== null && (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${scoreColor(pct)}`}
                            >
                              {s.score}/{assignment.maxScore}
                            </span>
                          )}
                          <button
                            onClick={() => onGrade(s.id, s.score, s.feedback)}
                            className="px-3.5 py-1.5 bg-[var(--accent)]/8 hover:bg-[var(--accent)]/15 text-[var(--accent)] rounded-xl text-[11px] font-bold border border-[var(--accent)]/12 cursor-pointer transition-all duration-300"
                          >
                            {pct !== null ? "Re-grade" : "Grade"}
                          </button>
                        </div>
                      </div>
                      <p className="text-[13px] text-[var(--text)] leading-relaxed pl-[42px]">
                        {s.content}
                      </p>
                      {s.feedback && (
                        <p className="text-[11px] text-[var(--muted)] mt-1.5 pl-[42px] italic">
                          "{s.feedback}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignmentCard;
