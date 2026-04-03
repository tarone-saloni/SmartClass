const inputCls =
  "w-full px-4 py-3.5 border border-[var(--border)]/40 rounded-2xl text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 focus:shadow-[0_8px_24px_-8px_var(--accent)/20] transition-all duration-300 glass-heavy text-[var(--text)] placeholder:text-[var(--muted)]/40 hover:border-[var(--accent)]/25 font-medium";

const textareaCls =
  "w-full px-4 py-3.5 border border-[var(--border)]/40 rounded-2xl text-sm outline-none resize-y focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 focus:shadow-[0_8px_24px_-8px_var(--accent)/20] transition-all duration-300 glass-heavy text-[var(--text)] placeholder:text-[var(--muted)]/40 hover:border-[var(--accent)]/25 font-medium";

export const MATERIAL_TYPES = [
  { value: "video", label: "Video" },
  { value: "document", label: "Document / PDF" },
  { value: "image", label: "Image" },
  { value: "link", label: "Link / URL" },
  { value: "other", label: "Other" },
];

// Types that support file upload in addition to URL
export const FILE_UPLOAD_TYPES = ["video", "document", "image"];

export const modalOverlay = (onClose, children) => (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-5
               animate-[fade-in_0.2s_ease_both]"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className="glass-heavy border border-[var(--border)]/30 rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto 
                    shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] text-[var(--text)]
                    animate-[scale-in_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
    >
      {children}
    </div>
  </div>
);

export { inputCls, textareaCls };
