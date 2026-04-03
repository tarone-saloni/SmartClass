import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// Shared dashboard card style
const dashCard =
  "border-2 border-emerald-200 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105";
const dashCardSoft = "bg-white/95 border-emerald-200";
const dashCardGradientCool =
  "bg-gradient-to-br from-blue-50 via-sky-50 to-emerald-50";
const dashCardText = "text-black";

const inputCls =
  "w-full px-4 py-3 border border-[var(--border)]/50 rounded-xl text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 focus:shadow-[0_4px_16px_-4px_var(--accent)] transition-all duration-300 glass text-[var(--text)] placeholder:text-[var(--muted)]/50 hover:border-[var(--accent)]/30";

function AiResultView({ data }) {
  // Quiz — structured cards
  if (data.questions && Array.isArray(data.questions)) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          {data.count} questions · {data.topic} · {data.difficulty}
        </p>
        {data.questions.map((q, i) => (
          <div
            key={i}
            className="border border-[var(--border)]/40 rounded-xl p-3 space-y-2"
          >
            <p className="font-semibold text-sm text-[var(--text)]">
              <span className="text-[var(--accent)] mr-1.5">Q{i + 1}.</span>
              {q.question}
            </p>
            <ul className="space-y-1">
              {q.options.map((opt, j) => (
                <li
                  key={j}
                  className={`text-xs px-2.5 py-1.5 rounded-lg ${j === q.correct_answer ? "bg-green-500/15 text-green-400 font-semibold border border-green-500/30" : "text-[var(--muted)]"}`}
                >
                  {String.fromCharCode(65 + j)}. {opt}
                </li>
              ))}
            </ul>
            {q.explanation && (
              <p className="text-xs text-[var(--muted)] bg-[var(--border)]/10 rounded-lg px-2.5 py-1.5">
                💡 {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }
  // Agent response
  if (data.tools_used !== undefined) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {data.tools_used.map((t, i) => (
            <span
              key={i}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${t.success ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-red-400/30 text-red-400 bg-red-500/10"}`}
            >
              {t.success ? "✓" : "✗"} {t.tool}
            </span>
          ))}
        </div>
        <AiMarkdown text={data.response} />
      </div>
    );
  }
  const text =
    data.outline ||
    data.feedback ||
    data.response ||
    data.summary ||
    data.explanation ||
    data.study_plan ||
    data.analysis;
  if (text) return <AiMarkdown text={text} />;
  return (
    <pre className="text-xs text-[var(--text)] whitespace-pre-wrap font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function AiMarkdown({ text }) {
  return (
    <div className="space-y-1 text-sm leading-relaxed text-[var(--text)]">
      {text.split("\n").map((line, i) => {
        if (/^### (.+)/.test(line))
          return (
            <h3
              key={i}
              className="font-bold text-[var(--accent)] mt-3 mb-0.5 text-sm"
            >
              {line.replace(/^### /, "")}
            </h3>
          );
        if (/^## (.+)/.test(line))
          return (
            <h2 key={i} className="font-bold text-[var(--text)] mt-3 mb-0.5">
              {line.replace(/^## /, "")}
            </h2>
          );
        if (/^[-*] /.test(line))
          return (
            <p
              key={i}
              className="pl-3 before:content-['•'] before:mr-2 before:text-[var(--accent)]"
            >
              {line.replace(/^[-*] /, "")}
            </p>
          );
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i}>
            {line
              .split(/\*\*(.+?)\*\*/)
              .map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
              )}
          </p>
        );
      })}
    </div>
  );
}

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-heavy border border-[var(--border)]/40 rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="font-bold text-[var(--text)] mb-2 text-xs uppercase tracking-wider">
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: <span className="font-black">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    courses: [],
    totalStudents: 0,
    totalCourses: 0,
    pendingSubmissions: 0,
    upcomingClasses: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", subject: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AI state
  const [aiModal, setAiModal] = useState(null); // 'quiz' | 'outline' | 'agent'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [quizForm, setQuizForm] = useState({
    topic: "",
    num_questions: 5,
    difficulty: "medium",
    content: "",
  });
  const [outlineForm, setOutlineForm] = useState({
    course_title: "",
    subject: "",
    duration_weeks: 8,
    target_level: "intermediate",
    learning_objectives: "",
  });
  const [agentTask, setAgentTask] = useState("");
  const aiResultRef = useRef(null);

  // Quiz edit & save state
  const [editableQuestions, setEditableQuestions] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizSaved, setQuizSaved] = useState(null); // saved quiz response
  const [saveTargetCourseId, setSaveTargetCourseId] = useState(""); // for saving when no course pre-selected

  // Outline save state
  const [outlineSaving, setOutlineSaving] = useState(false);
  const [outlineSaved, setOutlineSaved] = useState(null);
  const [savedOutlines, setSavedOutlines] = useState([]);

  // Course Content Manager state
  const [aiCourse, setAiCourse] = useState(null); // course object for AI modal context
  const [contentCourse, setContentCourse] = useState(""); // selected course ID
  const [manageTab, setManageTab] = useState("quizzes");
  const [courseQuizzes, setCourseQuizzes] = useState([]);
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  // Manual quiz builder
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualQs, setManualQs] = useState([
    { question: "", options: ["", "", "", ""], correct_answer: 0 },
  ]);
  const [quizBuilding, setQuizBuilding] = useState(false);
  // Assignment builder
  const [showAssignBuilder, setShowAssignBuilder] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxScore: 100,
  });
  const [assignBuilding, setAssignBuilding] = useState(false);
  const [assignAiLoading, setAssignAiLoading] = useState(false);
  // Class agenda AI
  const [agendaForm, setAgendaForm] = useState({
    topic: "",
    duration_minutes: 60,
    course_title: "",
  });

  const openAiModal = (type, course = null) => {
    setAiModal(type);
    setAiResult(null);
    setAiError("");
    setQuizSaved(null);
    setOutlineSaved(null);
    setEditableQuestions([]);
    setAiCourse(course);
    if (type === "quiz" && course) {
      setQuizForm((f) => ({ ...f, topic: course.title, content: "" }));
      setSaveTargetCourseId(course.id || "");
      setQuizTitle(`${course.title} — AI Quiz`);
    } else {
      setSaveTargetCourseId("");
      setQuizTitle("");
    }
    if (type === "outline" && course) {
      setOutlineForm((f) => ({
        ...f,
        course_title: course.title,
        subject: course.subject || "",
      }));
    }
    if (type === "outline") {
      apiFetch(`/api/ai/teachers/${user.id}/outlines`, {
        credentials: "include",
      })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setSavedOutlines(d))
        .catch(() => {});
    }
    if (type === "class-agenda" && course) {
      setAgendaForm((f) => ({ ...f }));
    }
  };

  const closeAiModal = () => {
    setAiModal(null);
    setAiResult(null);
    setAiError("");
    setEditableQuestions([]);
    setQuizSaved(null);
    setOutlineSaved(null);
  };

  async function aiPost(path, body, method = "POST") {
    const res = await apiFetch(`/api/ai${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  const runAi = async (path, body) => {
    setAiLoading(true);
    setAiResult(null);
    setAiError("");
    setEditableQuestions([]);
    setQuizSaved(null);
    setOutlineSaved(null);
    try {
      const data = await aiPost(path, body);
      setAiResult(data);
      // If quiz — populate editable questions
      if (data.questions) {
        setEditableQuestions(data.questions.map((q) => ({ ...q })));
        if (!quizTitle) setQuizTitle(`${quizForm.topic} Quiz`);
      }
      setTimeout(
        () => aiResultRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const saveQuiz = async () => {
    const courseId = saveTargetCourseId || aiCourse?.id;
    if (!courseId) {
      setAiError("Select a course to save this quiz to.");
      return;
    }
    if (!quizTitle.trim()) {
      setAiError("Quiz title is required.");
      return;
    }
    setQuizSaving(true);
    setAiError("");
    try {
      const saved = await aiPost(`/courses/${courseId}/save-quiz`, {
        title: quizTitle,
        questions: editableQuestions,
        teacherId: user.id,
      });
      setQuizSaved(saved);
      load(); // refresh dashboard counts
    } catch (err) {
      setAiError(err.message);
    } finally {
      setQuizSaving(false);
    }
  };

  const saveOutline = async () => {
    setOutlineSaving(true);
    setAiError("");
    try {
      const saved = await aiPost(`/teachers/${user.id}/outlines/save`, {
        content: aiResult.outline,
        courseTitle: outlineForm.course_title,
        subject: outlineForm.subject,
        durationWeeks: Number(outlineForm.duration_weeks),
        targetLevel: outlineForm.target_level,
        courseId: aiCourse?.id || undefined,
      });
      setOutlineSaved(saved);
      setSavedOutlines((prev) => [saved, ...prev]);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setOutlineSaving(false);
    }
  };

  const deleteOutline = async (id) => {
    try {
      await aiPost(`/outlines/${id}`, { teacherId: user.id }, "DELETE");
      setSavedOutlines((prev) => prev.filter((o) => o.id !== id));
    } catch {
      /* silent */
    }
  };

  // ── Course Content Manager functions ──────────────────────────────────────
  const loadContent = async (courseId) => {
    if (!courseId) {
      setCourseQuizzes([]);
      setCourseAssignments([]);
      return;
    }
    setContentLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        apiFetch(`/api/courses/${courseId}/quizzes`, {
          credentials: "include",
        }),
        apiFetch(`/api/courses/${courseId}/assignments`, {
          credentials: "include",
        }),
      ]);
      const [qData, aData] = await Promise.all([qRes.json(), aRes.json()]);
      if (Array.isArray(qData)) setCourseQuizzes(qData);
      if (Array.isArray(aData)) setCourseAssignments(aData);
    } catch {
      /* silent */
    } finally {
      setContentLoading(false);
    }
  };

  const toggleQuizActive = async (quiz) => {
    try {
      const res = await apiFetch(`/api/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !quiz.isActive, teacherId: user.id }),
      });
      const updated = await res.json();
      if (res.ok)
        setCourseQuizzes((prev) =>
          prev.map((q) =>
            q.id === quiz.id ? { ...q, isActive: updated.isActive } : q,
          ),
        );
    } catch {
      /* silent */
    }
  };

  const deleteQuizFromCourse = async (id) => {
    if (!window.confirm("Delete this quiz and all student results?")) return;
    try {
      await apiFetch(`/api/quizzes/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teacherId: user.id }),
      });
      setCourseQuizzes((prev) => prev.filter((q) => q.id !== id));
      load();
    } catch {
      /* silent */
    }
  };

  const createManualQuiz = async () => {
    if (!manualTitle.trim() || !contentCourse) return;
    if (
      manualQs.some(
        (q) => !q.question.trim() || q.options.some((o) => !o.trim()),
      )
    ) {
      alert("Fill in all question texts and options.");
      return;
    }
    setQuizBuilding(true);
    try {
      const res = await apiFetch(`/api/courses/${contentCourse}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: manualTitle,
          teacherId: user.id,
          questions: manualQs.map((q) => ({
            question: q.question,
            options: q.options,
            correctOption: q.correct_answer,
            points: 1,
          })),
        }),
      });
      const newQuiz = await res.json();
      if (res.ok) {
        setCourseQuizzes((prev) => [newQuiz, ...prev]);
        setShowQuizBuilder(false);
        setManualTitle("");
        setManualQs([
          { question: "", options: ["", "", "", ""], correct_answer: 0 },
        ]);
        load();
      }
    } catch {
      /* silent */
    } finally {
      setQuizBuilding(false);
    }
  };

  const deleteAssignmentFromCourse = async (id) => {
    if (!window.confirm("Delete this assignment and all submissions?")) return;
    try {
      await apiFetch(`/api/assignments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teacherId: user.id }),
      });
      setCourseAssignments((prev) => prev.filter((a) => a.id !== id));
      load();
    } catch {
      /* silent */
    }
  };

  const createAssignmentInCourse = async () => {
    if (!assignForm.title.trim() || !contentCourse) return;
    setAssignBuilding(true);
    try {
      const res = await apiFetch(`/api/courses/${contentCourse}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...assignForm,
          maxScore: Number(assignForm.maxScore),
          teacherId: user.id,
        }),
      });
      const newAss = await res.json();
      if (res.ok) {
        setCourseAssignments((prev) => [newAss, ...prev]);
        setShowAssignBuilder(false);
        setAssignForm({
          title: "",
          description: "",
          dueDate: "",
          maxScore: 100,
        });
        load();
      }
    } catch {
      /* silent */
    } finally {
      setAssignBuilding(false);
    }
  };

  const generateAssignDesc = async () => {
    const course = data.courses.find((c) => c.id === contentCourse);
    if (!assignForm.title || !contentCourse) {
      alert("Enter a title first.");
      return;
    }
    setAssignAiLoading(true);
    try {
      const res = await apiFetch("/api/ai/generate-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          course_title: course?.title || "",
          topic: assignForm.title,
        }),
      });
      const d = await res.json();
      if (d.response) setAssignForm((f) => ({ ...f, description: d.response }));
    } catch {
      /* silent */
    } finally {
      setAssignAiLoading(false);
    }
  };

  const updateManualQ = (qi, field, val) =>
    setManualQs((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, [field]: val } : q)),
    );

  const updateManualOpt = (qi, oi, val) =>
    setManualQs((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const opts = [...q.options];
        opts[oi] = val;
        return { ...q, options: opts };
      }),
    );

  const updateQuestion = (qi, field, value) => {
    setEditableQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, [field]: value } : q)),
    );
  };

  const updateOption = (qi, oi, value) => {
    setEditableQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const opts = [...q.options];
        opts[oi] = value;
        return { ...q, options: opts };
      }),
    );
  };

  const load = () =>
    apiFetch(`/api/teachers/${user.id}/dashboard`)
      .then((r) => r.json())
      .then((d) => !d.error && setData(d));

  useEffect(() => {
    load();
  }, [user.id]);

  const openCreate = () => {
    setEditCourse(null);
    setForm({ title: "", description: "", subject: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (e, c) => {
    e.stopPropagation();
    setEditCourse(c);
    setForm({
      title: c.title,
      description: c.description || "",
      subject: c.subject || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const isEdit = !!editCourse;
      const res = await apiFetch(
        isEdit ? `/api/courses/${editCourse.id}` : "/api/courses",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...form, teacherId: user.id }),
        },
      );
      const json = await res.json();
      if (res.ok) {
        setShowModal(false);
        setForm({ title: "", description: "", subject: "" });
        load();
      } else {
        setError(json.error || "Failed to save course.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await apiFetch(`/api/courses/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teacherId: user.id }),
      });
      setConfirmDelete(null);
      load();
    } catch {
      setConfirmDelete(null);
    }
  };

  const totalMaterials = data.courses.reduce(
    (s, c) => s + (c.materialCount || 0),
    0,
  );
  const totalQuizzes = data.courses.reduce((s, c) => s + (c.quizCount || 0), 0);

  const stats = [
    {
      icon: "📚",
      val: data.totalCourses,
      label: "Courses",
      bg: "from-blue-500/15 to-blue-600/5",
      color: "from-blue-500 to-blue-600",
      shadow: "rgba(99,102,241,0.3)",
    },
    {
      icon: "👨‍🎓",
      val: data.totalStudents,
      label: "Students",
      bg: "from-purple-500/15 to-purple-600/5",
      color: "from-purple-500 to-purple-600",
      shadow: "rgba(139,92,246,0.3)",
    },
    {
      icon: "📄",
      val: totalMaterials,
      label: "Materials",
      bg: "from-amber-500/15 to-amber-600/5",
      color: "from-amber-500 to-amber-600",
      shadow: "rgba(245,158,11,0.3)",
    },
    {
      icon: "🧠",
      val: totalQuizzes,
      label: "Quizzes",
      bg: "from-pink-500/15 to-pink-600/5",
      color: "from-pink-500 to-pink-600",
      shadow: "rgba(236,72,153,0.3)",
    },
    {
      icon: "📬",
      val: data.pendingSubmissions ?? 0,
      label: "Reviews",
      bg: "from-emerald-500/15 to-emerald-600/5",
      color: "from-emerald-500 to-emerald-600",
      shadow: "rgba(16,185,129,0.3)",
    },
    {
      icon: "📹",
      val: data.upcomingClasses?.length ?? 0,
      label: "Live",
      bg: "from-indigo-500/15 to-indigo-600/5",
      color: "from-indigo-500 to-indigo-600",
      shadow: "rgba(99,102,241,0.3)",
    },
  ];

  // Chart data
  const enrollmentData = data.courses.map((c) => ({
    name: c.title.length > 14 ? c.title.slice(0, 14) + "…" : c.title,
    Students: c.enrollmentCount || 0,
  }));

  const contentData = data.courses.map((c) => ({
    name: c.title.length > 14 ? c.title.slice(0, 14) + "…" : c.title,
    Materials: c.materialCount || 0,
    Quizzes: c.quizCount || 0,
    Assignments: c.assignmentCount || 0,
  }));

  const subjectMap = {};
  data.courses.forEach((c) => {
    const key = c.subject || "Other";
    subjectMap[key] = (subjectMap[key] || 0) + 1;
  });
  const pieData = Object.entries(subjectMap).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 z-10">
        {/* Header */}
        <div className="mb-10 animate-[slide-down_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="flex items-center gap-5 mb-2">
            <div className="text-5xl sm:text-6xl drop-shadow-lg animate-float">
              👋
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] sc-title">
                Welcome back,{" "}
                <span className="gradient-text">{user.name.split(" ")[0]}</span>
                !
              </h1>
              <p className="text-sm font-medium text-[var(--muted)] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Manage your courses, track student progress, and inspire the
                future.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 bg-gradient-to-br from-emerald-200 to-emerald-300 text-black shadow-lg transition-all duration-500">
                <span className="text-sm">{s.icon}</span>
              </div>
              <div
                className="text-3xl font-extrabold text-black mb-1 tracking-tighter"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                {s.val}
              </div>
              <p className="text-[9px] font-bold text-black/70 uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Analytics Charts — only shown when there are courses */}
        {data.courses.length > 0 && (
          <div
            className="mb-12 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ animationDelay: "150ms" }}
          >
            <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6 flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl">
                📈
              </span>
              Analytics Overview
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Enrollment bar chart */}
              <div className="lg:col-span-2 sc-card-premium glass rounded-2xl p-6">
                <p className="text-sm font-bold text-[var(--text)] mb-1">
                  Student Enrollment per Course
                </p>
                <p className="text-xs text-[var(--muted)] mb-5">
                  How many students are enrolled in each course
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={enrollmentData} barCategoryGap="35%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 10,
                        fill: "var(--muted)",
                        fontWeight: 600,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }}
                    />
                    <Bar
                      dataKey="Students"
                      radius={[6, 6, 0, 0]}
                      fill="url(#enrollGrad)"
                    />
                    <defs>
                      <linearGradient
                        id="enrollGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop
                          offset="100%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Subject distribution pie chart */}
              <div className="sc-card-premium glass rounded-2xl p-6">
                <p className="text-sm font-bold text-[var(--text)] mb-1">
                  Course Subjects
                </p>
                <p className="text-xs text-[var(--muted)] mb-4">
                  Distribution by subject area
                </p>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              fontWeight: 600,
                            }}
                          >
                            {v}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-[var(--muted)] text-sm">
                    No subject data
                  </div>
                )}
              </div>

              {/* Course content stacked bar */}
              <div className="lg:col-span-3 sc-card-premium glass rounded-2xl p-6">
                <p className="text-sm font-bold text-[var(--text)] mb-1">
                  Course Content Breakdown
                </p>
                <p className="text-xs text-[var(--muted)] mb-5">
                  Materials, quizzes, and assignments per course
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={contentData} barCategoryGap="40%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 10,
                        fill: "var(--muted)",
                        fontWeight: 600,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            fontWeight: 600,
                          }}
                        >
                          {v}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="Materials"
                      stackId="a"
                      radius={[0, 0, 0, 0]}
                      fill="#6366f1"
                    />
                    <Bar dataKey="Quizzes" stackId="a" fill="#ec4899" />
                    <Bar
                      dataKey="Assignments"
                      stackId="a"
                      radius={[6, 6, 0, 0]}
                      fill="#f59e0b"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Live Classes */}
        {data.upcomingClasses?.length > 0 && (
          <div
            className="mb-12 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ animationDelay: "200ms" }}
          >
            <h2 className="text-2xl font-extrabold text-[var(--text)] mb-5 flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-xl">
                📹
              </span>
              Upcoming Live Classes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.upcomingClasses.map((lc, i) => (
                <div
                  key={lc.id}
                  className="group sc-card-premium glass rounded-2xl p-6 cursor-pointer hover-lift
                             animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() =>
                    navigate(`/course/${lc.course?.id || lc.course}`)
                  }
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                        lc.status === "live"
                          ? "bg-red-500/15 text-red-500 animate-pulse border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                          : "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25"
                      }`}
                    >
                      {lc.status === "live" ? "🔴 Live Now" : "🗓 Scheduled"}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--muted)]">
                      {new Date(lc.scheduledAt).toLocaleDateString()} ·{" "}
                      {new Date(lc.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors duration-300 line-clamp-2">
                    {lc.title}
                  </p>
                  {lc.course?.title && (
                    <p className="text-xs font-semibold text-[var(--muted)] mt-2">
                      📚 {lc.course.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Tools Section */}
        <div
          className="mb-10 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
          style={{ animationDelay: "250ms" }}
        >
          <h2 className="text-2xl font-extrabold text-[var(--text)] mb-5 flex items-center gap-3 sc-title">
            <span className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl">
              🤖
            </span>
            AI Teaching Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "📝",
                label: "Generate Quiz",
                desc: "Create MCQ questions for any topic with AI",
                action: () => openAiModal("quiz"),
                color: "from-blue-500/15 to-blue-600/5",
                accent: "blue-500",
              },
              {
                icon: "🎓",
                label: "Course Outline",
                desc: "Generate a full week-by-week course plan",
                action: () => openAiModal("outline"),
                color: "from-purple-500/15 to-purple-600/5",
                accent: "purple-500",
              },
              {
                icon: "⚡",
                label: "AI Agent",
                desc: "Multi-step tasks — quiz + outline + more",
                action: () => openAiModal("agent"),
                color: "from-violet-500/15 to-violet-600/5",
                accent: "violet-500",
              },
            ].map((tool) => (
              <button
                key={tool.label}
                onClick={tool.action}
                className={`group sc-card-premium glass rounded-2xl p-5 text-left bg-gradient-to-br ${tool.color} hover-lift active:scale-95 transition-all duration-300 border border-[var(--border)]/30 hover:border-[var(--accent)]/30`}
              >
                <div className="text-3xl mb-3">{tool.icon}</div>
                <p className="text-sm font-extrabold text-[var(--text)] mb-1">
                  {tool.label}
                </p>
                <p className="text-xs text-[var(--muted)] font-medium leading-relaxed">
                  {tool.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Course list header */}
        <div
          className="flex items-center justify-between mb-8 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
          style={{ animationDelay: "300ms" }}
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl">
                🎯
              </span>
              My Courses
            </h2>
            <p className="text-sm font-medium text-[var(--muted)] mt-1 ml-[52px]">
              Click any course to manage it
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 sc-btn-glow
                       rounded-xl text-sm font-bold cursor-pointer active:scale-95"
          >
            <span className="text-lg font-light leading-none">+</span> Create
            Course
          </button>
        </div>

        {data.courses.length === 0 ? (
          <div className="text-center py-24 sc-card-premium glass rounded-3xl animate-[scale-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="text-8xl mb-6 drop-shadow-2xl animate-float">
              📖
            </div>
            <div className="text-2xl font-extrabold mb-3 text-[var(--text)] sc-title">
              No courses yet
            </div>
            <div className="text-base text-[var(--muted)] max-w-sm mx-auto font-medium leading-relaxed">
              Create your first course to begin sharing your knowledge with the
              world.
            </div>
            <button
              onClick={openCreate}
              className="mt-8 px-8 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
            >
              Start Creating
            </button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ animationDelay: "400ms" }}
          >
            {data.courses.map((c, i) => (
              <div
                key={c.id}
                className={`${dashCard} ${dashCardGradientCool} relative overflow-hidden flex flex-col cursor-pointer`}
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => navigate(`/course/${c.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 to-emerald-200/20 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none rounded-2xl" />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Top ribbon */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-200 border border-emerald-400/40 flex items-center justify-center text-lg text-black font-bold shrink-0">
                        📚
                      </div>
                      <h3 className="text-base font-extrabold text-black leading-snug group-hover:text-emerald-700 transition-colors duration-300 line-clamp-2">
                        {c.title}
                      </h3>
                    </div>
                    {c.subject && (
                      <span className="px-2.5 py-1 bg-emerald-500/12 text-emerald-700 rounded-lg text-[9px] uppercase font-bold tracking-wider whitespace-nowrap border border-emerald-300/40 shrink-0">
                        {c.subject}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-[var(--muted)] mb-5 flex-1 line-clamp-2 leading-relaxed">
                    {c.description || "No description provided."}
                  </p>

                  {/* Stats mini-grid */}
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {[
                      {
                        label: "Students",
                        val: c.enrollmentCount || 0,
                        icon: "👨‍🎓",
                      },
                      { label: "Mats", val: c.materialCount || 0, icon: "📄" },
                      {
                        label: "Tasks",
                        val: c.assignmentCount || 0,
                        icon: "📝",
                      },
                      { label: "Live", val: c.liveClassCount || 0, icon: "📹" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-white/90 border border-emerald-200 rounded-xl p-2 text-center transition-all duration-300 hover:border-emerald-300 hover:shadow-sm"
                      >
                        <div className="text-base mb-0.5">{s.icon}</div>
                        <div className="text-sm font-extrabold text-black">
                          {s.val}
                        </div>
                        <div className="text-[8px] font-bold text-black/70 uppercase tracking-wider">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/course/${c.id}`)}
                      className="flex-1 py-2.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
                    >
                      Open →
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAiModal("quiz", c);
                      }}
                      className="px-3 py-2.5 glass hover:bg-violet-500/15 text-violet-400 rounded-xl text-sm
                                 border border-violet-500/20 cursor-pointer transition-all duration-300
                                 hover:border-violet-500/40 active:scale-95"
                      title="Generate AI Quiz"
                    >
                      🤖
                    </button>
                    <button
                      onClick={(e) => openEdit(e, c)}
                      className="px-3 py-2.5 glass hover:bg-[var(--accent)]/10 text-[var(--text)] rounded-xl text-sm
                                 border border-[var(--border)]/40 cursor-pointer transition-all duration-300
                                 hover:border-[var(--accent)]/40 active:scale-95"
                      title="Edit course"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(c);
                      }}
                      className="px-3 py-2.5 bg-red-500/8 hover:bg-red-500/15 text-red-500 rounded-xl text-sm
                                 border border-red-500/20 cursor-pointer transition-all duration-300
                                 hover:border-red-500/40 active:scale-95"
                      title="Delete course"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Course Content Manager ── */}
        {data.courses.length > 0 && (
          <div
            className="mt-12 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ animationDelay: "450ms" }}
          >
            <h2 className="text-2xl font-extrabold text-[var(--text)] mb-5 flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl">
                📋
              </span>
              Course Content Manager
            </h2>

            {/* Course selector */}
            <div className="flex items-center gap-3 mb-6">
              <select
                className={`${inputCls} max-w-sm`}
                value={contentCourse}
                onChange={(e) => {
                  setContentCourse(e.target.value);
                  setManageTab("quizzes");
                  setShowQuizBuilder(false);
                  setShowAssignBuilder(false);
                  loadContent(e.target.value);
                }}
              >
                <option value="">— Select a course —</option>
                {data.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {contentCourse && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      openAiModal(
                        "quiz",
                        data.courses.find((c) => c.id === contentCourse),
                      )
                    }
                    className="px-4 py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-bold hover:bg-violet-500/10 transition-all cursor-pointer flex items-center gap-2"
                  >
                    🤖 AI Quiz
                  </button>
                  <button
                    onClick={() =>
                      openAiModal(
                        "class-agenda",
                        data.courses.find((c) => c.id === contentCourse),
                      )
                    }
                    className="px-4 py-2.5 rounded-xl border border-[var(--border)]/40 text-[var(--accent)] text-sm font-bold hover:bg-[var(--surface)] transition-all cursor-pointer flex items-center gap-2"
                  >
                    📹 Class Agenda
                  </button>
                </div>
              )}
            </div>

            {contentCourse && (
              <div className="sc-card-premium glass rounded-2xl overflow-hidden border border-[var(--border)]/30">
                {/* Tabs */}
                <div className="flex border-b border-[var(--border)]/30">
                  {["quizzes", "assignments"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setManageTab(tab)}
                      className={`flex-1 py-3.5 text-sm font-bold capitalize transition-all cursor-pointer ${manageTab === tab ? "bg-[var(--accent)]/10 text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
                    >
                      {tab === "quizzes"
                        ? `🧠 Quizzes (${courseQuizzes.length})`
                        : `📝 Assignments (${courseAssignments.length})`}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {contentLoading ? (
                    <div className="flex items-center justify-center py-12 text-[var(--muted)]">
                      <span className="w-6 h-6 border-2 border-current/30 border-t-current rounded-full animate-spin mr-3" />
                      Loading…
                    </div>
                  ) : (
                    <>
                      {/* ── QUIZZES ── */}
                      {manageTab === "quizzes" && (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowQuizBuilder(!showQuizBuilder);
                                setShowAssignBuilder(false);
                              }}
                              className="px-4 py-2.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95 flex items-center gap-2"
                            >
                              {showQuizBuilder
                                ? "✕ Cancel"
                                : "+ Create Manually"}
                            </button>
                          </div>

                          {/* Manual quiz builder */}
                          {showQuizBuilder && (
                            <div className="border border-[var(--border)]/40 rounded-xl p-4 space-y-4 glass">
                              <input
                                className={inputCls}
                                placeholder="Quiz Title *"
                                value={manualTitle}
                                onChange={(e) => setManualTitle(e.target.value)}
                              />
                              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                                {manualQs.map((q, qi) => (
                                  <div
                                    key={qi}
                                    className="border border-[var(--border)]/30 rounded-xl p-3 space-y-2"
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="w-6 h-6 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0 mt-2">
                                        Q{qi + 1}
                                      </span>
                                      <textarea
                                        className={`${inputCls} resize-none flex-1`}
                                        rows={2}
                                        placeholder="Question text"
                                        value={q.question}
                                        onChange={(e) =>
                                          updateManualQ(
                                            qi,
                                            "question",
                                            e.target.value,
                                          )
                                        }
                                      />
                                      {manualQs.length > 1 && (
                                        <button
                                          onClick={() =>
                                            setManualQs((p) =>
                                              p.filter((_, i) => i !== qi),
                                            )
                                          }
                                          className="text-red-400 text-xs hover:text-red-300 cursor-pointer px-2 shrink-0 mt-2"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                    <div className="space-y-1.5 pl-8">
                                      {q.options.map((opt, oi) => (
                                        <div
                                          key={oi}
                                          className="flex items-center gap-2"
                                        >
                                          <input
                                            type="radio"
                                            name={`mq-correct-${qi}`}
                                            checked={q.correct_answer === oi}
                                            onChange={() =>
                                              updateManualQ(
                                                qi,
                                                "correct_answer",
                                                oi,
                                              )
                                            }
                                            className="w-4 h-4 accent-[var(--accent)] cursor-pointer shrink-0"
                                            title="Correct answer"
                                          />
                                          <input
                                            className={`${inputCls} text-sm py-2 ${q.correct_answer === oi ? "border-green-500/50 bg-green-500/5" : ""}`}
                                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                            value={opt}
                                            onChange={(e) =>
                                              updateManualOpt(
                                                qi,
                                                oi,
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {q.correct_answer === oi && (
                                            <span className="text-green-400 text-xs shrink-0">
                                              ✓
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                      <p className="text-[10px] text-[var(--muted)]">
                                        Click radio → set correct answer
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    setManualQs((p) => [
                                      ...p,
                                      {
                                        question: "",
                                        options: ["", "", "", ""],
                                        correct_answer: 0,
                                      },
                                    ])
                                  }
                                  className="px-4 py-2 glass border border-[var(--border)]/40 rounded-xl text-sm font-bold cursor-pointer hover:bg-[var(--accent)]/10 transition-all"
                                >
                                  + Add Question
                                </button>
                                <button
                                  onClick={createManualQuiz}
                                  disabled={quizBuilding}
                                  className="flex-1 py-2 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {quizBuilding ? (
                                    <>
                                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      Saving…
                                    </>
                                  ) : (
                                    "💾 Save Quiz"
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quiz list */}
                          {courseQuizzes.length === 0 ? (
                            <p className="text-sm text-[var(--muted)] text-center py-8">
                              No quizzes yet. Create one manually or with AI.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {courseQuizzes.map((q) => (
                                <div
                                  key={q.id}
                                  className={`${dashCardSoft} ${dashCardText} flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200 group`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-black truncate">
                                      {q.title}
                                    </p>
                                    <p className="text-xs text-black/70">
                                      {q.questionCount ??
                                        q.questions?.length ??
                                        0}{" "}
                                      questions ·{" "}
                                      {new Date(
                                        q.createdAt,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => toggleQuizActive(q)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${q.isActive ? "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25" : "bg-[var(--border)]/20 text-[var(--muted)] border-[var(--border)]/30 hover:border-[var(--accent)]/30"}`}
                                    >
                                      {q.isActive ? "● Published" : "○ Draft"}
                                    </button>
                                    <button
                                      onClick={() => deleteQuizFromCourse(q.id)}
                                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100 text-xs"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── ASSIGNMENTS ── */}
                      {manageTab === "assignments" && (
                        <div className="space-y-4">
                          <button
                            onClick={() => {
                              setShowAssignBuilder(!showAssignBuilder);
                              setShowQuizBuilder(false);
                            }}
                            className="px-4 py-2.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
                          >
                            {showAssignBuilder
                              ? "✕ Cancel"
                              : "+ Create Assignment"}
                          </button>

                          {/* Assignment builder */}
                          {showAssignBuilder && (
                            <div className="border border-[var(--border)]/40 rounded-xl p-4 space-y-3 glass">
                              <input
                                className={inputCls}
                                placeholder="Assignment Title *"
                                value={assignForm.title}
                                onChange={(e) =>
                                  setAssignForm((f) => ({
                                    ...f,
                                    title: e.target.value,
                                  }))
                                }
                              />
                              <div className="relative">
                                <textarea
                                  className={`${inputCls} resize-none`}
                                  rows={4}
                                  placeholder="Description (or use AI to generate)"
                                  value={assignForm.description}
                                  onChange={(e) =>
                                    setAssignForm((f) => ({
                                      ...f,
                                      description: e.target.value,
                                    }))
                                  }
                                />
                                <button
                                  onClick={generateAssignDesc}
                                  disabled={assignAiLoading}
                                  className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-bold border border-violet-500/20 hover:bg-violet-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {assignAiLoading ? (
                                    <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                                  ) : (
                                    "🤖"
                                  )}{" "}
                                  Generate
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                                    Due Date
                                  </label>
                                  <input
                                    type="datetime-local"
                                    className={inputCls}
                                    value={assignForm.dueDate}
                                    onChange={(e) =>
                                      setAssignForm((f) => ({
                                        ...f,
                                        dueDate: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                                    Max Score
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    className={inputCls}
                                    value={assignForm.maxScore}
                                    onChange={(e) =>
                                      setAssignForm((f) => ({
                                        ...f,
                                        maxScore: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <button
                                onClick={createAssignmentInCourse}
                                disabled={assignBuilding}
                                className="w-full py-2.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {assignBuilding ? (
                                  <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving…
                                  </>
                                ) : (
                                  "💾 Save Assignment"
                                )}
                              </button>
                            </div>
                          )}

                          {/* Assignment list */}
                          {courseAssignments.length === 0 ? (
                            <p className="text-sm text-black/70 text-center py-8">
                              No assignments yet. Create one above.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {courseAssignments.map((a) => (
                                <div
                                  key={a.id}
                                  className={`${dashCardSoft} ${dashCardText} flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200 group`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-black truncate">
                                      {a.title}
                                    </p>
                                    <p className="text-xs text-black/70">
                                      Max: {a.maxScore}pts
                                      {a.dueDate
                                        ? ` · Due: ${new Date(a.dueDate).toLocaleDateString()}`
                                        : " · No due date"}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      deleteAssignmentFromCourse(a.id)
                                    }
                                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100 text-xs shrink-0"
                                  >
                                    🗑
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setError("");
            }
          }}
        >
          <div
            className="glass-heavy border border-[var(--border)]/50 rounded-2xl p-8 w-full max-w-lg
                          shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)]
                          animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            <h3 className="text-2xl font-extrabold text-[var(--text)] mb-8 flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl">
                📝
              </span>
              {editCourse ? "Edit Course" : "Create New Course"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. Advanced Quantum Mechanics"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1">
                  Subject
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. Physics"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1">
                  Description
                </label>
                <textarea
                  className={`${inputCls} resize-y min-h-[120px]`}
                  placeholder="Describe what students will learn..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              {error && (
                <div
                  className="flex items-center gap-2 text-sm text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 font-medium
                                animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]"
                >
                  <span>⚠️</span> {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]/30">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  className="px-6 py-3 glass hover:bg-[var(--border)]/30 text-[var(--text)] rounded-xl text-sm font-bold
                             border border-[var(--border)]/50 cursor-pointer transition-all duration-300 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 sc-btn-glow disabled:opacity-60 rounded-xl text-sm font-bold
                             cursor-pointer transition-all duration-300 active:scale-95"
                >
                  {loading
                    ? "Saving..."
                    : editCourse
                      ? "Save Changes"
                      : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AI Modal ── */}
      {aiModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeAiModal()}
        >
          <div className="glass-heavy border border-[var(--border)]/50 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)] animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]/30 shrink-0">
              <h3 className="text-lg font-extrabold text-[var(--text)] flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-lg">
                  🤖
                </span>
                {aiModal === "quiz" && "Generate & Save Quiz with AI"}
                {aiModal === "outline" && "AI Course Outline Generator"}
                {aiModal === "agent" && "AI Agent — Multi-step Tasks"}
                {aiModal === "class-agenda" && "AI Live Class Agenda Generator"}
              </h3>
              <button
                onClick={closeAiModal}
                className="w-8 h-8 rounded-lg glass border border-[var(--border)]/40 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* ══ QUIZ ══ */}
              {aiModal === "quiz" && (
                <>
                  {/* Step 1: Generate form — only show when no questions yet */}
                  {editableQuestions.length === 0 && !quizSaved && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        runAi("/generate-quiz", {
                          ...quizForm,
                          num_questions: Number(quizForm.num_questions),
                          content: quizForm.content || undefined,
                        });
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Topic *
                          </label>
                          <input
                            className={inputCls}
                            required
                            value={quizForm.topic}
                            onChange={(e) =>
                              setQuizForm((f) => ({
                                ...f,
                                topic: e.target.value,
                              }))
                            }
                            placeholder="e.g. Recursion, Binary Trees…"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Difficulty
                          </label>
                          <select
                            className={inputCls}
                            value={quizForm.difficulty}
                            onChange={(e) =>
                              setQuizForm((f) => ({
                                ...f,
                                difficulty: e.target.value,
                              }))
                            }
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Questions
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            className={inputCls}
                            value={quizForm.num_questions}
                            onChange={(e) =>
                              setQuizForm((f) => ({
                                ...f,
                                num_questions: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Course Content (optional)
                          </label>
                          <textarea
                            className={`${inputCls} resize-none`}
                            rows={3}
                            placeholder="Paste material to base questions on…"
                            value={quizForm.content}
                            onChange={(e) =>
                              setQuizForm((f) => ({
                                ...f,
                                content: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={aiLoading}
                        className="w-full py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {aiLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating…
                          </>
                        ) : (
                          "Generate Quiz Questions →"
                        )}
                      </button>
                    </form>
                  )}

                  {/* Step 2: Editable questions + Save */}
                  {editableQuestions.length > 0 && !quizSaved && (
                    <div className="space-y-4" ref={aiResultRef}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-green-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          {editableQuestions.length} questions generated —
                          review &amp; edit below
                        </p>
                        <button
                          onClick={() => {
                            setEditableQuestions([]);
                            setAiResult(null);
                          }}
                          className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                        >
                          ← Regenerate
                        </button>
                      </div>

                      {/* Quiz title + course selector */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                            Quiz Title *
                          </label>
                          <input
                            className={inputCls}
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="e.g. Recursion Quiz — Week 3"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                            Save to Course *
                          </label>
                          {aiCourse ? (
                            <div className={`${inputCls} opacity-60`}>
                              {aiCourse.title}
                            </div>
                          ) : (
                            <select
                              className={inputCls}
                              value={saveTargetCourseId}
                              onChange={(e) =>
                                setSaveTargetCourseId(e.target.value)
                              }
                            >
                              <option value="">— Select a course —</option>
                              {data.courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Editable question cards */}
                      <div className="space-y-4 max-h-[42vh] overflow-y-auto pr-1">
                        {editableQuestions.map((q, qi) => (
                          <div
                            key={qi}
                            className="border border-[var(--border)]/40 rounded-xl p-4 space-y-3 glass"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0 mt-0.5">
                                Q{qi + 1}
                              </span>
                              <textarea
                                className={`${inputCls} resize-none flex-1`}
                                rows={2}
                                value={q.question}
                                onChange={(e) =>
                                  updateQuestion(qi, "question", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1.5 pl-10">
                              {q.options.map((opt, oi) => (
                                <div
                                  key={oi}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${qi}`}
                                    checked={q.correct_answer === oi}
                                    onChange={() =>
                                      updateQuestion(qi, "correct_answer", oi)
                                    }
                                    className="w-4 h-4 accent-[var(--accent)] shrink-0 cursor-pointer"
                                    title="Mark as correct answer"
                                  />
                                  <input
                                    className={`${inputCls} text-sm py-2 ${q.correct_answer === oi ? "border-green-500/50 bg-green-500/5" : ""}`}
                                    value={opt}
                                    onChange={(e) =>
                                      updateOption(qi, oi, e.target.value)
                                    }
                                  />
                                  {q.correct_answer === oi && (
                                    <span className="text-green-400 text-xs shrink-0 font-bold">
                                      ✓
                                    </span>
                                  )}
                                </div>
                              ))}
                              <p className="text-[10px] text-[var(--muted)] pt-0.5">
                                Click radio button to set correct answer
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Save button */}
                      {aiError && (
                        <p className="text-red-400 text-sm">{aiError}</p>
                      )}
                      <button
                        onClick={saveQuiz}
                        disabled={quizSaving}
                        className="w-full py-3.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {quizSaving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving to Course…
                          </>
                        ) : (
                          "💾 Save Quiz to Course →"
                        )}
                      </button>
                    </div>
                  )}

                  {/* Step 3: Success */}
                  {quizSaved && (
                    <div className="text-center py-8 space-y-4">
                      <div className="text-5xl">🎉</div>
                      <p className="text-lg font-extrabold text-[var(--text)]">
                        Quiz saved successfully!
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        <strong className="text-[var(--text)]">
                          "{quizSaved.title}"
                        </strong>{" "}
                        · {quizSaved.questionCount} questions added to the
                        course
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() =>
                            navigate(`/course/${quizSaved.course}/quizzes`)
                          }
                          className="px-5 py-2.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
                        >
                          View Quiz →
                        </button>
                        <button
                          onClick={() => {
                            setQuizSaved(null);
                            setEditableQuestions([]);
                            setAiResult(null);
                          }}
                          className="px-5 py-2.5 glass border border-[var(--border)]/40 rounded-xl text-sm font-bold cursor-pointer hover:bg-[var(--accent)]/10 active:scale-95"
                        >
                          Generate Another
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ══ OUTLINE ══ */}
              {aiModal === "outline" && (
                <>
                  {!aiResult && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        runAi("/course-outline", {
                          ...outlineForm,
                          duration_weeks: Number(outlineForm.duration_weeks),
                          learning_objectives:
                            outlineForm.learning_objectives || undefined,
                        });
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Course Title *
                          </label>
                          <input
                            className={inputCls}
                            required
                            value={outlineForm.course_title}
                            onChange={(e) =>
                              setOutlineForm((f) => ({
                                ...f,
                                course_title: e.target.value,
                              }))
                            }
                            placeholder="e.g. Introduction to Machine Learning"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Subject *
                          </label>
                          <input
                            className={inputCls}
                            required
                            value={outlineForm.subject}
                            onChange={(e) =>
                              setOutlineForm((f) => ({
                                ...f,
                                subject: e.target.value,
                              }))
                            }
                            placeholder="e.g. Computer Science"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Duration (weeks)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={52}
                            className={inputCls}
                            value={outlineForm.duration_weeks}
                            onChange={(e) =>
                              setOutlineForm((f) => ({
                                ...f,
                                duration_weeks: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Target Level
                          </label>
                          <select
                            className={inputCls}
                            value={outlineForm.target_level}
                            onChange={(e) =>
                              setOutlineForm((f) => ({
                                ...f,
                                target_level: e.target.value,
                              }))
                            }
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Learning Objectives (optional)
                          </label>
                          <textarea
                            className={`${inputCls} resize-none`}
                            rows={2}
                            value={outlineForm.learning_objectives}
                            onChange={(e) =>
                              setOutlineForm((f) => ({
                                ...f,
                                learning_objectives: e.target.value,
                              }))
                            }
                            placeholder="What students will be able to do after this course…"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={aiLoading}
                        className="w-full py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {aiLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating…
                          </>
                        ) : (
                          "Generate Outline →"
                        )}
                      </button>
                    </form>
                  )}

                  {aiResult?.outline && !outlineSaved && (
                    <div ref={aiResultRef} className="space-y-3">
                      <div className="border border-[var(--border)]/40 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 border-b border-[var(--border)]/30 bg-green-500/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
                              Generated Outline
                            </span>
                          </div>
                          <button
                            onClick={() => setAiResult(null)}
                            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            ← Regenerate
                          </button>
                        </div>
                        <div className="p-4 max-h-[40vh] overflow-y-auto">
                          <AiMarkdown text={aiResult.outline} />
                        </div>
                      </div>
                      {aiError && (
                        <p className="text-red-400 text-sm">{aiError}</p>
                      )}
                      <button
                        onClick={saveOutline}
                        disabled={outlineSaving}
                        className="w-full py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {outlineSaving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "💾 Save Outline to Library"
                        )}
                      </button>
                    </div>
                  )}

                  {outlineSaved && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
                      ✓ Outline saved to your library!
                    </div>
                  )}

                  {/* Saved outlines library */}
                  {savedOutlines.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                        Saved Outlines ({savedOutlines.length})
                      </p>
                      {savedOutlines.map((o) => (
                        <div
                          key={o.id}
                          className="border border-[var(--border)]/40 rounded-xl p-3 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[var(--text)] truncate">
                              {o.courseTitle}
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              {o.subject} · {o.durationWeeks}w · {o.targetLevel}{" "}
                              · {new Date(o.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteOutline(o.id)}
                            className="text-red-400 hover:text-red-300 text-xs shrink-0 cursor-pointer"
                          >
                            🗑
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ══ AGENT ══ */}
              {aiModal === "agent" && (
                <>
                  {!aiResult && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        runAi("/agent", {
                          task: agentTask,
                          context: { teacher_id: user.id },
                        });
                      }}
                      className="space-y-4"
                    >
                      <div className="p-3 glass rounded-xl border border-violet-500/20 space-y-1">
                        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
                          Example Tasks
                        </p>
                        {[
                          "Generate a 5-question quiz on recursion AND create a course outline for Web Dev",
                          "Create a complete 8-week course outline for Introduction to Machine Learning",
                          "Summarize this content then generate 5 quiz questions from it",
                        ].map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => setAgentTask(ex)}
                            className="block w-full text-left text-xs text-[var(--muted)] hover:text-[var(--text)] px-3 py-1.5 rounded-lg hover:bg-violet-500/10 transition-all truncate"
                          >
                            → {ex}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                          Task *
                        </label>
                        <textarea
                          className={`${inputCls} resize-none`}
                          rows={3}
                          required
                          value={agentTask}
                          onChange={(e) => setAgentTask(e.target.value)}
                          placeholder="Describe what you want the AI agent to do…"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={aiLoading}
                        className="w-full py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {aiLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Running Agent…
                          </>
                        ) : (
                          "Run Agent ⚡"
                        )}
                      </button>
                    </form>
                  )}
                  {aiResult && (
                    <div ref={aiResultRef} className="space-y-3">
                      <div className="border border-[var(--border)]/40 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 border-b border-[var(--border)]/30 bg-green-500/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
                              Agent Result
                            </span>
                            {aiResult.tools_used && (
                              <div className="flex gap-1">
                                {aiResult.tools_used.map((t, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400"
                                  >
                                    {t.tool}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setAiResult(null);
                              setAgentTask("");
                            }}
                            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            ← New Task
                          </button>
                        </div>
                        <div className="p-4 max-h-[50vh] overflow-y-auto">
                          <AiMarkdown
                            text={
                              aiResult.response ||
                              JSON.stringify(aiResult, null, 2)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ══ CLASS AGENDA ══ */}
              {aiModal === "class-agenda" && (
                <>
                  {!aiResult && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        runAi("/generate-class-agenda", {
                          course_title:
                            aiCourse?.title || agendaForm.course_title || "",
                          topic: agendaForm.topic,
                          duration_minutes: Number(agendaForm.duration_minutes),
                        });
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {!aiCourse && (
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                              Course Title *
                            </label>
                            <input
                              className={inputCls}
                              required
                              value={agendaForm.course_title || ""}
                              onChange={(e) =>
                                setAgendaForm((f) => ({
                                  ...f,
                                  course_title: e.target.value,
                                }))
                              }
                              placeholder="e.g. Introduction to Python"
                            />
                          </div>
                        )}
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Class Topic *
                          </label>
                          <input
                            className={inputCls}
                            required
                            value={agendaForm.topic}
                            onChange={(e) =>
                              setAgendaForm((f) => ({
                                ...f,
                                topic: e.target.value,
                              }))
                            }
                            placeholder="e.g. Recursion, Sorting Algorithms…"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            min={15}
                            max={240}
                            className={inputCls}
                            value={agendaForm.duration_minutes}
                            onChange={(e) =>
                              setAgendaForm((f) => ({
                                ...f,
                                duration_minutes: e.target.value,
                              }))
                            }
                          />
                        </div>
                        {aiCourse && (
                          <div className="flex items-end pb-0.5">
                            <div className={`${inputCls} opacity-60`}>
                              📚 {aiCourse.title}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={aiLoading}
                        className="w-full py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {aiLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating Agenda…
                          </>
                        ) : (
                          "Generate Class Agenda →"
                        )}
                      </button>
                    </form>
                  )}
                  {aiResult && (
                    <div ref={aiResultRef} className="space-y-3">
                      <div className="border border-[var(--border)]/40 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 border-b border-[var(--border)]/30 bg-[var(--surface)]/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
                              Class Agenda — {agendaForm.duration_minutes} min
                            </span>
                          </div>
                          <button
                            onClick={() => setAiResult(null)}
                            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            ← Regenerate
                          </button>
                        </div>
                        <div className="p-4 max-h-[55vh] overflow-y-auto">
                          <AiMarkdown
                            text={
                              aiResult.response ||
                              JSON.stringify(aiResult, null, 2)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Error */}
              {aiError && !quizSaved && editableQuestions.length === 0 && (
                <div className="p-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-400 text-sm">
                  {aiError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmDelete(null)
          }
        >
          <div
            className="glass-heavy border border-[var(--border)]/50 rounded-2xl p-8 w-full max-w-sm
                          shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)] text-center
                          animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-extrabold text-[var(--text)] mb-3 sc-title">
              Delete Course?
            </h3>
            <p className="text-sm font-medium text-[var(--muted)] mb-6 leading-relaxed">
              <strong className="text-[var(--text)] font-bold">
                "{confirmDelete.title}"
              </strong>{" "}
              will be permanently deleted along with all materials and student
              records.
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-7 bg-red-500/8 py-2 rounded-lg border border-red-500/15">
              This action is irreversible.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 glass hover:bg-[var(--border)]/30 text-[var(--text)] rounded-xl text-sm font-bold
                           border border-[var(--border)]/50 cursor-pointer transition-all duration-300 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_8px_24px_-4px_rgba(239,68,68,0.4)]
                           text-white rounded-xl text-sm font-bold border-none cursor-pointer transition-all duration-300 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
