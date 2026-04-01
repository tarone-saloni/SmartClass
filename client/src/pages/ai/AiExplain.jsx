import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, ResponseBox } from "../../utils/aiShared";

export default function AiExplain() {
  const [form, setForm] = useState({
    concept: "",
    course_context: "",
    difficulty_level: "intermediate",
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
        await post("/explain", {
          ...form,
          course_context: form.course_context || undefined,
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
            <span className="text-4xl">💡</span>
            <h1 className="text-3xl font-black text-[var(--text)]">Explain</h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Explain any concept at your difficulty level
          </p>
        </div>

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Concept *</label>
                <input
                  className={inp}
                  required
                  value={form.concept}
                  onChange={set("concept")}
                  placeholder="e.g. Recursion"
                />
              </div>
              <div>
                <label className={lbl}>Course Context (optional)</label>
                <input
                  className={inp}
                  value={form.course_context}
                  onChange={set("course_context")}
                  placeholder="e.g. Data Structures"
                />
              </div>
            </div>
            <div>
              <label className={lbl}>Difficulty Level</label>
              <select
                className={inp}
                value={form.difficulty_level}
                onChange={set("difficulty_level")}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <SendBtn loading={loading} label="Explain" />
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
