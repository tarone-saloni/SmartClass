import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AiPlaygroundNav from "../../components/AiPlaygroundNav";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, ResponseBox } from "../../utils/aiShared";

export default function AiSummarize() {
  const [form, setForm] = useState({ content: "", style: "bullet-points" });
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
      setRes(await post("/summarize", form));
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
            <span className="text-4xl">📋</span>
            <h1 className="text-3xl font-black text-[var(--text)]">
              Summarize
            </h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Condense course material into clear summaries
          </p>
        </div>

        <AiPlaygroundNav />

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className={lbl}>Content to Summarize *</label>
              <textarea
                className={`${inp} resize-none`}
                rows={8}
                required
                value={form.content}
                onChange={set("content")}
                placeholder="Paste your course material, lecture notes, or text here…"
              />
            </div>
            <div>
              <label className={lbl}>Summary Style</label>
              <select
                className={inp}
                value={form.style}
                onChange={set("style")}
              >
                <option value="bullet-points">Bullet Points</option>
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
                <option value="key-concepts">Key Concepts</option>
              </select>
            </div>
            <SendBtn loading={loading} label="Summarize" />
            <ResponseBox data={res} error={error} />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
