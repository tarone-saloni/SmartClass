function SubmitButton({ allAnswered, answered, total, onSubmit, isLoading = false }) {
  return (
    <button
      onClick={onSubmit}
      disabled={!allAnswered || isLoading}
      className={`w-full py-4 rounded-xl text-base font-bold border-none cursor-pointer 
                 disabled:cursor-not-allowed transition-all duration-300 mt-4 active:scale-98
                 flex items-center justify-center gap-2.5
                 ${allAnswered
          ? "sc-btn-glow"
          : "glass border border-[var(--border)]/50 text-[var(--muted)] disabled:opacity-60"
        }`}
    >
      {isLoading ? (
        <>
          <span className="sc-spinner" />
          <span>Submitting...</span>
        </>
      ) : allAnswered ? (
        <>
          <span>🚀</span>
          <span>Submit Quiz</span>
        </>
      ) : (
        `Answer all questions to submit (${answered}/${total})`
      )}
    </button>
  );
}

export default SubmitButton;