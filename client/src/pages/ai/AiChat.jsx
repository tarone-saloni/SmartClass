import { useState, useRef, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AiPlaygroundNav from "../../components/AiPlaygroundNav";
import { post, inp, lbl } from "../../utils/aiUtils";
import { SendBtn, MarkdownText } from "../../utils/aiShared";

export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [role, setRole] = useState("student");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const data = await post("/chat", {
        message: userMsg.content,
        history: messages,
        user_role: role,
        course_context: context || undefined,
      });
      setMessages([
        ...newHistory,
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-4xl">💬</span>
            <h1 className="text-3xl font-black text-[var(--text)]">Chat</h1>
          </div>
          <p className="text-[var(--muted)] text-sm ml-1">
            AI Playground · Multi-turn conversation assistant
          </p>
        </div>

        <AiPlaygroundNav />

        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl flex flex-col gap-4 flex-1">
          {/* Controls */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={lbl}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inp}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <div className="flex-[2]">
              <label className={lbl}>Course Context (optional)</label>
              <input
                className={inp}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Data Structures"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setError("");
              }}
              className="self-end px-4 py-3 rounded-xl border border-[var(--border)]/50 text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-400/40 transition-all"
            >
              Clear
            </button>
          </div>

          {/* Message area */}
          <div className="glass rounded-2xl border border-[var(--border)]/40 flex-1 min-h-[300px] max-h-[50vh] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-[var(--muted)] text-sm mt-8">
                Start a conversation with the AI assistant…
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--accent)] text-white rounded-br-sm" : "glass border border-[var(--border)]/40 text-[var(--text)] rounded-bl-sm"}`}
                >
                  {m.role === "assistant" ? (
                    <MarkdownText text={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass border border-[var(--border)]/40 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex gap-3">
            <input
              className={`${inp} flex-1`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything educational…"
            />
            <SendBtn loading={loading} label="Send" />
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
