import AssignmentCard from "./AssignmentCard";

function AssignmentsTab({
  assignments,
  isTeacher,
  mySubmissions,
  expandedSubs,
  submissionText,
  onSubmit,
  onToggleSubs,
  onDelete,
  onGrade,
  onAddClick,
}) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/15 flex items-center justify-center text-lg">
            📋
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)] leading-tight">
              Assignments
            </h2>
            <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
              {assignments.length}{" "}
              {assignments.length === 1 ? "assignment" : "assignments"} posted
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
            Add Assignment
          </button>
        )}
      </div>

      {assignments.length === 0 ? (
        <div
          className="text-center py-20 glass-heavy rounded-3xl border border-[var(--border)]/10
                        shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]"
        >
          <div
            className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-3xl mx-auto mb-5
                          shadow-[0_8px_24px_-8px_rgba(245,158,11,0.15)]"
          >
            📋
          </div>
          <p className="text-lg font-bold text-[var(--text)] mb-2">
            No assignments yet
          </p>
          <p className="text-sm text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
            {isTeacher
              ? "Create your first assignment for students."
              : "No assignments have been posted yet."}
          </p>
          {isTeacher && (
            <button
              onClick={onAddClick}
              className="mt-6 px-6 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
            >
              + Create Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a, i) => (
            <div
              key={a.id}
              className="animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <AssignmentCard
                assignment={a}
                isTeacher={isTeacher}
                mySubmission={mySubmissions[a.id]}
                submissions={expandedSubs[a.id]}
                submissionText={submissionText[a.id]}
                onSubmit={(aid, text, isUpdate) =>
                  isUpdate ? onSubmit(aid, text) : onSubmit(aid, text, false)
                }
                onToggleSubs={onToggleSubs}
                onDelete={onDelete}
                onGrade={onGrade}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssignmentsTab;
