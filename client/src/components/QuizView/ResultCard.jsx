function ResultCard({ result, emoji, scoreCls }) {
  return (
    <div className="sc-card-premium glass rounded-2xl p-10 text-center mb-8 
                    animate-[scale-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="text-6xl mb-5 animate-float drop-shadow-lg">{emoji}</div>
      <h2 className="text-2xl font-extrabold text-[var(--text)] mb-5 sc-title">Quiz Complete!</h2>
      <div className={`text-6xl font-extrabold mb-3 ${scoreCls} tracking-tight`}>
        {result.percentage}%
      </div>
      <p className="text-sm text-[var(--muted)] font-semibold">
        {result.score} / {result.totalPoints} points earned
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <div className="px-4 py-2 glass rounded-xl border border-[var(--border)]/40 text-center">
          <p className="text-lg font-extrabold text-[var(--text)]">{result.correctCount || result.score}</p>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Correct</p>
        </div>
        <div className="px-4 py-2 glass rounded-xl border border-[var(--border)]/40 text-center">
          <p className="text-lg font-extrabold text-[var(--text)]">{(result.totalQuestions || result.totalPoints) - (result.correctCount || result.score)}</p>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Wrong</p>
        </div>
      </div>
    </div>
  );
}

export default ResultCard;