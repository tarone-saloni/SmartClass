const inputCls =
  "w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/12 transition-all duration-200 text-[var(--text)] placeholder:text-[var(--muted)] font-medium";

const textareaCls =
  "w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm outline-none resize-y focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/12 transition-all duration-200 text-[var(--text)] placeholder:text-[var(--muted)] font-medium";

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
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-5
               animate-[fade-in_0.2s_ease_both]"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto
                    shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] text-[var(--text)]
                    animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both] transition-colors duration-300"
    >
      {children}
    </div>
  </div>
);

export { inputCls, textareaCls };
