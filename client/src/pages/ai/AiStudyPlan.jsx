import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, ResponseBox } from "../../utils/aiShared";

export default function AiStudyPlan() {
  const [form, setForm] = useState({
    student_name: "",
    enrolled_courses: "",
    weak_areas: "",
    available_hours_per_week: 10,
    goals: "",
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
        await post("/study-plan", {
          student_name: form.student_name,
          enrolled_courses: form.enrolled_courses
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          weak_areas: form.weak_areas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          available_hours_per_week: Number(form.available_hours_per_week),
          goals: form.goals || undefined,
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
            <span className="text-4xl">📅</span>
            <h1 className="text-3xl font-black text-[var(--text)]">
              Study Plan
            </h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Generate a personalized weekly study schedule
          </p>
        </div>

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Student Name *</label>
                <input
                  className={inp}
                  required
                  value={form.student_name}
                  onChange={set("student_name")}
                  placeholder="e.g. Alex"
                />
              </div>
              <div>
                <label className={lbl}>Hours per Week</label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  className={inp}
                  value={form.available_hours_per_week}
                  onChange={set("available_hours_per_week")}
                />
              </div>
            </div>
            <div>
              <label className={lbl}>
                Enrolled Courses * (comma-separated)
              </label>
              <input
                className={inp}
                required
                value={form.enrolled_courses}
                onChange={set("enrolled_courses")}
                placeholder="e.g. Data Structures, Web Development, Machine Learning"
              />
            </div>
            <div>
              <label className={lbl}>
                Weak Areas (comma-separated, optional)
              </label>
              <input
                className={inp}
                value={form.weak_areas}
                onChange={set("weak_areas")}
                placeholder="e.g. Recursion, CSS Flexbox"
              />
            </div>
            <div>
              <label className={lbl}>Goals (optional)</label>
              <textarea
                className={`${inp} resize-none`}
                rows={2}
                value={form.goals}
                onChange={set("goals")}
                placeholder="e.g. Prepare for upcoming exams"
              />
            </div>
            <SendBtn loading={loading} label="Generate Study Plan" />
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
