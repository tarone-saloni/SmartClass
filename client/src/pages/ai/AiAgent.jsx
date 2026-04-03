import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AiPlaygroundNav from "../../components/AiPlaygroundNav";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, ResponseBox } from "../../utils/aiShared";

const EXAMPLES = [
  "Generate a 5-question quiz on recursion AND create a study plan for a student weak in algorithms who has 10 hours per week",
  "Summarize this content then generate quiz questions from the summary: [paste content here]",
  "Analyze student performance: subject=Math, quiz scores=72,65,80, assignment grades=78,85, progress=60%",
  "Create a complete 8-week course outline for Introduction to Web Development",
  "Explain recursion at beginner level and also generate 3 easy practice questions",
];

export default function AiAgent() {
  const [task, setTask] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRes(null);
    let ctx = {};
    if (context.trim()) {
      try {
        ctx = JSON.parse(context);
      } catch {
        setError("Context must be valid JSON (or leave empty)");
        setLoading(false);
        return;
      }
    }
    try {
      setRes(await post("/agent", { task, context: ctx }));
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
            <span className="text-4xl">🤖</span>
            <h1 className="text-3xl font-black text-[var(--text)]">Agent</h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Multi-tool agentic workflow for complex tasks
          </p>
        </div>

        <AiPlaygroundNav />

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <form onSubmit={submit} className="space-y-4">
            <div className="p-4 glass rounded-xl border border-[var(--accent)]/20 space-y-2">
              <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                Example Tasks — click to use
              </p>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTask(ex)}
                  className="block w-full text-left text-xs text-[var(--muted)] hover:text-[var(--text)] px-3 py-2 rounded-lg hover:bg-[var(--accent)]/10 transition-all truncate"
                >
                  → {ex}
                </button>
              ))}
            </div>
            <div>
              <label className={lbl}>Task *</label>
              <textarea
                className={`${inp} resize-none`}
                rows={4}
                required
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Describe what you want the AI agent to do…"
              />
            </div>
            <div>
              <label className={lbl}>Context (JSON, optional)</label>
              <textarea
                className={`${inp} resize-none font-mono text-xs`}
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder='{ "student_name": "Alex", "course": "Data Structures" }'
              />
            </div>
            <SendBtn loading={loading} label="Run Agent" />
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
