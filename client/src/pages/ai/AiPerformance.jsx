import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-4xl">📊</span>
            <h1 className="text-3xl font-black text-[var(--text)]">
              Performance
            </h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Analyze academic performance and get insights
          </p>
        </div>

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Subject *</label>
                <input
                  className={inp}
                  required
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="e.g. Data Structures"
                />
              </div>
              <div>
                <label className={lbl}>Course Progress (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inp}
                  value={form.course_progress}
                  onChange={set("course_progress")}
                />
              </div>
            </div>
            <div>
              <label className={lbl}>
                Quiz Scores (comma-separated, optional)
              </label>
              <input
                className={inp}
                value={form.quiz_scores}
                onChange={set("quiz_scores")}
                placeholder="e.g. 72, 68, 80, 85, 90"
              />
            </div>
            <div>
              <label className={lbl}>
                Assignment Grades (comma-separated, optional)
              </label>
              <input
                className={inp}
                value={form.assignment_grades}
                onChange={set("assignment_grades")}
                placeholder="e.g. 75, 82, 88"
              />
            </div>
            <SendBtn loading={loading} label="Analyze Performance" />
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
