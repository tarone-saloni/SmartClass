function BrandHeader({ showLabel = true }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl 
                      bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_60%,#7c3aed)] 
                      text-[var(--accent-contrast)] shadow-[0_12px_36px_-8px_var(--accent)]
                      animate-float ring-4 ring-[var(--accent)]/15">
        🎓
      </div>
      <div>
        <h1 className="sc-title text-3xl sm:text-4xl font-extrabold text-[var(--text)]">
          Smart<span className="gradient-text">Class</span>
        </h1>
        {showLabel && (
          <p className="text-xs text-[var(--muted)] mt-1 font-semibold tracking-wide uppercase">
            Modern learning management
          </p>
        )}
      </div>
    </div>
  );
}

export default BrandHeader;