import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, ResponseBox } from "../../utils/aiShared";

export default function AiCourseOutline() {
  const [form, setForm] = useState({
    course_title: "",
    subject: "",
    duration_weeks: 8,
    target_level: "intermediate",
    learning_objectives: "",
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
        await post("/course-outline", {
          ...form,
          duration_weeks: Number(form.duration_weeks),
          learning_objectives: form.learning_objectives || undefined,
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
            <span className="text-4xl">🎓</span>
            <h1 className="text-3xl font-black text-[var(--text)]">
              Course Outline
            </h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Generate a full week-by-week course outline
          </p>
        </div>

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Course Title *</label>
                <input
                  className={inp}
                  required
                  value={form.course_title}
                  onChange={set("course_title")}
                  placeholder="e.g. Introduction to Machine Learning"
                />
              </div>
              <div>
                <label className={lbl}>Subject *</label>
                <input
                  className={inp}
                  required
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Duration (weeks)</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  className={inp}
                  value={form.duration_weeks}
                  onChange={set("duration_weeks")}
                />
              </div>
              <div>
                <label className={lbl}>Target Level</label>
                <select
                  className={inp}
                  value={form.target_level}
                  onChange={set("target_level")}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Learning Objectives (optional)</label>
              <textarea
                className={`${inp} resize-none`}
                rows={3}
                value={form.learning_objectives}
                onChange={set("learning_objectives")}
                placeholder="e.g. Students will understand core ML algorithms and implement them in Python"
              />
            </div>
            <SendBtn loading={loading} label="Generate Outline" />
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
