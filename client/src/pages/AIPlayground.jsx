import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { apiFetch } from "../utils/api.js";

const inp =
  "w-full px-4 py-3 border border-[var(--border)]/50 rounded-xl text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all duration-300 glass text-[var(--text)] placeholder:text-[var(--muted)]/50 hover:border-[var(--accent)]/30";
const lbl =
  "block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5";

async function post(path, body) {
  const res = await apiFetch(`/api/ai${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function SendBtn({ loading, label = "Send" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Thinking…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function ResponseBox({ data, error }) {
  if (error)
    return (
      <div className="mt-4 p-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-400 text-sm font-mono">
        Error: {error}
      </div>
    );
  if (!data) return null;
  return (
    <div className="mt-4 glass rounded-2xl border border-[var(--border)]/40 overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border)]/30 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
          Response
        </span>
      </div>
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        <ResponseRenderer data={data} />
      </div>
    </div>
  );
}

function ResponseRenderer({ data }) {
  // Quiz response — render as structured cards
  if (data.questions && Array.isArray(data.questions)) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
          {data.count} questions · {data.topic} · {data.difficulty}
        </p>
        {data.questions.map((q, i) => (
          <div
            key={i}
            className="border border-[var(--border)]/40 rounded-xl p-4 space-y-3"
          >
            <p className="font-semibold text-sm text-[var(--text)]">
              <span className="text-[var(--accent)] mr-2">Q{i + 1}.</span>
              {q.question}
            </p>
            <ul className="space-y-1.5">
              {q.options.map((opt, j) => (
                <li
                  key={j}
                  className={`text-sm px-3 py-1.5 rounded-lg ${
                    j === q.correct_answer
                      ? "bg-green-500/15 text-green-400 font-semibold border border-green-500/30"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {String.fromCharCode(65 + j)}. {opt}
                </li>
              ))}
            </ul>
            {q.explanation && (
              <p className="text-xs text-[var(--muted)] bg-[var(--border)]/10 rounded-lg px-3 py-2">
                💡 {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Agent response — show tools used + main response
  if (data.tools_used !== undefined) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {data.tools_used.map((t, i) => (
            <span
              key={i}
              className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                t.success
                  ? "border-green-500/30 text-green-400 bg-green-500/10"
                  : "border-red-400/30 text-red-400 bg-red-500/10"
              }`}
            >
              {t.success ? "✓" : "✗"} {t.tool}
            </span>
          ))}
          <span className="text-xs px-3 py-1 rounded-full border border-[var(--border)]/40 text-[var(--muted)]">
            {data.iterations} iteration{data.iterations !== 1 ? "s" : ""}
          </span>
        </div>
        <MarkdownText text={data.response} />
      </div>
    );
  }

  // Generic text fields
  const textKey =
    data.response ||
    data.feedback ||
    data.summary ||
    data.explanation ||
    data.study_plan ||
    data.analysis ||
    data.outline;

  if (textKey) return <MarkdownText text={textKey} />;

  // Fallback: JSON
  return (
    <pre className="text-xs text-[var(--text)] whitespace-pre-wrap font-mono leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function MarkdownText({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-[var(--text)] mt-4 mb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-[var(--text)] mt-4 mb-1">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-bold text-[var(--accent)] mt-3 mb-1">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-[var(--text)] mt-2 mb-1">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-[var(--text)] mb-2">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--text)]">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-[var(--muted)]">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="list-none space-y-1 my-2 pl-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-2 pl-2 text-sm text-[var(--text)]">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-[var(--text)] flex gap-2 items-start">
            <span className="text-[var(--accent)] mt-0.5 shrink-0">•</span>
            <span>{children}</span>
          </li>
        ),
        code: ({ className, children }) =>
          className ? (
            <code
              className={`text-xs font-mono text-[var(--text)] leading-relaxed whitespace-pre-wrap ${className}`}
            >
              {children}
            </code>
          ) : (
            <code className="px-1.5 py-0.5 rounded bg-[var(--border)]/30 text-[var(--accent)] text-xs font-mono">
              {children}
            </code>
          ),
        pre: ({ children }) => (
          <pre className="my-3 p-4 rounded-xl bg-[var(--border)]/20 border border-[var(--border)]/40 overflow-x-auto text-xs font-mono leading-relaxed">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-2 pl-4 border-l-4 border-[var(--accent)]/50 text-[var(--muted)] italic text-sm">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[var(--border)]/20">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border border-[var(--border)]/30">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-[var(--text)] border border-[var(--border)]/20">
            {children}
          </td>
        ),
        hr: () => <hr className="my-4 border-[var(--border)]/30" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ─────────────────────────── TABS ────────────────────────────

function ChatTab() {
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
    <div className="flex flex-col h-full gap-4">
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
          onClick={() => {
            setMessages([]);
            setError("");
          }}
          className="self-end px-4 py-3 rounded-xl border border-[var(--border)]/50 text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-400/40 transition-all"
        >
          Clear
        </button>
      </div>

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
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--accent)] text-white rounded-br-sm"
                  : "glass border border-[var(--border)]/40 text-[var(--text)] rounded-bl-sm"
              }`}
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
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

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
  );
}

function QuizTab() {
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
  );
}

function SummarizeTab() {
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
        <select className={inp} value={form.style} onChange={set("style")}>
          <option value="bullet-points">Bullet Points</option>
          <option value="concise">Concise</option>
          <option value="detailed">Detailed</option>
          <option value="key-concepts">Key Concepts</option>
        </select>
      </div>
      <SendBtn loading={loading} label="Summarize" />
      <ResponseBox data={res} error={error} />
    </form>
  );
}

function FeedbackTab() {
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
  );
}

function StudyPlanTab() {
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
        <label className={lbl}>Enrolled Courses * (comma-separated)</label>
        <input
          className={inp}
          required
          value={form.enrolled_courses}
          onChange={set("enrolled_courses")}
          placeholder="e.g. Data Structures, Web Development, Machine Learning"
        />
      </div>
      <div>
        <label className={lbl}>Weak Areas (comma-separated, optional)</label>
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
  );
}

function ExplainTab() {
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
  );
}

function PerformanceTab() {
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
        <label className={lbl}>Quiz Scores (comma-separated, optional)</label>
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
  );
}

function CourseOutlineTab() {
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
  );
}

function AgentTab() {
  const [task, setTask] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");

  const EXAMPLES = [
    "Generate a 5-question quiz on recursion AND create a study plan for a student weak in algorithms who has 10 hours per week",
    "Summarize this content then generate quiz questions from the summary: [paste content here]",
    "Analyze student performance: subject=Math, quiz scores=72,65,80, assignment grades=78,85, progress=60%",
    "Create a complete 8-week course outline for Introduction to Web Development",
    "Explain recursion at beginner level and also generate 3 easy practice questions",
  ];

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
          placeholder={
            '{ "student_name": "Alex", "course": "Data Structures" }'
          }
        />
      </div>
      <SendBtn loading={loading} label="Run Agent" />
      <ResponseBox data={res} error={error} />
    </form>
  );
}

// ─────────────────────────── MAIN ────────────────────────────

const TABS = [
  { id: "chat", label: "Chat", icon: "💬", component: ChatTab },
  { id: "quiz", label: "Quiz Generator", icon: "📝", component: QuizTab },
  { id: "summarize", label: "Summarize", icon: "📋", component: SummarizeTab },
  { id: "feedback", label: "Feedback", icon: "✅", component: FeedbackTab },
  {
    id: "study-plan",
    label: "Study Plan",
    icon: "📅",
    component: StudyPlanTab,
  },
  { id: "explain", label: "Explain", icon: "💡", component: ExplainTab },
  {
    id: "performance",
    label: "Performance",
    icon: "📊",
    component: PerformanceTab,
  },
  {
    id: "course-outline",
    label: "Course Outline",
    icon: "🎓",
    component: CourseOutlineTab,
  },
  { id: "agent", label: "Agent", icon: "🤖", component: AgentTab },
];

export default function AIPlayground() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activePage = TABS.find((t) => t.id === tab) ?? TABS[0];
  const ActiveComponent = activePage.component;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-4xl">{activePage.icon}</span>
              <h1 className="text-3xl font-black text-[var(--text)]">
                {activePage.label}
              </h1>
            </div>
            <p className="text-[var(--muted)] text-sm ml-1">
              AI Playground · Agent server must be running on{" "}
              <code className="px-1.5 py-0.5 rounded bg-[var(--border)]/30 font-mono text-xs text-[var(--accent)]">
                localhost:8000
              </code>
            </p>
          </div>

          {/* Quick-jump pill nav */}
          <div className="flex-shrink-0 hidden md:flex flex-wrap gap-1 justify-end max-w-xs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/ai-playground/${t.id}`)}
                title={t.label}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer whitespace-nowrap
                  ${
                    activePage.id === t.id
                      ? "bg-[var(--accent)] text-white"
                      : "glass border border-[var(--border)]/40 text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
              >
                <span>{t.icon}</span>
                <span className="hidden lg:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="glass-heavy rounded-2xl border border-[var(--border)]/40 p-6 shadow-xl">
          <ActiveComponent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
