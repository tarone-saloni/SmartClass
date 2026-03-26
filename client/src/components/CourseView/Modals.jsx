const inputCls = "w-full px-4 py-3 border border-[var(--border)]/50 rounded-xl text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 focus:shadow-[0_4px_16px_-4px_var(--accent)] transition-all duration-300 glass text-[var(--text)] placeholder:text-[var(--muted)]/50 hover:border-[var(--accent)]/30";
const textareaCls = "w-full px-4 py-3 border border-[var(--border)]/50 rounded-xl text-sm outline-none resize-y focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 focus:shadow-[0_4px_16px_-4px_var(--accent)] transition-all duration-300 glass text-[var(--text)] placeholder:text-[var(--muted)]/50 hover:border-[var(--accent)]/30";

export const MATERIAL_TYPES = [
  { value: "video", label: "Video (YouTube URL)" },
  { value: "link", label: "Link / URL" },
  { value: "document", label: "Document" },
  { value: "image", label: "Image" },
  { value: "other", label: "Other" },
];

export const modalOverlay = (onClose, children) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-5"
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="glass-heavy border border-[var(--border)]/50 rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto 
                    shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)] text-[var(--text)]
                    animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
      {children}
    </div>
  </div>
);

export { inputCls, textareaCls };