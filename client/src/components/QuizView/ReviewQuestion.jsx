function ReviewQuestion({ question, questionIndex, result }) {
  const answer = result.answers?.find((a) => a.questionIndex === questionIndex);
  const selectedOption = answer?.selectedOption;
  const correctOption = question.correctOption;
  const isCorrect = selectedOption === correctOption;

  return (
    <div className="sc-card-premium glass rounded-2xl p-6 mb-5 animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
      style={{ animationDelay: `${questionIndex * 60}ms` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
          Question {questionIndex + 1}
        </p>
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${isCorrect
            ? "bg-emerald-500/12 text-emerald-500 border border-emerald-500/20"
            : "bg-red-500/12 text-red-500 border border-red-500/20"
          }`}>
          {isCorrect ? "✓ Correct" : "✗ Wrong"}
        </span>
      </div>
      <p className="text-base font-bold text-[var(--text)] mb-6 leading-relaxed">
        {question.question}
      </p>
      <div className="space-y-2.5">
        {question.options.map((option, optionIndex) => {
          const isCorrectOption = correctOption === optionIndex;
          const isSelectedWrong = selectedOption === optionIndex && !isCorrect;

          return (
            <ReviewOptionButton
              key={optionIndex}
              option={option}
              optionIndex={optionIndex}
              isCorrectOption={isCorrectOption}
              isSelectedWrong={isSelectedWrong}
            />
          );
        })}
      </div>
      {!isCorrect && (
        <p className="text-xs font-semibold mt-4 text-[var(--muted)] bg-[var(--accent)]/5 px-3 py-2 rounded-lg border border-[var(--border)]/30">
          💡 Correct answer: <span className="text-emerald-500 font-bold">{question.options[correctOption]}</span>
        </p>
      )}
    </div>
  );
}

function ReviewOptionButton({ option, optionIndex, isCorrectOption, isSelectedWrong }) {
  return (
    <div
      className={`flex items-center gap-3.5 px-4 py-3.5 border-2 rounded-xl transition-all duration-300 ${isCorrectOption
          ? "border-emerald-500/50 bg-emerald-500/8"
          : isSelectedWrong
            ? "border-red-500/50 bg-red-500/8"
            : "border-[var(--border)]/30 bg-transparent"
        }`}
    >
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrectOption
            ? "bg-emerald-500 text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)]"
            : isSelectedWrong
              ? "bg-red-500 text-white shadow-[0_4px_12px_-4px_rgba(239,68,68,0.4)]"
              : "bg-[var(--border)]/40 text-[var(--muted)]"
          }`}
      >
        {isCorrectOption ? "✓" : isSelectedWrong ? "✗" : String.fromCharCode(65 + optionIndex)}
      </span>
      <span className={`text-sm font-medium ${isCorrectOption ? "text-emerald-500" : isSelectedWrong ? "text-red-500" : "text-[var(--text)]"
        }`}>
        {option}
      </span>
    </div>
  );
}

export default ReviewQuestion;