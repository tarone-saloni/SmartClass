import { inputCls, textareaCls, modalOverlay } from "./Modals";

function AssignmentModal({
  isOpen,
  form,
  saving,
  onSubmit,
  onClose,
  onChange,
}) {
  if (!isOpen) return null;

  return modalOverlay(
    onClose,
    <>
      <h3 className="text-xl font-extrabold text-[var(--text)] mb-6 flex items-center gap-3 sc-title">
        <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl shadow-[0_4px_16px_-4px_var(--accent)]">
          📋
        </span>
        Create Assignment
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
            placeholder="Assignment title"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
            Description
          </label>
          <textarea
            className={`${textareaCls} min-h-[70px]`}
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder="Instructions for students..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
              Due Date
            </label>
            <input
              type="date"
              className={inputCls}
              value={form.dueDate}
              onChange={(e) => onChange({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
              Max Score
            </label>
            <input
              type="number"
              className={inputCls}
              value={form.maxScore}
              onChange={(e) => onChange({ ...form, maxScore: e.target.value })}
              min={1}
            />
          </div>
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
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </>,
  );
}

export default AssignmentModal;
