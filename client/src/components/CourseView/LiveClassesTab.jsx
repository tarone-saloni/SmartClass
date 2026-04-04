import LiveClassCard from "./LiveClassCard";

function SectionLabel({ dot, label, count }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <h3 className="font-medium text-sm">
        {label}
        <span className="text-[var(--muted)] ml-2">({count})</span>
      </h3>
    </div>
  );
}

function LiveClassesTab({
  liveClasses,
  isTeacher,
  onStatusChange,
  onDelete,
  onJoin,
  onAddClick,
}) {
  const liveNow = liveClasses.filter((lc) => lc.status === "live");
  const upcoming = liveClasses.filter((lc) => lc.status === "scheduled");
  const ended = liveClasses.filter((lc) => lc.status === "ended");

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/15 flex items-center justify-center text-lg">
            📹
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)] leading-tight">
              Live Classes
            </h2>
            <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
              {liveClasses.length}{" "}
              {liveClasses.length === 1 ? "session" : "sessions"} total
              {liveNow.length > 0 && (
                <span className="text-red-400 font-bold ml-1">
                  · {liveNow.length} live now
                </span>
              )}
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
            Schedule Class
          </button>
        )}
      </div>

      {liveClasses.length === 0 ? (
        <div className="text-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <div
            className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/15 flex items-center justify-center text-3xl mx-auto mb-5
                          shadow-[0_8px_24px_-8px_rgba(239,68,68,0.15)]"
          >
            📹
          </div>
          <p className="text-lg font-bold text-[var(--text)] mb-2">
            No live classes yet
          </p>
          <p className="text-sm text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
            {isTeacher
              ? "Schedule your first live session."
              : "No live classes have been scheduled yet."}
          </p>
          {isTeacher && (
            <button
              onClick={onAddClick}
              className="mt-6 px-6 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
            >
              + Schedule Class
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {liveNow.length > 0 && (
            <section>
              <SectionLabel
                dot="bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                label="Live Now"
                count={liveNow.length}
              />
              <div className="space-y-3">
                {liveNow.map((lc, i) => (
                  <div
                    key={lc.id}
                    className="animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <LiveClassCard
                      liveClass={lc}
                      isTeacher={isTeacher}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                      onJoin={onJoin}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <SectionLabel
                dot="bg-blue-400"
                label="Upcoming"
                count={upcoming.length}
              />
              <div className="space-y-3">
                {upcoming.map((lc, i) => (
                  <div
                    key={lc.id}
                    className="animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <LiveClassCard
                      liveClass={lc}
                      isTeacher={isTeacher}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                      onJoin={onJoin}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {ended.length > 0 && (
            <section>
              <SectionLabel
                dot="bg-[var(--muted)]/30"
                label="Past Sessions"
                count={ended.length}
              />
              <div className="space-y-3">
                {ended.map((lc, i) => (
                  <div
                    key={lc.id}
                    className="animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <LiveClassCard
                      liveClass={lc}
                      isTeacher={isTeacher}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                      onJoin={onJoin}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default LiveClassesTab;
