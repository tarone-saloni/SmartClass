function QuestionCard({ question, questionIndex, total, selected, onSelect, disabled = false }) {
  return (
    <div className="sc-card-premium glass rounded-2xl p-6 mb-5 animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
      style={{ animationDelay: `${questionIndex * 60}ms` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
          Question {questionIndex + 1} of {total}
        </p>
        {question.points > 1 && (
          <span className="px-2.5 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-[10px] font-bold border border-[var(--accent)]/15">
            {question.points} pts
          </span>
        )}
      </div>
      <p className="text-base font-bold text-[var(--text)] mb-6 leading-relaxed">
        {question.question}
      </p>
      <div className="space-y-2.5">
        {question.options.map((option, optionIndex) => {
          const isSelected = selected === optionIndex;
          return (
            <OptionButton
              key={optionIndex}
              option={option}
              optionIndex={optionIndex}
              isSelected={isSelected}
              onClick={() => !disabled && onSelect(optionIndex)}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}

function OptionButton({ option, optionIndex, isSelected, onClick, disabled }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3.5 px-4 py-3.5 border-2 rounded-xl cursor-pointer transition-all duration-300 select-none 
                 group ${disabled ? "cursor-not-allowed opacity-75" : "hover:-translate-y-0.5"
        } ${isSelected
          ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_4px_16px_-4px_var(--accent)]"
          : "border-[var(--border)]/50 hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5"
        }`}
    >
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${isSelected
            ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_12px_-4px_var(--accent)] scale-110"
            : "bg-[var(--border)]/50 text-[var(--muted)] group-hover:bg-[var(--accent)]/15 group-hover:text-[var(--accent)]"
          }`}
      >
        {String.fromCharCode(65 + optionIndex)}
      </span>
      <span className={`text-sm font-medium transition-colors duration-300 ${isSelected ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
        {option}
      </span>
      {isSelected && (
        <span className="ml-auto text-[var(--accent)] text-sm animate-[scale-in_0.3s_ease_both]">✓</span>
      )}
    </div>
  );
}

export default QuestionCard;