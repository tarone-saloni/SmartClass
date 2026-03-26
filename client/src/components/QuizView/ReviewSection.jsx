import ReviewQuestion from "./ReviewQuestion";

function ReviewSection({ quiz, result }) {
  return (
    <>
      <h3 className="text-lg font-extrabold text-[var(--text)] mb-5 flex items-center gap-2 sc-title">
        <span className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center text-sm">📋</span>
        Review Answers
      </h3>
      {quiz.questions.map((question, questionIndex) => (
        <ReviewQuestion
          key={questionIndex}
          question={question}
          questionIndex={questionIndex}
          result={result}
        />
      ))}
    </>
  );
}

export default ReviewSection;