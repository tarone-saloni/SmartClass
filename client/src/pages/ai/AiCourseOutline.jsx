import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AiPlaygroundNav from "../../components/AiPlaygroundNav";
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
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {/* HEADER */}
        <div className="mb-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#7CFF4F]/10 flex items-center justify-center text-2xl shadow-[0_0_20px_#7CFF4F30]">
            🎓
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Course Outline Generator
            </h1>
            <p className="text-gray-400 text-sm">
              AI Playground · Generate a week-by-week course outline
            </p>
          </div>
        </div>

        <AiPlaygroundNav />

        {/* MAIN CARD */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={submit} className="space-y-6">
            {/* ROW 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`${lbl} text-gray-300`}>Course Title *</label>
                <input
                  className={`${inp} bg-black border border-white/10 text-white focus:border-[#7CFF4F] focus:ring-1 focus:ring-[#7CFF4F]/40`}
                  required
                  value={form.course_title}
                  onChange={set("course_title")}
                  placeholder="e.g. Introduction to Machine Learning"
                />
              </div>

              <div>
                <label className={`${lbl} text-gray-300`}>Subject *</label>
                <input
                  className={`${inp} bg-black border border-white/10 text-white focus:border-[#7CFF4F] focus:ring-1 focus:ring-[#7CFF4F]/40`}
                  required
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`${lbl} text-gray-300`}>
                  Duration (weeks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  className={`${inp} bg-black border border-white/10 text-white focus:border-[#7CFF4F] focus:ring-1 focus:ring-[#7CFF4F]/40`}
                  value={form.duration_weeks}
                  onChange={set("duration_weeks")}
                />
              </div>

              <div>
                <label className={`${lbl} text-gray-300`}>Target Level</label>
                <select
                  className={`${inp} bg-black border border-white/10 text-white focus:border-[#7CFF4F] focus:ring-1 focus:ring-[#7CFF4F]/40`}
                  value={form.target_level}
                  onChange={set("target_level")}
                >
                  <div className="text-black">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </div>
                </select>
              </div>
            </div>

            {/* TEXTAREA */}
            <div>
              <label className={`${lbl} text-gray-300`}>
                Learning Objectives (optional)
              </label>
              <textarea
                className={`${inp} bg-black border border-white/10 text-white resize-none focus:border-[#7CFF4F] focus:ring-1 focus:ring-[#7CFF4F]/40`}
                rows={4}
                value={form.learning_objectives}
                onChange={set("learning_objectives")}
                placeholder="e.g. Understand ML algorithms, build projects..."
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#7CFF4F] text-black font-bold text-sm transition-all duration-300 hover:shadow-[0_0_25px_#7CFF4F] hover:scale-[1.02] active:scale-95"
            >
              {loading ? "Generating..." : "Generate Outline"}
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
