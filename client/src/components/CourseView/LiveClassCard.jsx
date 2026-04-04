function LiveClassCard({
  liveClass,
  isTeacher,
  onStatusChange,
  onDelete,
  onJoin,
}) {
  const isLive = liveClass.status === "live";
  const isEnded = liveClass.status === "ended";
  const isScheduled = liveClass.status === "scheduled";
  const isPlatform = liveClass.type === "platform";

  const statusMeta = isLive
    ? {
        label: "LIVE NOW",
        dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/25",
        bar: "from-red-500 to-red-600",
        icon: "📡",
        cardBorder:
          "border-red-500/25 shadow-[0_0_32px_-8px_rgba(239,68,68,0.15)]",
      }
    : isEnded
      ? {
          label: "Ended",
          dot: "bg-[var(--muted)]/40",
          bg: "bg-[var(--border)]/8",
          text: "text-[var(--muted)]",
          border: "border-[var(--border)]/18",
          bar: "from-gray-500 to-gray-600",
          icon: "📼",
          cardBorder: "border-[var(--border)]/15",
        }
      : {
          label: "Scheduled",
          dot: "bg-blue-400",
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          border: "border-blue-500/20",
          bar: "from-blue-500 to-indigo-600",
          icon: "📅",
          cardBorder:
            "border-[var(--border)]/12 hover:border-[var(--accent)]/18",
        };

  return (
    <div
      className={`group bg-[var(--surface)] rounded-2xl border overflow-hidden transition-all duration-300
                   hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)] ${statusMeta.cardBorder}`}
    >
      <div className="p-5 sm:p-6 flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border
                       ${statusMeta.bg} ${statusMeta.border}
                       ${isLive ? "animate-pulse" : "group-hover:scale-105 transition-transform duration-400"}`}
        >
          {statusMeta.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + status */}
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <h4 className="text-[15px] font-bold text-[var(--text)] leading-snug">
              {liveClass.title}
            </h4>
            <span
              className={`flex items-center gap-1.5 px-2.5 py-[3px] rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border
                           ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} ${isLive ? "animate-pulse" : ""}`}
              />
              {statusMeta.label}
            </span>
            {/* Type badge */}
            <span
              className="flex items-center gap-1 px-2 py-[3px] rounded-lg text-[10px] font-bold
                               bg-[var(--border)]/8 text-[var(--muted)] border border-[var(--border)]/15"
            >
              {isPlatform ? "🖥️ On Platform" : "🔗 External Link"}
            </span>
          </div>

          {/* Description */}
          {liveClass.description && (
            <p className="text-[13px] text-[var(--muted)] mb-3 leading-relaxed line-clamp-2">
              {liveClass.description}
            </p>
          )}

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[var(--border)]/8 text-[var(--muted)] border border-[var(--border)]/12">
              📅{" "}
              {new Date(liveClass.scheduledAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              ·{" "}
              {new Date(liveClass.scheduledAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {liveClass.attendeeCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/8 text-emerald-400 border border-emerald-500/12">
                👥 {liveClass.attendeeCount} attended
              </span>
            )}
          </div>

          {/* External meeting link (meetLink type only) */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {!isPlatform && liveClass.meetingLink && !isEnded && (
              <a
                href={liveClass.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] hover:underline decoration-[var(--accent)]/30 underline-offset-2 transition-all"
              >
                🔗 Meeting Link
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="opacity-50"
                >
                  <path d="M3.75 2h3.5a.75.75 0 010 1.5H4.56l7.72 7.72a.75.75 0 11-1.06 1.06L3.5 4.56v2.69a.75.75 0 01-1.5 0v-3.5A1.75 1.75 0 013.75 2z" />
                </svg>
              </a>
            )}
            {liveClass.recordingUrl && (
              <a
                href={liveClass.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-violet-400 hover:underline decoration-violet-400/30 underline-offset-2 transition-all"
              >
                ▶ Watch Recording
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2.5">
            {isTeacher ? (
              <>
                {isScheduled && (
                  <button
                    onClick={() => onStatusChange(liveClass.id, "live")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/12 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 cursor-pointer transition-all duration-300 active:scale-95
                               hover:shadow-[0_8px_20px_-6px_rgba(239,68,68,0.2)]"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Start Live
                  </button>
                )}
                {/* Enter classroom (platform) or end class */}
                {isLive && isPlatform && (
                  <button
                    onClick={() => onJoin(liveClass.id, null)}
                    className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600
                               hover:shadow-[0_12px_28px_-6px_rgba(139,92,246,0.45)]
                               text-white rounded-xl text-xs font-black border-none cursor-pointer transition-all duration-300 active:scale-95"
                  >
                    🖥️ Enter Classroom
                  </button>
                )}
                {isLive && (
                  <button
                    onClick={() => onStatusChange(liveClass.id, "ended")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--border)]/10 hover:bg-[var(--border)]/20 text-[var(--muted)] rounded-xl text-xs font-bold border border-[var(--border)]/18 cursor-pointer transition-all duration-300 active:scale-95"
                  >
                    ⬛ End Class
                  </button>
                )}
                <button
                  onClick={() => onDelete(liveClass.id)}
                  className="px-5 py-2.5 bg-red-500/6 hover:bg-red-500/14 text-red-400 rounded-xl text-xs font-bold border border-red-500/15 cursor-pointer transition-all duration-300 active:scale-95"
                >
                  Delete
                </button>
              </>
            ) : (
              isLive && (
                <>
                  {isPlatform ? (
                    /* Platform class → navigate to the live room */
                    <button
                      onClick={() => onJoin(liveClass.id, null)}
                      className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600
                                 hover:shadow-[0_12px_28px_-6px_rgba(139,92,246,0.45)]
                                 text-white rounded-xl text-xs font-black border-none cursor-pointer transition-all duration-300 active:scale-95"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                      Join Live Now
                    </button>
                  ) : (
                    /* External meeting link → open in new tab */
                    <button
                      onClick={() =>
                        onJoin(liveClass.id, liveClass.meetingLink)
                      }
                      className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600
                                 hover:shadow-[0_12px_28px_-6px_rgba(239,68,68,0.45)]
                                 text-white rounded-xl text-xs font-black border-none cursor-pointer transition-all duration-300 active:scale-95"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                      Join Live Now
                    </button>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveClassCard;
