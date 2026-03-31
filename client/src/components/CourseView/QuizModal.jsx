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
      <h3 className="text-lg font-bold text-[var(--text)] mb-5">Create Quiz</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            Quiz Title *
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
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
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
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
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
            className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--muted)]">
                Question {qi + 1}
              </span>
              {form.questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qi)}
                  className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
            <input
              className={`${inputCls} mb-3`}
              placeholder="Question text..."
              value={q.question}
              onChange={(e) =>
                handleUpdateQuestion(qi, "question", e.target.value)
              }
              required
            />
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name={`q${qi}`}
                  checked={q.answer === oi}
                  onChange={() => handleUpdateQuestion(qi, "answer", oi)}
                  className="cursor-pointer accent-[var(--accent)]"
                  title="Mark as correct answer"
                />
                <input
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-[var(--accent)] transition-colors bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/70 ${
                    q.answer === oi
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-[var(--border)]"
                  }`}
                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={(e) => handleUpdateOption(qi, oi, e.target.value)}
                  required
                />
              </div>
            ))}
            <p className="text-xs text-[var(--muted)] mt-1">
              Click the radio to mark the correct answer
            </p>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer transition-colors bg-transparent"
        >
          + Add Question
        </button>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/40 text-[var(--text)] rounded-lg text-sm font-medium border border-[var(--border)] cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer"
          >
            {saving ? "Creating..." : "Create Quiz"}
          </button>
        </div>
      </form>
    </>,
  );
}

export default QuizModal;
