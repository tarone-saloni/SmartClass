import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AiPlaygroundNav from "../../components/AiPlaygroundNav";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, ResponseBox } from "../../utils/aiShared";

export default function AiPerformance() {
  const [form, setForm] = useState({
    subject: "",
    quiz_scores: "",
    assignment_grades: "",
    course_progress: 0,
  });
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRes(null);
    try {
      setRes(
        await post("/analyze-performance", {
          subject: form.subject,
          quiz_scores: form.quiz_scores
            .split(",")
            .map((s) => parseFloat(s.trim()))
            .filter((n) => !isNaN(n)),
          assignment_grades: form.assignment_grades
            .split(",")
            .map((s) => parseFloat(s.trim()))
            .filter((n) => !isNaN(n)),
          course_progress: Number(form.course_progress),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-xl">
            📊
          </div>

          <div>
            <h1 className="text-2xl font-semibold">Performance Analyzer</h1>
            <p className="text-[var(--muted)] text-sm">
              Analyze academic performance and get insights
            </p>
          </div>
        </div>

        <AiPlaygroundNav />

        {/* CARD */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <form onSubmit={submit} className="space-y-5">
            {/* ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={lbl}>Subject *</label>
                <input
                  className={`${inp} bg-transparent border border-[var(--border)] focus:border-[var(--accent)]`}
                  required
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="e.g. Data Structures"
                />
              </div>

              <div className="space-y-1.5">
                <label className={lbl}>Course Progress (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`${inp} bg-transparent border border-[var(--border)] focus:border-[var(--accent)]`}
                  value={form.course_progress}
                  onChange={set("course_progress")}
                />
              </div>
            </div>

            {/* QUIZ SCORES */}
            <div className="space-y-1.5">
              <label className={lbl}>
                Quiz Scores (comma-separated, optional)
              </label>
              <input
                className={`${inp} bg-transparent border border-[var(--border)] focus:border-[var(--accent)]`}
                value={form.quiz_scores}
                onChange={set("quiz_scores")}
                placeholder="e.g. 72, 68, 80"
              />
            </div>

            {/* ASSIGNMENTS */}
            <div className="space-y-1.5">
              <label className={lbl}>
                Assignment Grades (comma-separated, optional)
              </label>
              <input
                className={`${inp} bg-transparent border border-[var(--border)] focus:border-[var(--accent)]`}
                value={form.assignment_grades}
                onChange={set("assignment_grades")}
                placeholder="e.g. 75, 82, 88"
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm
              bg-[var(--accent)] text-black
              transition-opacity duration-200 hover:opacity-90"
            >
              {loading ? "Analyzing..." : "Analyze Performance"}
            </button>

            {/* RESPONSE */}
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
