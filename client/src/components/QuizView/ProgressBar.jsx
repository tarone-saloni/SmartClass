function ProgressBar({ answered, total }) {
  const percentage = total > 0 ? (answered / total) * 100 : 0;

  return (
    <div className="mb-8">
      <div className="h-2.5 glass rounded-full overflow-hidden border border-[var(--border)]/30">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_70%,#ec4899)] rounded-full 
                     transition-all duration-700 ease-out shadow-[0_0_12px_var(--accent)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;