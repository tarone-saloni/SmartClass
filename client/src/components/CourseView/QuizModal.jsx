import { inputCls, modalOverlay } from "./Modals";

function QuizModal({ isOpen, form, saving, onSubmit, onClose, onChange }) {
  if (!isOpen) return null;

  const handleUpdateQuestion = (qi, field, val) => {
    onChange({
      ...form,
      questions: form.questions.map((q, i) =>
        i === qi ? { ...q, [field]: val } : q,
      ),
    });
  };

  const handleUpdateOption = (qi, oi, val) => {
    onChange({
      ...form,
      questions: form.questions.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) }
          : q,
      ),
    });
  };

  const handleAddQuestion = () => {
    onChange({
      ...form,
      questions: [
        ...form.questions,
        { question: "", options: ["", "", "", ""], answer: 0 },
      ],
    });
  };

  const handleRemoveQuestion = (qi) => {
    onChange({
      ...form,
      questions: form.questions.filter((_, i) => i !== qi),
    });
  };

  return modalOverlay(
    onClose,
    <>
      <h3 className="text-xl font-extrabold text-[var(--text)] mb-6 flex items-center gap-3 sc-title">
        <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl shadow-[0_4px_16px_-4px_var(--accent)]">
          🧠
        </span>
        Create Quiz
      </h3>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
            Quiz Title <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="Quiz title"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
              Description
            </label>
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) =>
                onChange({ ...form, description: e.target.value })
              }
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
              Time Limit (min, 0=none)
            </label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.timeLimit}
              onChange={(e) => onChange({ ...form, timeLimit: e.target.value })}
            />
          </div>
        </div>
        {form.questions.map((q, qi) => (
          <div
            key={qi}
            className="border border-[var(--border)]/40 rounded-2xl p-5 bg-[var(--bg)]/50 glass shadow-sm relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--text)]/10 flex items-center justify-center text-[10px]">
                  {qi + 1}
                </span>
                Question
              </span>
              {form.questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qi)}
                  className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-400/10 rounded-full transition-colors cursor-pointer"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <input
              className={`${inputCls} mb-4`}
              placeholder="Question text..."
              value={q.question}
              onChange={(e) =>
                handleUpdateQuestion(qi, "question", e.target.value)
              }
              required
            />
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={q.answer === oi}
                      onChange={() => handleUpdateQuestion(qi, "answer", oi)}
                      className="peer sr-only"
                      title="Mark as correct answer"
                    />
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)] transition-all flex items-center justify-center cursor-pointer shadow-sm">
                      {q.answer === oi && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <input
                    className={`flex-1 px-4 py-3 border border-[var(--border)]/40 rounded-xl text-sm outline-none transition-all duration-300 glass-heavy placeholder:text-[var(--muted)]/50 ${
                      q.answer === oi
                        ? "border-[var(--accent)]/50 bg-[var(--accent)]/5 text-[var(--text)] ring-1 ring-[var(--accent)]/20 shadow-inner"
                        : "focus:border-[var(--accent)]/40 hover:border-[var(--border)] text-[var(--text)]"
                    }`}
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    value={opt}
                    onChange={(e) => handleUpdateOption(qi, oi, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-4 font-medium uppercase tracking-wider text-right">
              Select radio to mark correct answer
            </p>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-4 border-2 border-dashed border-[var(--border)]/50 rounded-2xl text-sm font-bold text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 hover:text-[var(--accent)] cursor-pointer transition-colors glass shadow-sm"
        >
          + Add Question
        </button>
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
            {saving ? "Creating..." : "Create Quiz"}
          </button>
        </div>
      </form>
    </>,
  );
}

export default QuizModal;
