import {
  inputCls,
  modalOverlay,
  MATERIAL_TYPES,
  FILE_UPLOAD_TYPES,
} from "./Modals";

const ACCEPT_MAP = {
  video: "video/mp4,video/webm,video/ogg,video/quicktime",
  document: "application/pdf",
  image: "image/jpeg,image/png,image/gif,image/webp,image/svg+xml",
};

const URL_PLACEHOLDER = {
  video: "https://youtube.com/watch?v=... or video link",
  document: "https://example.com/document.pdf",
  image: "https://example.com/image.png",
  link: "https://...",
  other: "https://...",
};

function MaterialModal({ isOpen, form, saving, onSubmit, onClose, onChange }) {
  if (!isOpen) return null;

  const canUpload = FILE_UPLOAD_TYPES.includes(form.type);
  const isFileMode = canUpload && form.uploadMode === "file";

  const handleTypeChange = (newType) => {
    onChange({
      ...form,
      type: newType,
      uploadFile: null,
      uploadMode: "url",
      fileUrl: "",
    });
  };

  const handleModeToggle = (mode) => {
    onChange({ ...form, uploadMode: mode, uploadFile: null, fileUrl: "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    onChange({ ...form, uploadFile: file });
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
        {/* Title */}
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

        {/* Description */}
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

        {/* Type */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
            Type
          </label>
          <select
            className={inputCls}
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* URL vs File toggle (only for video/document/image) */}
        {canUpload && (
          <div className="flex rounded-xl overflow-hidden border border-[var(--border)]/40 text-sm font-bold">
            <button
              type="button"
              onClick={() => handleModeToggle("url")}
              className={`flex-1 py-2.5 transition-all duration-200 cursor-pointer
                ${
                  !isFileMode
                    ? "bg-[var(--accent)] text-white shadow-inner"
                    : "glass hover:bg-[var(--accent)]/10 text-[var(--muted)]"
                }`}
            >
              🔗 Paste URL
            </button>
            <button
              type="button"
              onClick={() => handleModeToggle("file")}
              className={`flex-1 py-2.5 transition-all duration-200 cursor-pointer
                ${
                  isFileMode
                    ? "bg-[var(--accent)] text-white shadow-inner"
                    : "glass hover:bg-[var(--accent)]/10 text-[var(--muted)]"
                }`}
            >
              ⬆️ Upload File
            </button>
          </div>
        )}

        {/* URL input */}
        {!isFileMode && (
          <div>
            <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
              URL / Link
            </label>
            <input
              className={inputCls}
              value={form.fileUrl}
              onChange={(e) => onChange({ ...form, fileUrl: e.target.value })}
              placeholder={URL_PLACEHOLDER[form.type] || "https://..."}
              required={form.type === "link"}
            />
          </div>
        )}

        {/* File upload input */}
        {isFileMode && (
          <div>
            <label className="block text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1 opacity-80">
              Select File <span className="text-[var(--accent)]">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full min-h-[110px] rounded-2xl border-2 border-dashed border-[var(--accent)]/40 hover:border-[var(--accent)]/70 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 cursor-pointer transition-all duration-300 px-4 py-5 text-center">
              <input
                type="file"
                accept={ACCEPT_MAP[form.type]}
                className="hidden"
                onChange={handleFileChange}
                required
              />
              {form.uploadFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[var(--text)] break-all line-clamp-2">
                    {form.uploadFile.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatBytes(form.uploadFile.size)} · Click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-2xl">
                    {form.type === "video"
                      ? "🎬"
                      : form.type === "document"
                        ? "📑"
                        : "🖼️"}
                  </p>
                  <p className="text-sm font-bold text-[var(--text)]">
                    Click to choose a file
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {form.type === "video" && "MP4, WebM, MOV — up to 500 MB"}
                    {form.type === "document" && "PDF — up to 500 MB"}
                    {form.type === "image" &&
                      "JPG, PNG, GIF, WebP — up to 500 MB"}
                  </p>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Actions */}
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
            {saving ? "Uploading..." : "Add Material"}
          </button>
        </div>
      </form>
    </>,
  );
}

export default MaterialModal;
