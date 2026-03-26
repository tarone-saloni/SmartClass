import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function QuizView() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then((r) => r.json())
      .then(setQuiz);
    fetch(`/api/quizzes/${id}/result/${user.id}`)
      .then((r) => r.json())
      .then((r) => {
        if (r) {
          setResult(r);
          setSubmitted(true);
        }
      });
  }, [id, user.id]);

  const handleSelect = (qi, oi) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const answersArray = quiz.questions.map((_, i) => answers[i] ?? -1);
    const res = await fetch(`/api/quizzes/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: user.id, answers: answersArray }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitted(true);
  };

  const answered = Object.keys(answers).length;
  const total = quiz?.questions?.length || 0;
  const allAnswered = answered === total && total > 0;

  if (!quiz)
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Navbar showBack />
      </div>
    );

  const scoreCls = result
    ? result.percentage >= 70
      ? "text-emerald-600"
      : result.percentage >= 40
        ? "text-amber-500"
        : "text-red-500"
    : "";

  const resultEmoji = result
    ? result.percentage >= 70
      ? "🎉"
      : result.percentage >= 40
        ? "👍"
        : "💪"
    : "";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <Navbar user={user} onLogout={onLogout} showBack />
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        {!submitted ? (
          <>
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-[var(--text)] mb-1">
                {quiz.title}
              </h1>
              <p className="text-sm text-[var(--muted)]">
                {total} questions · {answered} answered
              </p>
            </div>

            <div className="h-1.5 bg-[var(--border)] rounded-full mb-7 overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all"
                style={{
                  width: `${total > 0 ? (answered / total) * 100 : 0}%`,
                }}
              />
            </div>

            {quiz.questions.map((q, qi) => (
              <div
                key={qi}
                className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)] shadow-sm mb-4"
              >
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                  Question {qi + 1} of {total}
                </p>
                <p className="text-base font-semibold text-[var(--text)] mb-5 leading-relaxed">
                  {q.question}
                </p>
                <div className="space-y-3">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    return (
                      <div
                        key={oi}
                        onClick={() => handleSelect(qi, oi)}
                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all select-none ${
                          selected
                            ? "border-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg)]"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            selected
                              ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                              : "bg-[var(--border)] text-[var(--muted)]"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-sm text-[var(--text)]">
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="w-full py-3.5 bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 text-[var(--accent-contrast)] rounded-xl text-base font-semibold border-none cursor-pointer disabled:cursor-not-allowed transition-colors mt-2"
            >
              {allAnswered
                ? "Submit Quiz"
                : `Answer all questions to submit (${answered}/${total})`}
            </button>
          </>
        ) : (
          <>
            <div className="bg-[var(--surface)] rounded-xl p-10 text-center border border-[var(--border)] shadow-sm mb-6">
              <div className="text-5xl mb-4">{resultEmoji}</div>
              <h2 className="text-xl font-bold text-[var(--text)] mb-4">
                Quiz Complete!
              </h2>
              <div className={`text-5xl font-extrabold mb-2 ${scoreCls}`}>
                {result.percentage}%
              </div>
              <p className="text-sm text-[var(--muted)]">
                {result.score} out of {result.total} correct
              </p>
            </div>

            <h3 className="text-base font-bold text-[var(--text)] mb-4">
              Review Answers
            </h3>
            {quiz.questions.map((q, qi) => {
              const selected = result.answers[qi];
              const correct = q.answer;
              const isCorrect = selected === correct;
              return (
                <div
                  key={qi}
                  className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)] shadow-sm mb-4"
                >
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                    Question {qi + 1}
                  </p>
                  <p className="text-base font-semibold text-[var(--text)] mb-5 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="space-y-3">
                    {q.options.map((opt, oi) => {
                      const isCorrectOpt = correct === oi;
                      const isSelectedWrong = selected === oi && !isCorrect;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-3 px-4 py-3 border-2 rounded-xl ${
                            isCorrectOpt
                              ? "border-emerald-500 bg-emerald-50"
                              : isSelectedWrong
                                ? "border-red-400 bg-red-50"
                                : "border-[var(--border)] bg-[var(--bg)]"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isCorrectOpt
                                ? "bg-emerald-500 text-white"
                                : isSelectedWrong
                                  ? "bg-red-400 text-white"
                                  : "bg-[var(--border)] text-[var(--muted)]"
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="text-sm text-[var(--text)]">
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p
                    className={`text-xs font-semibold mt-3 ${isCorrect ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {isCorrect
                      ? "✓ Correct"
                      : `✗ Wrong — Correct answer: ${q.options[correct]}`}
                  </p>
                </div>
              );
            })}

            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 bg-[var(--bg)] hover:bg-[var(--border)]/50 text-[var(--text)] rounded-xl text-base font-semibold border border-[var(--border)] cursor-pointer transition-colors"
            >
              ← Back to Course
            </button>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default QuizView;
