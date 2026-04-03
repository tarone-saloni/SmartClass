import VideoEmbed from "./VideoEmbed";

const TYPE_META = {
  video: {
    icon: "▶️",
    label: "Video",
    bg: "from-red-500/20 to-red-600/8",
    text: "text-red-400",
    border: "border-red-500/20",
    iconBg: "bg-red-500/12",
  },
  document: {
    icon: "📄",
    label: "Document",
    bg: "from-amber-500/20 to-amber-600/8",
    text: "text-amber-400",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/12",
  },
  link: {
    icon: "🔗",
    label: "Link",
    bg: "from-emerald-500/20 to-teal-600/8",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/12",
  },
  image: {
    icon: "🖼️",
    label: "Image",
    bg: "from-purple-500/20 to-purple-600/8",
    text: "text-purple-400",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/12",
  },
};
const defaultMeta = {
  icon: "📝",
  label: "Other",
  bg: "from-emerald-500/20 to-emerald-600/8",
  text: "text-emerald-400",
  border: "border-emerald-500/20",
  iconBg: "bg-emerald-500/12",
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

  return (
    <div
      className={`group relative glass-heavy rounded-2xl border transition-all duration-400 overflow-hidden
                     ${
                       isDone
                         ? "border-emerald-500/25 shadow-[0_0_24px_-6px_rgba(16,185,129,0.12)]"
                         : "border-[var(--border)]/15 hover:border-[var(--accent)]/20 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)]"
                     }`}
    >
      {/* Subtle top gradient line */}
      <div
        className={`h-[2px] w-full bg-gradient-to-r ${
          isDone
            ? "from-emerald-500/60 via-emerald-400/40 to-transparent"
            : `${meta.bg.replace(/\/\d+/g, "")}`
        }`}
        style={{
          background: isDone
            ? "linear-gradient(90deg, rgba(16,185,129,0.5), rgba(20,184,166,0.3), transparent)"
            : undefined,
        }}
      />

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.bg} border ${meta.border}
                           flex items-center justify-center text-xl shrink-0
                           group-hover:scale-110 group-hover:shadow-lg transition-all duration-400`}
          >
            {meta.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title + badges row */}
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <h4 className="text-[15px] font-bold text-[var(--text)] leading-snug">
                  {material.title}
                </h4>
                <span
                  className={`px-2.5 py-[3px] rounded-lg text-[10px] font-black uppercase tracking-widest
                                 bg-gradient-to-br ${meta.bg} ${meta.text} border ${meta.border}`}
                >
                  {meta.label}
                </span>
                {isDone && (
                  <span className="flex items-center gap-1 px-2.5 py-[3px] rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                    Done
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!isTeacher && (
                  <button
                    onClick={() => onToggleComplete(material.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all duration-300 active:scale-95
                                 ${
                                   isDone
                                     ? "bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_-4px_rgba(16,185,129,0.2)]"
                                     : "glass hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] border-[var(--border)]/25 hover:border-[var(--accent)]/25"
                                 }`}
                  >
                    {isDone ? "✓ Completed" : "Mark Done"}
                  </button>
                )}
                {isTeacher && (
                  <button
                    onClick={() => onDelete(material.id)}
                    className="px-4 py-2 bg-red-500/8 hover:bg-red-500/15 text-red-400 rounded-xl text-xs font-bold
                               border border-red-500/15 hover:border-red-500/25 cursor-pointer transition-all duration-300 active:scale-95"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            {material.description && (
              <p className="text-[13px] text-[var(--muted)] mb-2.5 leading-relaxed line-clamp-2">
                {material.description}
              </p>
            )}

            {/* Date */}
            <p className="text-[11px] text-[var(--muted)]/50 font-medium mb-2">
              Added{" "}
              {new Date(material.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            {/* Video: YouTube embed OR HTML5 player (Cloudinary / direct URL) */}
            {material.type === "video" &&
              fileUrl &&
              (isYouTubeUrl(fileUrl) ? (
                <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-[var(--border)]/10">
                  <VideoEmbed url={fileUrl} />
                </div>
              ) : (
                <video
                  controls
                  className="w-full mt-3 rounded-xl ring-1 ring-[var(--border)]/10"
                  style={{ maxHeight: 220 }}
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
                className="w-full mt-3 rounded-xl object-cover ring-1 ring-[var(--border)]/10"
                style={{ maxHeight: 220 }}
              />
            )}

            {/* Document / Link / Other: open link */}
            {["document", "link", "other"].includes(material.type) &&
              fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-xs font-bold mt-1 px-3 py-1.5 rounded-lg
                             ${meta.iconBg} ${meta.text} border ${meta.border}
                             hover:shadow-md transition-all duration-300 hover:scale-[1.02]`}
                >
                  {meta.icon} Open {meta.label}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="opacity-60"
                  >
                    <path d="M3.75 2h3.5a.75.75 0 010 1.5H4.56l7.72 7.72a.75.75 0 11-1.06 1.06L3.5 4.56v2.69a.75.75 0 01-1.5 0v-3.5A1.75 1.75 0 013.75 2z" />
                  </svg>
                </a>
              )}
          </div>
        </div>

        {/* Completed footer */}
        {isDone && (
          <div className="mt-4 pt-3.5 border-t border-emerald-500/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-[0.12em]">
              Material completed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialCard;
