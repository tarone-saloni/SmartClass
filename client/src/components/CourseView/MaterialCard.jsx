import { useState } from "react";
import VideoEmbed from "./VideoEmbed";

const TYPE_META = {
  video: {
    icon: "▶️",
    label: "Video",
    bg: "from-red-500/20 to-red-600/8",
    text: "text-red-500",
    border: "border-red-500/20",
    iconBg: "bg-red-500/12",
    expandColor: "text-red-500",
  },
  document: {
    icon: "📄",
    label: "Document",
    bg: "from-amber-500/20 to-amber-600/8",
    text: "text-amber-500",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/12",
    expandColor: "text-amber-500",
  },
  link: {
    icon: "🔗",
    label: "Link",
    bg: "from-emerald-500/20 to-teal-600/8",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/12",
    expandColor: "text-emerald-500",
  },
  image: {
    icon: "🖼️",
    label: "Image",
    bg: "from-purple-500/20 to-purple-600/8",
    text: "text-purple-500",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/12",
    expandColor: "text-purple-500",
  },
};

const defaultMeta = {
  icon: "📝",
  label: "Other",
  bg: "from-emerald-500/20 to-emerald-600/8",
  text: "text-emerald-500",
  border: "border-emerald-500/20",
  iconBg: "bg-emerald-500/12",
  expandColor: "text-emerald-500",
};

function isYouTubeUrl(url) {
  return /(?:youtube\.com\/watch|youtu\.be\/)/.test(url);
}

function MaterialCard({
  material,
  isTeacher,
  isDone,
  onToggleComplete,
  onDelete,
}) {
  const meta = TYPE_META[material.type] || defaultMeta;
  const fileUrl = material.fileUrl || "";

  // Expanded = show full details+video; collapsed = headline only
  const [expanded, setExpanded] = useState(false);

  const hasMedia = !!fileUrl;

  return (
    <div
      className={`group rounded-2xl border transition-all duration-300 overflow-hidden bg-[var(--surface)]
                     ${
                       isDone
                         ? "border-emerald-500/30 shadow-[0_0_20px_-6px_rgba(16,185,129,0.10)]"
                         : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)]"
                     }`}
    >
      {/* ── HEADER ROW (always visible, clickable) ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer
                   transition-colors duration-200 hover:bg-[var(--surface-elevated)]"
      >
        {/* Type icon */}
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.bg} border ${meta.border}
                         flex items-center justify-center text-lg shrink-0
                         group-hover:scale-105 transition-all duration-300 flex-shrink-0`}
        >
          {meta.icon}
        </div>

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[14px] font-bold text-[var(--text)] leading-snug">
              {material.title}
            </h4>
            <span
              className={`px-2 py-[2px] rounded-md text-[10px] font-black uppercase tracking-widest
                             bg-gradient-to-br ${meta.bg} ${meta.text} border ${meta.border}`}
            >
              {meta.label}
            </span>
            {isDone && (
              <span className="flex items-center gap-1 px-2 py-[2px] rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-500/12 text-emerald-500 border border-emerald-500/20">
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
                Done
              </span>
            )}
          </div>

          {/* Date line (always visible) */}
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            Added{" "}
            {new Date(material.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Chevron expand/collapse indicator */}
        <div className="shrink-0 flex items-center gap-2">
          {hasMedia && (
            <span
              className={`text-[11px] font-semibold ${meta.expandColor} opacity-70`}
            >
              {expanded ? "Collapse" : "View"}
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`text-[var(--muted)] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" />
          </svg>
        </div>
      </button>

      {/* ── EXPANDED CONTENT ── */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[var(--border)]">
          <div className="pt-4 space-y-4">
            {/* Description */}
            {material.description && (
              <p className="text-[13px] text-[var(--muted)] leading-relaxed">
                {material.description}
              </p>
            )}

            {/* Video: YouTube embed OR HTML5 player */}
            {material.type === "video" &&
              fileUrl &&
              (isYouTubeUrl(fileUrl) ? (
                <div className="rounded-xl overflow-hidden ring-1 ring-[var(--border)]">
                  <VideoEmbed url={fileUrl} />
                </div>
              ) : (
                <video
                  controls
                  className="w-full rounded-xl ring-1 ring-[var(--border)]"
                  style={{ maxHeight: 260 }}
                >
                  <source src={fileUrl} />
                  Your browser does not support the video tag.
                </video>
              ))}

            {/* Image: inline preview */}
            {material.type === "image" && fileUrl && (
              <img
                src={fileUrl}
                alt={material.title}
                className="w-full rounded-xl object-cover ring-1 ring-[var(--border)]"
                style={{ maxHeight: 260 }}
              />
            )}

            {/* Document / Link / Other: open link */}
            {["document", "link", "other"].includes(material.type) &&
              fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg
                             ${meta.iconBg} ${meta.text} border ${meta.border}
                             hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
                >
                  {meta.icon} Open {meta.label}
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="opacity-60"
                  >
                    <path d="M3.75 2h3.5a.75.75 0 010 1.5H4.56l7.72 7.72a.75.75 0 11-1.06 1.06L3.5 4.56v2.69a.75.75 0 01-1.5 0v-3.5A1.75 1.75 0 013.75 2z" />
                  </svg>
                </a>
              )}

            {/* Actions row */}
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
              {!isTeacher && (
                <button
                  onClick={() => onToggleComplete(material.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all duration-200 active:scale-95
                               ${
                                 isDone
                                   ? "bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/25"
                                   : "bg-[var(--surface-elevated)] hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] border-[var(--border)] hover:border-[var(--accent)]/30"
                               }`}
                >
                  {isDone ? "✓ Completed" : "Mark as Done"}
                </button>
              )}
              {isTeacher && (
                <button
                  onClick={() => onDelete(material.id)}
                  className="px-4 py-2 bg-red-500/8 hover:bg-red-500/15 text-red-500 rounded-xl text-xs font-bold
                             border border-red-500/20 hover:border-red-500/30 cursor-pointer transition-all duration-200 active:scale-95"
                >
                  Delete
                </button>
              )}

              {/* Completed footer indicator */}
              {isDone && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.1em]">
                    Completed
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialCard;
