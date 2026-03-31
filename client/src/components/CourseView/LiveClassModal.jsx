import { inputCls, textareaCls, modalOverlay } from "./Modals";

function LiveClassModal({ isOpen, form, saving, onSubmit, onClose, onChange }) {
  if (!isOpen) return null;

  return modalOverlay(
    onClose,
    <>
      <h3 className="text-lg font-bold text-[var(--text)] mb-5">
        Schedule Live Class
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            Title *
          </label>
          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="e.g. Chapter 3 Discussion"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            Description
          </label>
          <textarea
            className={`${textareaCls} min-h-[60px]`}
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder="What will be covered..."
          />
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            Date &amp; Time *
          </label>
          <input
            type="datetime-local"
            className={inputCls}
            value={form.scheduledAt}
            onChange={(e) => onChange({ ...form, scheduledAt: e.target.value })}
            required
          />
        </div>

        {/* Class type toggle */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-2">
            Class Type *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                value: "platform",
                icon: "🖥️",
                title: "On Platform",
                desc: "Share your screen directly here",
              },
              {
                value: "meetLink",
                icon: "🔗",
                title: "External Link",
                desc: "Google Meet, Zoom, etc.",
              },
            ].map((opt) => {
              const active = form.type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChange({ ...form, type: opt.value, meetingLink: "" })
                  }
                  className={`flex flex-col items-start gap-1 px-4 py-3 rounded-2xl border text-left cursor-pointer
                               transition-all duration-200
                               ${
                                 active
                                   ? "bg-[var(--accent)]/12 border-[var(--accent)]/40 shadow-[0_4px_16px_-4px_var(--accent)/20]"
                                   : "glass border-[var(--border)]/25 hover:border-[var(--accent)]/20"
                               }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span
                    className={`text-xs font-bold ${active ? "text-[var(--accent)]" : "text-[var(--text)]"}`}
                  >
                    {opt.title}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] leading-tight">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Meeting link — only shown for meetLink type */}
        {form.type === "meetLink" && (
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
              Meeting Link *
            </label>
            <input
              className={inputCls}
              value={form.meetingLink}
              onChange={(e) =>
                onChange({ ...form, meetingLink: e.target.value })
              }
              placeholder="https://meet.google.com/..."
              required={form.type === "meetLink"}
            />
          </div>
        )}

        {form.type === "platform" && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-[var(--accent)]/6 border border-[var(--accent)]/15 text-[12px] text-[var(--muted)]">
            <span className="text-base shrink-0">ℹ️</span>
            <span>
              After starting the class, use{" "}
              <strong className="text-[var(--text)]">Start Screen Share</strong>{" "}
              inside the class room to go live. You can also record the session.
            </span>
          </div>
        )}

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
            {saving ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </form>
    </>,
  );
}

export default LiveClassModal;
