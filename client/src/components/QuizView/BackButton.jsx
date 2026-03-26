function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3.5 glass hover:bg-[var(--accent)]/8 text-[var(--text)] rounded-xl text-base font-bold 
                 border border-[var(--border)]/50 cursor-pointer transition-all duration-300 
                 hover:border-[var(--accent)]/30 active:scale-98
                 flex items-center justify-center gap-2"
    >
      <span className="transition-transform hover:-translate-x-1">←</span> Back to Course
    </button>
  );
}

export default BackButton;