import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const inputCls =
  "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm outline-none focus:border-[var(--accent)] transition-colors bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/70";
const textareaCls =
  "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm outline-none resize-y focus:border-[var(--accent)] transition-colors bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/70";

function VideoEmbed({ url }) {
  const yt = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) {
    return (
      <div className="mt-3 rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="200"
          src={`https://www.youtube.com/embed/${yt[1]}`}
          style={{ border: 0 }}
          allowFullScreen
          className="block rounded-lg"
        />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[var(--accent)] text-sm font-medium mt-2 hover:underline"
    >
      ▶ Open Link
    </a>
  );
}

const MATERIAL_TYPES = [
  { value: "video", label: "Video (YouTube URL)" },
  { value: "link", label: "Link / URL" },
  { value: "document", label: "Document" },
  { value: "image", label: "Image" },
  { value: "other", label: "Other" },
];

function typeLabel(type) {
  switch (type) {
    case "video": return "▶ Video";
    case "document": return "📄 Doc";
    case "link": return "🔗 Link";
    case "image": return "🖼 Image";
    default: return "📝 Other";
  }
}
function typeCls(type) {
  switch (type) {
    case "video": return "bg-red-100 text-red-600";
    case "document": return "bg-amber-100 text-amber-700";
    case "link": return "bg-blue-100 text-blue-600";
    case "image": return "bg-purple-100 text-purple-600";
    default: return "bg-emerald-100 text-emerald-700";
  }
}

function CourseView() {
  const { user } = useAuth();
  const { id } = useParams();
const isTeacher = user.role === "teacher";

  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);

  const [tab, setTab] = useState("materials");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  // Student: my submissions per assignment  { [assignmentId]: submission }
  const [mySubmissions, setMySubmissions] = useState({});
  // Teacher: expanded submissions list per assignment  { [assignmentId]: submissions[] | null }
  const [expandedSubs, setExpandedSubs] = useState({});
  const [submissionText, setSubmissionText] = useState({});
  // Grading state
  const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });
  const [gradingSubId, setGradingSubId] = useState(null);

  const [matForm, setMatForm] = useState({ title: "", description: "", type: "video", fileUrl: "" });
  const [assForm, setAssForm] = useState({ title: "", description: "", dueDate: "", maxScore: 100 });
  const [quizForm, setQuizForm] = useState({
    title: "",
    questions: [{ question: "", options: ["", "", "", ""], answer: 0 }],
  });

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadCourse = useCallback(() =>
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then((d) => !d.error && setCourse(d)), [id]);

  const loadMaterials = useCallback(() =>
    fetch(`/api/courses/${id}/materials`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMaterials(d)), [id]);

  const loadAssignments = useCallback(() =>
    fetch(`/api/courses/${id}/assignments`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setAssignments(d)), [id]);

  const loadStudents = useCallback(() => {
    const qs = isTeacher ? `?teacherId=${user.id}` : "";
    fetch(`/api/courses/${id}/students${qs}`)
      .then((r) => r.json())
      .then((d) => d.students && setStudents(d.students));
  }, [id, isTeacher, user.id]);

  useEffect(() => {
    loadCourse();
    loadMaterials();
    loadAssignments();
    loadStudents();
  }, [id]);

  // Student: load own submissions after assignments load
  useEffect(() => {
    if (isTeacher || assignments.length === 0) return;
    assignments.forEach((a) => {
      fetch(`/api/assignments/${a.id}/my-submission?studentId=${user.id}`)
        .then((r) => r.json())
        .then((s) => {
          if (!s.error) setMySubmissions((p) => ({ ...p, [a.id]: s }));
        });
    });
  }, [assignments, isTeacher, user.id]);

  // ── Material actions ──────────────────────────────────────────────────────
  const saveMaterial = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/courses/${id}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...matForm, teacherId: user.id }),
    });
    if (res.ok) {
      setModal(null);
      setMatForm({ title: "", description: "", type: "video", fileUrl: "" });
      loadMaterials();
    }
    setSaving(false);
  };

  const deleteMaterial = async (mid) => {
    await fetch(`/api/courses/${id}/materials/${mid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: user.id }),
    });
    setMaterials((p) => p.filter((m) => m.id !== mid));
  };

  // ── Assignment actions ────────────────────────────────────────────────────
  const saveAssignment = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/courses/${id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...assForm, teacherId: user.id }),
    });
    if (res.ok) {
      setModal(null);
      setAssForm({ title: "", description: "", dueDate: "", maxScore: 100 });
      loadAssignments();
    }
    setSaving(false);
  };

  const deleteAssignment = async (aid) => {
    await fetch(`/api/assignments/${aid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: user.id }),
    });
    setAssignments((p) => p.filter((a) => a.id !== aid));
    setExpandedSubs((p) => { const n = { ...p }; delete n[aid]; return n; });
  };

  const submitAssignment = async (aid) => {
    const content = submissionText[aid];
    if (!content?.trim()) return;
    const res = await fetch(`/api/assignments/${aid}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: user.id, content }),
    });
    const data = await res.json();
    if (!data.error) setMySubmissions((p) => ({ ...p, [aid]: data }));
  };

  const toggleSubs = async (aid) => {
    if (expandedSubs[aid] !== undefined && expandedSubs[aid] !== null) {
      setExpandedSubs((p) => { const n = { ...p }; delete n[aid]; return n; });
      return;
    }
    const data = await fetch(`/api/assignments/${aid}/submissions?teacherId=${user.id}`)
      .then((r) => r.json());
    setExpandedSubs((p) => ({ ...p, [aid]: Array.isArray(data) ? data : [] }));
  };

  const gradeSubmission = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/assignments/submissions/${gradingSubId}/grade`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback,
        teacherId: user.id,
      }),
    });
    const updated = await res.json();
    if (!updated.error) {
      // Update the submission in expanded list
      setExpandedSubs((p) => {
        const newSubs = { ...p };
        for (const aid in newSubs) {
          if (Array.isArray(newSubs[aid])) {
            newSubs[aid] = newSubs[aid].map((s) =>
              s.id === gradingSubId ? { ...s, ...updated } : s
            );
          }
        }
        return newSubs;
      });
      setGradingSubId(null);
      setGradeForm({ score: "", feedback: "" });
    }
  };

  // ── Quiz actions (placeholder — quiz backend not yet implemented) ──────────
  const saveQuiz = async (e) => {
    e.preventDefault();
    if (quizForm.questions.some((q) => !q.question || q.options.some((o) => !o))) return;
    setSaving(true);
    await fetch(`/api/courses/${id}/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quizForm),
    });
    setSaving(false);
    setModal(null);
    setQuizForm({ title: "", questions: [{ question: "", options: ["", "", "", ""], answer: 0 }] });
  };

  const updateQ = (qi, field, val) =>
    setQuizForm((p) => ({
      ...p,
      questions: p.questions.map((q, i) => (i === qi ? { ...q, [field]: val } : q)),
    }));
  const updateOpt = (qi, oi, val) =>
    setQuizForm((p) => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) } : q
      ),
    }));
  const addQuestion = () =>
    setQuizForm((p) => ({
      ...p,
      questions: [...p.questions, { question: "", options: ["", "", "", ""], answer: 0 }],
    }));
  const removeQuestion = (qi) =>
    setQuizForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }));

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!course)
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
        <Navbar showBack />
        <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
          Loading...
        </div>
        <Footer />
      </div>
    );

  const tabs = isTeacher
    ? ["materials", "assignments", "quizzes", "students"]
    : ["materials", "assignments", "quizzes"];

  const tabCount = {
    materials: materials.length,
    assignments: assignments.length,
    quizzes: 0,
    students: students.length,
  };

  const scoreCls = (pct) =>
    pct >= 70
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 40
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-600";

  const modalOverlay = (onClose, children) => (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl text-[var(--text)]">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <Navbar showBack />
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

        {/* ── Course Header ── */}
        <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/80 rounded-2xl p-7 text-[var(--accent-contrast)] mb-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold mb-1.5">{course.title}</h1>
              <p className="text-sm opacity-80 mb-1">👨‍🏫 {course.teacher?.name}</p>
              {course.description && (
                <p className="text-sm opacity-75 leading-relaxed">{course.description}</p>
              )}
            </div>
            {course.subject && (
              <span className="px-3.5 py-1.5 bg-white/20 rounded-full text-sm font-semibold whitespace-nowrap">
                {course.subject}
              </span>
            )}
          </div>
          <div className="flex gap-4 mt-5 text-xs font-medium opacity-80">
            <span>📄 {materials.length} materials</span>
            <span>📋 {assignments.length} assignments</span>
            <span>👨‍🎓 {course.enrollmentCount} students</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b-2 border-[var(--border)] mb-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-0.5 transition-colors capitalize bg-transparent border-x-0 border-t-0 cursor-pointer ${
                tab === t
                  ? "text-[var(--accent)] border-b-[var(--accent)] font-semibold"
                  : "text-[var(--muted)] border-b-transparent hover:text-[var(--accent)]"
              }`}
            >
              {t} ({tabCount[t]})
            </button>
          ))}
        </div>

        {/* ── MATERIALS ── */}
        {tab === "materials" && (
          <div>
            {isTeacher && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-[var(--text)]">Course Materials</h2>
                <button
                  onClick={() => setModal("material")}
                  className="px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                  + Add Material
                </button>
              </div>
            )}
            {materials.length === 0 ? (
              <div className="text-center py-14 text-[var(--muted)] text-sm">
                No materials yet{isTeacher ? ". Add your first one!" : "."}
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[var(--text)]">{m.title}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeCls(m.type)}`}>
                            {typeLabel(m.type)}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-xs text-[var(--muted)] mb-1">{m.description}</p>
                        )}
                        <p className="text-xs text-[var(--muted)] mb-1">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                        {m.fileUrl && m.type === "video" && <VideoEmbed url={m.fileUrl} />}
                        {m.fileUrl && m.type !== "video" && (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--accent)] text-sm font-medium mt-1 hover:underline"
                          >
                            📎 Open {m.type}
                          </a>
                        )}
                      </div>
                      {isTeacher && (
                        <button
                          onClick={() => deleteMaterial(m.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-semibold border-none cursor-pointer flex-shrink-0"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ASSIGNMENTS ── */}
        {tab === "assignments" && (
          <div>
            {isTeacher && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-[var(--text)]">Assignments</h2>
                <button
                  onClick={() => setModal("assignment")}
                  className="px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                  + Add Assignment
                </button>
              </div>
            )}
            {assignments.length === 0 ? (
              <div className="text-center py-14 text-[var(--muted)] text-sm">
                No assignments yet{isTeacher ? ". Create one!" : "."}
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const mySub = mySubmissions[a.id];
                  const subs = expandedSubs[a.id];
                  const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
                  return (
                    <div
                      key={a.id}
                      className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--text)] mb-1">{a.title}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)] mb-1">
                            {a.dueDate && (
                              <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                                {isOverdue ? "⚠ Overdue · " : "📅 Due: "}
                                {new Date(a.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            <span>Max: {a.maxScore} pts</span>
                          </div>
                          {a.description && (
                            <p className="text-sm text-[var(--muted)] leading-relaxed mt-1">
                              {a.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {isTeacher ? (
                            <>
                              <button
                                onClick={() => toggleSubs(a.id)}
                                className="px-3 py-1.5 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] rounded-lg text-xs font-semibold border-none cursor-pointer"
                              >
                                {subs !== undefined ? "Hide" : "Submissions"}
                              </button>
                              <button
                                onClick={() => deleteAssignment(a.id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-semibold border-none cursor-pointer"
                              >
                                Delete
                              </button>
                            </>
                          ) : mySub ? (
                            <div className="text-right">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                mySub.status === "graded"
                                  ? scoreCls((mySub.score / a.maxScore) * 100)
                                  : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {mySub.status === "graded"
                                  ? `${mySub.score}/${a.maxScore}`
                                  : mySub.status === "late" ? "⏰ Late" : "✓ Submitted"}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Student — submission form */}
                      {!isTeacher && !mySub && (
                        <div className="mt-4 space-y-2">
                          <textarea
                            className={`${textareaCls} min-h-[80px]`}
                            placeholder="Write your answer here..."
                            value={submissionText[a.id] || ""}
                            onChange={(e) =>
                              setSubmissionText((p) => ({ ...p, [a.id]: e.target.value }))
                            }
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => submitAssignment(a.id)}
                              disabled={!submissionText[a.id]?.trim()}
                              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-600 rounded-lg text-xs font-semibold border-none cursor-pointer disabled:cursor-not-allowed"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Student — submitted content + feedback */}
                      {!isTeacher && mySub && (
                        <div className="mt-3 bg-[var(--bg)] rounded-lg px-4 py-3 border border-[var(--border)] space-y-2">
                          <p className="text-xs font-semibold text-[var(--muted)]">Your submission</p>
                          <p className="text-sm text-[var(--text)] leading-relaxed">{mySub.content}</p>
                          {mySub.feedback && (
                            <div className="pt-2 border-t border-[var(--border)]">
                              <p className="text-xs font-semibold text-[var(--muted)] mb-0.5">Feedback</p>
                              <p className="text-sm text-[var(--text)]">{mySub.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Teacher — submissions list */}
                      {isTeacher && subs !== undefined && (
                        <div className="mt-4 space-y-2">
                          {subs.length === 0 ? (
                            <p className="text-xs text-[var(--muted)] italic">No submissions yet</p>
                          ) : (
                            subs.map((s) => (
                              <div
                                key={s.id}
                                className="bg-[var(--bg)] rounded-lg px-4 py-3 border border-[var(--border)]"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-[var(--muted)]">
                                    {s.student?.name} ·{" "}
                                    {new Date(s.submittedAt).toLocaleString()}
                                    {s.status === "late" && (
                                      <span className="ml-2 text-red-500">⏰ Late</span>
                                    )}
                                    {s.status === "graded" && (
                                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${scoreCls((s.score / a.maxScore) * 100)}`}>
                                        {s.score}/{a.maxScore}
                                      </span>
                                    )}
                                  </p>
                                  <button
                                    onClick={() => {
                                      setGradingSubId(s.id);
                                      setGradeForm({ score: s.score ?? "", feedback: s.feedback ?? "" });
                                    }}
                                    className="px-2 py-1 text-xs bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] rounded border-none cursor-pointer font-semibold"
                                  >
                                    Grade
                                  </button>
                                </div>
                                <p className="text-sm text-[var(--text)] leading-relaxed">{s.content}</p>
                                {s.feedback && (
                                  <p className="text-xs text-[var(--muted)] mt-1 italic">"{s.feedback}"</p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── QUIZZES ── */}
        {tab === "quizzes" && (
          <div>
            {isTeacher && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-[var(--text)]">Quizzes</h2>
                <button
                  onClick={() => setModal("quiz")}
                  className="px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                  + Create Quiz
                </button>
              </div>
            )}
            <div className="text-center py-14 text-[var(--muted)] text-sm">
              No quizzes yet{isTeacher ? ". Create one!" : "."}
            </div>
          </div>
        )}

        {/* ── STUDENTS (teacher only) ── */}
        {tab === "students" && isTeacher && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[var(--text)]">Enrolled Students</h2>
              <span className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-xs font-bold">
                {students.length} enrolled
              </span>
            </div>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
              {students.length === 0 ? (
                <div className="text-center py-10 text-[var(--muted)] text-sm">
                  No students enrolled yet
                </div>
              ) : (
                students.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-5 py-3.5 ${i < students.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/80 flex items-center justify-center text-[var(--accent-contrast)] text-sm font-bold flex-shrink-0">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{s.name}</p>
                      <p className="text-xs text-[var(--muted)]">{s.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* ── MODAL: Grade Submission ── */}
      {gradingSubId && modalOverlay(
        () => { setGradingSubId(null); setGradeForm({ score: "", feedback: "" }); },
        <>
          <h3 className="text-lg font-bold text-[var(--text)] mb-5">Grade Submission</h3>
          <form onSubmit={gradeSubmission} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Score</label>
              <input
                type="number"
                className={inputCls}
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                placeholder="e.g. 85"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Feedback</label>
              <textarea
                className={`${textareaCls} min-h-[70px]`}
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                placeholder="Optional feedback for the student..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setGradingSubId(null); setGradeForm({ score: "", feedback: "" }); }}
                className="px-5 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/40 text-[var(--text)] rounded-lg text-sm font-medium border border-[var(--border)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer"
              >
                Save Grade
              </button>
            </div>
          </form>
        </>
      )}

      {/* ── MODAL: Add Material ── */}
      {modal === "material" && modalOverlay(
        () => setModal(null),
        <>
          <h3 className="text-lg font-bold text-[var(--text)] mb-5">Add Material</h3>
          <form onSubmit={saveMaterial} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Title *</label>
              <input
                className={inputCls}
                value={matForm.title}
                onChange={(e) => setMatForm({ ...matForm, title: e.target.value })}
                placeholder="Material title"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Description</label>
              <input
                className={inputCls}
                value={matForm.description}
                onChange={(e) => setMatForm({ ...matForm, description: e.target.value })}
                placeholder="Brief description (optional)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Type</label>
              <select
                className={inputCls}
                value={matForm.type}
                onChange={(e) => setMatForm({ ...matForm, type: e.target.value })}
              >
                {MATERIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                {matForm.type === "video" ? "YouTube URL *" : "URL / Link"}
              </label>
              <input
                className={inputCls}
                value={matForm.fileUrl}
                onChange={(e) => setMatForm({ ...matForm, fileUrl: e.target.value })}
                placeholder={
                  matForm.type === "video"
                    ? "https://youtube.com/watch?v=..."
                    : "https://..."
                }
                required={matForm.type === "video"}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/40 text-[var(--text)] rounded-lg text-sm font-medium border border-[var(--border)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer"
              >
                {saving ? "Adding..." : "Add Material"}
              </button>
            </div>
          </form>
        </>
      )}

      {/* ── MODAL: Create Assignment ── */}
      {modal === "assignment" && modalOverlay(
        () => setModal(null),
        <>
          <h3 className="text-lg font-bold text-[var(--text)] mb-5">Create Assignment</h3>
          <form onSubmit={saveAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Title *</label>
              <input
                className={inputCls}
                value={assForm.title}
                onChange={(e) => setAssForm({ ...assForm, title: e.target.value })}
                placeholder="Assignment title"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Description</label>
              <textarea
                className={`${textareaCls} min-h-[70px]`}
                value={assForm.description}
                onChange={(e) => setAssForm({ ...assForm, description: e.target.value })}
                placeholder="Instructions for students..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Due Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={assForm.dueDate}
                  onChange={(e) => setAssForm({ ...assForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Max Score</label>
                <input
                  type="number"
                  className={inputCls}
                  value={assForm.maxScore}
                  onChange={(e) => setAssForm({ ...assForm, maxScore: e.target.value })}
                  min={1}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/40 text-[var(--text)] rounded-lg text-sm font-medium border border-[var(--border)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </>
      )}

      {/* ── MODAL: Create Quiz ── */}
      {modal === "quiz" && modalOverlay(
        () => setModal(null),
        <>
          <h3 className="text-lg font-bold text-[var(--text)] mb-5">Create Quiz</h3>
          <form onSubmit={saveQuiz} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Quiz Title *</label>
              <input
                className={inputCls}
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                placeholder="Quiz title"
                required
              />
            </div>
            {quizForm.questions.map((q, qi) => (
              <div key={qi} className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[var(--muted)]">Question {qi + 1}</span>
                  {quizForm.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer text-lg leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
                <input
                  className={`${inputCls} mb-3`}
                  placeholder="Question text..."
                  value={q.question}
                  onChange={(e) => updateQ(qi, "question", e.target.value)}
                  required
                />
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={q.answer === oi}
                      onChange={() => updateQ(qi, "answer", oi)}
                      className="cursor-pointer accent-[var(--accent)]"
                      title="Mark as correct answer"
                    />
                    <input
                      className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-[var(--accent)] transition-colors bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/70 ${
                        q.answer === oi ? "border-emerald-400 bg-emerald-50" : "border-[var(--border)]"
                      }`}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={(e) => updateOpt(qi, oi, e.target.value)}
                      required
                    />
                  </div>
                ))}
                <p className="text-xs text-[var(--muted)] mt-1">Click the radio button to mark the correct answer</p>
              </div>
            ))}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-2.5 bg-[var(--bg)] hover:bg-[var(--border)]/40 border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--muted)] font-medium cursor-pointer transition-colors"
            >
              + Add Question
            </button>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/40 text-[var(--text)] rounded-lg text-sm font-medium border border-[var(--border)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer"
              >
                {saving ? "Creating..." : "Create Quiz"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default CourseView;
