import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import QuizHeader from "../components/QuizView/QuizHeader";
import ProgressBar from "../components/QuizView/ProgressBar";
import QuestionCard from "../components/QuizView/QuestionCard";
import SubmitButton from "../components/QuizView/SubmitButton";
import ResultCard from "../components/QuizView/ResultCard";
import ReviewSection from "../components/QuizView/ReviewSection";
import BackButton from "../components/QuizView/BackButton";

function QuizView() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load quiz data
    apiFetch(`/api/quizzes/${id}`)
      .then((r) => r.json())
      .then((d) => !d.error && setQuiz(d));

    // Load previous result if exists
    apiFetch(`/api/quizzes/${id}/my-result?studentId=${user.id}`)
      .then((r) => r.json())
      .then((r) => {
        if (r && !r.error) {
          setResult(r);
          setSubmitted(true);
        }
      });
  }, [id, user.id]);

  const handleSelectAnswer = (questionIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setIsLoading(true);
    const answersArray = quiz.questions.map((_, i) => ({
      questionIndex: i,
      selectedOption: answers[i] ?? -1,
    }));

    try {
      const res = await apiFetch(`/api/quizzes/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, answers: answersArray }),
      });
      const data = await res.json();
      if (!data.error) {
        setResult(data);
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const answered = Object.keys(answers).length;
  const total = quiz?.questions?.length || 0;
  const allAnswered = answered === total && total > 0;

  // Calculate result styling
  const scorePct = result?.percentage ?? 0;
  const scoreCls =
    scorePct >= 70
      ? "text-emerald-600"
      : scorePct >= 40
        ? "text-amber-500"
        : "text-red-500";
  const resultEmoji = scorePct >= 70 ? "🎉" : scorePct >= 40 ? "👍" : "💪";

  if (!quiz)
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Navbar showBack />
        <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">
          Loading quiz...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <Navbar showBack />
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        {!submitted ? (
          <>
            <QuizHeader quiz={quiz} answered={answered} total={total} />
            <ProgressBar answered={answered} total={total} />

            {quiz.questions.map((question, questionIndex) => (
              <QuestionCard
                key={questionIndex}
                question={question}
                questionIndex={questionIndex}
                total={total}
                selected={answers[questionIndex]}
                onSelect={(optionIndex) =>
                  handleSelectAnswer(questionIndex, optionIndex)
                }
                disabled={false}
              />
            ))}

            <SubmitButton
              allAnswered={allAnswered}
              answered={answered}
              total={total}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </>
        ) : (
          <>
            <ResultCard
              result={result}
              emoji={resultEmoji}
              scoreCls={scoreCls}
            />
            <ReviewSection quiz={quiz} result={result} />
            <BackButton onClick={() => navigate(-1)} />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default QuizView;
