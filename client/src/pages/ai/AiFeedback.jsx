import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, ResponseBox } from "../../utils/aiShared";

export default function AiFeedback() {
  const [form, setForm] = useState({
    assignment_title: "",
    assignment_description: "",
    student_submission: "",
    max_score: 100,
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
        await post("/feedback", {
          ...form,
          max_score: Number(form.max_score),
          assignment_description: form.assignment_description || undefined,
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
            <span className="text-4xl">✅</span>
            <h1 className="text-3xl font-black text-[var(--text)]">Feedback</h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Grade assignments and give constructive feedback
          </p>
        </div>

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={lbl}>Assignment Title *</label>
                <input
                  className={inp}
                  required
                  value={form.assignment_title}
                  onChange={set("assignment_title")}
                  placeholder="e.g. Implement a Stack in Python"
                />
              </div>
              <div>
                <label className={lbl}>Max Score</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  className={inp}
                  value={form.max_score}
                  onChange={set("max_score")}
                />
              </div>
            </div>
            <div>
              <label className={lbl}>Assignment Description (optional)</label>
              <textarea
                className={`${inp} resize-none`}
                rows={2}
                value={form.assignment_description}
                onChange={set("assignment_description")}
                placeholder="Requirements or rubric…"
              />
            </div>
            <div>
              <label className={lbl}>Student Submission *</label>
              <textarea
                className={`${inp} resize-none`}
                rows={8}
                required
                value={form.student_submission}
                onChange={set("student_submission")}
                placeholder="Paste the student's work here…"
              />
            </div>
            <SendBtn loading={loading} label="Get Feedback" />
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
