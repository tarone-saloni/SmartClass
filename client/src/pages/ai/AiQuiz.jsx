import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, ResponseBox } from "../../utils/aiShared";

export default function AiQuiz() {
  const [form, setForm] = useState({
    topic: "",
    num_questions: 5,
    difficulty: "medium",
    content: "",
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
        await post("/generate-quiz", {
          ...form,
          num_questions: Number(form.num_questions),
          content: form.content || undefined,
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
            <span className="text-4xl">📝</span>
            <h1 className="text-3xl font-black text-[var(--text)]">
              Quiz Generator
            </h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Generate multiple-choice quiz questions
          </p>
        </div>

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={lbl}>Topic *</label>
                <input
                  className={inp}
                  required
                  value={form.topic}
                  onChange={set("topic")}
                  placeholder="e.g. Python Functions"
                />
              </div>
              <div>
                <label className={lbl}>Questions</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className={inp}
                  value={form.num_questions}
                  onChange={set("num_questions")}
                />
              </div>
            </div>
            <div>
              <label className={lbl}>Difficulty</label>
              <select
                className={inp}
                value={form.difficulty}
                onChange={set("difficulty")}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className={lbl}>
                Course Content (optional — paste material to base questions on)
              </label>
              <textarea
                className={`${inp} resize-none`}
                rows={4}
                value={form.content}
                onChange={set("content")}
                placeholder="Paste relevant course material here…"
              />
            </div>
            <SendBtn loading={loading} label="Generate Quiz" />
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
