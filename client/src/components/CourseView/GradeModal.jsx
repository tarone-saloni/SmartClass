import { inputCls, textareaCls, modalOverlay } from "./Modals";

function GradeModal({ isOpen, gradeForm, onSubmit, onClose, onChange }) {
  if (!isOpen) return null;

  return modalOverlay(onClose, <>
    <h3 className="text-xl font-extrabold text-[var(--text)] mb-6 flex items-center gap-3 sc-title">
      <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl">📝</span>
      Grade Submission
    </h3>
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1">Score</label>
        <input type="number" className={inputCls} value={gradeForm.score}
          onChange={e => onChange({ ...gradeForm, score: e.target.value })}
          placeholder="e.g. 85" required />
      </div>
      <div>
        <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1">Feedback</label>
        <textarea className={`${textareaCls} min-h-[100px]`} value={gradeForm.feedback}
          onChange={e => onChange({ ...gradeForm, feedback: e.target.value })}
          placeholder="Optional feedback for the student..." />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]/30">
        <button type="button"
          onClick={onClose}
          className="px-6 py-3 glass hover:bg-[var(--border)]/30 text-[var(--text)] rounded-xl text-sm font-bold 
                     border border-[var(--border)]/50 cursor-pointer transition-all duration-300 active:scale-95">
          Cancel
        </button>
        <button type="submit"
          className="px-6 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95">
          Save Grade
        </button>
      </div>
    </form>
  </>);
}

export default GradeModal;