import { inputCls, modalOverlay, MATERIAL_TYPES } from "./Modals";

function MaterialModal({ isOpen, form, saving, onSubmit, onClose, onChange }) {
  if (!isOpen) return null;

  return modalOverlay(
    onClose,
    <>
      <h3 className="text-xl font-extrabold text-[var(--text)] mb-6 flex items-center gap-3 sc-title">
        <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl shadow-[0_4px_16px_-4px_var(--accent)]">
          📄
        </span>
        Add Material
      </h3>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
            Title <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="Material title"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
            Description
          </label>
          <input
            className={inputCls}
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder="Brief description (optional)"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
            Type
          </label>
          <select
            className={inputCls}
            value={form.type}
            onChange={(e) => onChange({ ...form, type: e.target.value })}
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
            {form.type === "video" ? "YouTube URL " : "URL / Link "}
            {form.type === "video" && (
              <span className="text-[var(--accent)]">*</span>
            )}
          </label>
          <input
            className={inputCls}
            value={form.fileUrl}
            onChange={(e) => onChange({ ...form, fileUrl: e.target.value })}
            placeholder={
              form.type === "video"
                ? "https://youtube.com/watch?v=..."
                : "https://..."
            }
            required={form.type === "video"}
          />
        </div>
        <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-[var(--border)]/30">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 glass hover:bg-[var(--border)]/30 text-[var(--text)] rounded-xl text-sm font-bold border border-[var(--border)]/50 cursor-pointer transition-all duration-300 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center min-w-[120px]"
          >
            {saving ? "Adding..." : "Add Material"}
          </button>
        </div>
      </form>
    </>,
  );
}

export default MaterialModal;
