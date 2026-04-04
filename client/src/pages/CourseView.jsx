import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api.js";
import { getSocket } from "../socket.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseHeader from "../components/CourseView/CourseHeader";
import MaterialsTab from "../components/CourseView/MaterialsTab";
import AssignmentsTab from "../components/CourseView/AssignmentsTab";
import QuizzesTab from "../components/CourseView/QuizzesTab";
import LiveClassesTab from "../components/CourseView/LiveClassesTab";
import StudentsTab from "../components/CourseView/StudentsTab";
import GradeModal from "../components/CourseView/GradeModal";
import MaterialModal from "../components/CourseView/MaterialModal";
import AssignmentModal from "../components/CourseView/AssignmentModal";
import QuizModal from "../components/CourseView/QuizModal";
import LiveClassModal from "../components/CourseView/LiveClassModal";

const TAB_META = {
  materials: {
    icon: "📄",
    label: "Materials",
    color: "from-blue-500 to-indigo-600",
  },
  assignments: {
    icon: "📋",
    label: "Assignments",
    color: "from-amber-500 to-orange-500",
  },
  quizzes: { icon: "🧠", label: "Quizzes", color: "from-pink-500 to-rose-500" },
  "live-classes": {
    icon: "📹",
    label: "Live Classes",
    color: "from-red-500 to-red-600",
  },
  students: {
    icon: "👨‍🎓",
    label: "Students",
    color: "from-emerald-500 to-teal-600",
  },
};

function CourseView() {
  const { user } = useAuth();
  const { id, tab: urlTab } = useParams();
  const navigate = useNavigate();
  const isTeacher = user.role === "teacher";

  const tab = Object.keys(TAB_META).includes(urlTab) ? urlTab : "materials";

  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [completedMats, setCompletedMats] = useState(new Set());
  const [matProgress, setMatProgress] = useState(0);

  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const [mySubmissions, setMySubmissions] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});
  const expandedSubsRef = useRef({});
  const [submissionText, setSubmissionText] = useState({});
  const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });
  const [gradingSubId, setGradingSubId] = useState(null);
  const [matForm, setMatForm] = useState({
    title: "",
    description: "",
    type: "video",
    fileUrl: "",
    uploadFile: null,
    uploadMode: "url",
  });
  const [assForm, setAssForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxScore: 100,
  });
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    timeLimit: 0,
    questions: [{ question: "", options: ["", "", "", ""], answer: 0 }],
  });
  const [lcForm, setLcForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    type: "platform",
    meetingLink: "",
  });

  const loadCourse = useCallback(
    () =>
      apiFetch(`/api/courses/${id}`)
        .then((r) => r.json())
        .then((d) => !d.error && setCourse(d)),
    [id],
  );

  const loadMaterials = useCallback(
    () =>
      apiFetch(`/api/courses/${id}/materials`)
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setMaterials(d)),
    [id],
  );

  const loadAssignments = useCallback(
    () =>
      apiFetch(`/api/courses/${id}/assignments`)
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setAssignments(d)),
    [id],
  );

  const loadQuizzes = useCallback(
    () =>
      apiFetch(`/api/courses/${id}/quizzes`)
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setQuizzes(d)),
    [id],
  );

  const loadLiveClasses = useCallback(
    () =>
      apiFetch(`/api/courses/${id}/live-classes`)
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setLiveClasses(d)),
    [id],
  );

  const loadStudents = useCallback(() => {
    const qs = isTeacher ? `?teacherId=${user.id}` : "";
    apiFetch(`/api/courses/${id}/students${qs}`)
      .then((r) => r.json())
      .then((d) => d.students && setStudents(d.students));
  }, [id, isTeacher, user.id]);

  const loadProgress = useCallback(() => {
    if (isTeacher) return;
    apiFetch(`/api/courses/${id}/materials/progress?studentId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setMatProgress(d.progress ?? 0);
          setCompletedMats(
            new Set(
              (d.materials || []).filter((m) => m.isCompleted).map((m) => m.id),
            ),
          );
        }
      });
  }, [id, isTeacher, user.id]);

  useEffect(() => {
    loadCourse();
    loadMaterials();
    loadAssignments();
    loadQuizzes();
    loadLiveClasses();
    loadStudents();
    loadProgress();
  }, [id]);

  // Keep ref in sync so async socket handlers can read latest expanded state
  useEffect(() => {
    expandedSubsRef.current = expandedSubs;
  }, [expandedSubs]);

  // ── Real-time socket listeners ────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket(user.id);
    socket.emit("join-course", id);

    const sid = (v) => String(v);

    // Materials
    const onMatNew = (mat) =>
      setMaterials((p) =>
        p.some((m) => sid(m.id) === sid(mat.id)) ? p : [mat, ...p],
      );
    const onMatUpdated = (mat) =>
      setMaterials((p) => p.map((m) => (sid(m.id) === sid(mat.id) ? mat : m)));
    const onMatDeleted = ({ id: mid }) =>
      setMaterials((p) => p.filter((m) => sid(m.id) !== sid(mid)));
    const onMatProgress = ({ courseId: cid, progress }) => {
      if (cid === id) setMatProgress(progress);
    };

    // Assignments
    const onAssNew = (ass) =>
      setAssignments((p) =>
        p.some((a) => sid(a.id) === sid(ass.id)) ? p : [ass, ...p],
      );
    const onAssUpdated = (ass) =>
      setAssignments((p) =>
        p.map((a) => (sid(a.id) === sid(ass.id) ? ass : a)),
      );
    const onAssDeleted = ({ id: aid }) =>
      setAssignments((p) => p.filter((a) => sid(a.id) !== sid(aid)));
    const onAssSubmitted = async ({ assignmentId }) => {
      if (!isTeacher) return;
      if (expandedSubsRef.current[assignmentId] !== undefined) {
        const data = await apiFetch(
          `/api/assignments/${assignmentId}/submissions?teacherId=${user.id}`,
        ).then((r) => r.json());
        setExpandedSubs((p) => ({
          ...p,
          [assignmentId]: Array.isArray(data) ? data : [],
        }));
      }
    };
    const onAssGraded = ({ assignmentId, score, feedback }) => {
      setMySubmissions((p) => {
        const sub = p[assignmentId];
        if (!sub) return p;
        return {
          ...p,
          [assignmentId]: { ...sub, score, feedback, status: "graded" },
        };
      });
    };

    // Quizzes
    const onQuizNew = (quiz) =>
      setQuizzes((p) =>
        p.some((q) => sid(q.id) === sid(quiz.id)) ? p : [quiz, ...p],
      );
    const onQuizUpdated = (quiz) =>
      setQuizzes((p) => p.map((q) => (sid(q.id) === sid(quiz.id) ? quiz : q)));
    const onQuizDeleted = ({ id: qid }) =>
      setQuizzes((p) => p.filter((q) => sid(q.id) !== sid(qid)));

    socket.on("material:new", onMatNew);
    socket.on("material:updated", onMatUpdated);
    socket.on("material:deleted", onMatDeleted);
    socket.on("material:progress", onMatProgress);
    socket.on("assignment:new", onAssNew);
    socket.on("assignment:updated", onAssUpdated);
    socket.on("assignment:deleted", onAssDeleted);
    socket.on("assignment:submitted", onAssSubmitted);
    socket.on("assignment:graded", onAssGraded);
    socket.on("quiz:new", onQuizNew);
    socket.on("quiz:updated", onQuizUpdated);
    socket.on("quiz:deleted", onQuizDeleted);

    return () => {
      socket.emit("leave-course", id);
      socket.off("material:new", onMatNew);
      socket.off("material:updated", onMatUpdated);
      socket.off("material:deleted", onMatDeleted);
      socket.off("material:progress", onMatProgress);
      socket.off("assignment:new", onAssNew);
      socket.off("assignment:updated", onAssUpdated);
      socket.off("assignment:deleted", onAssDeleted);
      socket.off("assignment:submitted", onAssSubmitted);
      socket.off("assignment:graded", onAssGraded);
      socket.off("quiz:new", onQuizNew);
      socket.off("quiz:updated", onQuizUpdated);
      socket.off("quiz:deleted", onQuizDeleted);
    };
  }, [id, user.id]);

  useEffect(() => {
    if (isTeacher || assignments.length === 0) return;
    assignments.forEach((a) => {
      apiFetch(`/api/assignments/${a.id}/my-submission?studentId=${user.id}`)
        .then((r) => r.json())
        .then((s) => {
          if (!s.error) setMySubmissions((p) => ({ ...p, [a.id]: s }));
        });
    });
  }, [assignments, isTeacher, user.id]);

  // Material actions
  const saveMaterial = async (e) => {
    e.preventDefault();
    setSaving(true);
    let res;
    if (matForm.uploadFile) {
      const formData = new FormData();
      formData.append("file", matForm.uploadFile);
      formData.append("title", matForm.title);
      formData.append("description", matForm.description || "");
      formData.append("type", matForm.type);
      formData.append("teacherId", user.id);
      res = await apiFetch(`/api/courses/${id}/materials/upload`, {
        method: "POST",
        body: formData,
      });
    } else {
      res = await apiFetch(`/api/courses/${id}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...matForm, teacherId: user.id }),
      });
    }
    if (res.ok) {
      const data = await res.json();
      setMaterials((p) =>
        p.some((m) => String(m.id) === String(data.id)) ? p : [data, ...p],
      );
      setModal(null);
      setMatForm({
        title: "",
        description: "",
        type: "video",
        fileUrl: "",
        uploadFile: null,
        uploadMode: "url",
      });
    }
    setSaving(false);
  };

  const deleteMaterial = async (mid) => {
    await apiFetch(`/api/courses/${id}/materials/${mid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: user.id }),
    });
    setMaterials((p) => p.filter((m) => m.id !== mid));
  };

  const toggleComplete = async (mid) => {
    const isDone = completedMats.has(mid);
    await apiFetch(`/api/courses/${id}/materials/${mid}/complete`, {
      method: isDone ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: user.id }),
    });
    setCompletedMats((prev) => {
      const next = new Set(prev);
      isDone ? next.delete(mid) : next.add(mid);
      return next;
    });
    const total = materials.length;
    const newDone = isDone ? completedMats.size - 1 : completedMats.size + 1;
    setMatProgress(total > 0 ? Math.round((newDone / total) * 100) : 0);
  };

  // Assignment actions
  const saveAssignment = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/api/courses/${id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...assForm, teacherId: user.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setAssignments((p) =>
        p.some((a) => String(a.id) === String(data.id)) ? p : [data, ...p],
      );
      setModal(null);
      setAssForm({ title: "", description: "", dueDate: "", maxScore: 100 });
    }
    setSaving(false);
  };

  const deleteAssignment = async (aid) => {
    await apiFetch(`/api/assignments/${aid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: user.id }),
    });
    setAssignments((p) => p.filter((a) => a.id !== aid));
    setExpandedSubs((p) => {
      const n = { ...p };
      delete n[aid];
      return n;
    });
  };

  const submitAssignment = async (aid, content, isUpdate = false) => {
    if (!isUpdate) {
      if (!content?.trim()) return;
      const res = await apiFetch(`/api/assignments/${aid}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, content }),
      });
      const data = await res.json();
      if (!data.error) setMySubmissions((p) => ({ ...p, [aid]: data }));
    } else {
      setSubmissionText((p) => ({ ...p, [aid]: content }));
    }
  };

  const toggleSubs = async (aid) => {
    if (expandedSubs[aid] !== undefined) {
      setExpandedSubs((p) => {
        const n = { ...p };
        delete n[aid];
        return n;
      });
      return;
    }
    const data = await apiFetch(
      `/api/assignments/${aid}/submissions?teacherId=${user.id}`,
    ).then((r) => r.json());
    setExpandedSubs((p) => ({ ...p, [aid]: Array.isArray(data) ? data : [] }));
  };

  const gradeSubmission = async (e) => {
    e.preventDefault();
    const res = await apiFetch(
      `/api/assignments/submissions/${gradingSubId}/grade`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: Number(gradeForm.score),
          feedback: gradeForm.feedback,
          teacherId: user.id,
        }),
      },
    );
    const updated = await res.json();
    if (!updated.error) {
      setExpandedSubs((p) => {
        const n = { ...p };
        for (const aid in n) {
          if (Array.isArray(n[aid]))
            n[aid] = n[aid].map((s) =>
              s.id === gradingSubId ? { ...s, ...updated } : s,
            );
        }
        return n;
      });
      setGradingSubId(null);
      setGradeForm({ score: "", feedback: "" });
    }
  };

  // Quiz actions
  const saveQuiz = async (e) => {
    e.preventDefault();
    if (
      quizForm.questions.some((q) => !q.question || q.options.some((o) => !o))
    )
      return;
    setSaving(true);
    const res = await apiFetch(`/api/courses/${id}/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quizForm.title,
        description: quizForm.description,
        timeLimit: Number(quizForm.timeLimit) || 0,
        teacherId: user.id,
        questions: quizForm.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctOption: q.answer,
          points: 1,
        })),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setQuizzes((p) =>
        p.some((q) => String(q.id) === String(data.id)) ? p : [data, ...p],
      );
      setModal(null);
      setQuizForm({
        title: "",
        description: "",
        timeLimit: 0,
        questions: [{ question: "", options: ["", "", "", ""], answer: 0 }],
      });
    }
    setSaving(false);
  };

  const deleteQuiz = async (qid) => {
    await apiFetch(`/api/quizzes/${qid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: user.id }),
    });
    setQuizzes((p) => p.filter((q) => q.id !== qid));
  };

  // Live Class actions
  const saveLiveClass = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/api/courses/${id}/live-classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lcForm, teacherId: user.id }),
    });
    if (res.ok) {
      setModal(null);
      setLcForm({
        title: "",
        description: "",
        scheduledAt: "",
        type: "platform",
        meetingLink: "",
      });
      loadLiveClasses();
    }
    setSaving(false);
  };

  const deleteLiveClass = async (lcId) => {
    await apiFetch(`/api/live-classes/${lcId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: user.id }),
    });
    setLiveClasses((p) => p.filter((lc) => lc.id !== lcId));
  };

  const setClassStatus = async (lcId, status) => {
    const res = await apiFetch(`/api/live-classes/${lcId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, teacherId: user.id }),
    });
    const updated = await res.json();
    if (!updated.error)
      setLiveClasses((p) =>
        p.map((lc) =>
          lc.id === lcId ? { ...lc, status: updated.status } : lc,
        ),
      );
  };

  const joinClass = async (lcId, meetingLink) => {
    await apiFetch(`/api/live-classes/${lcId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (meetingLink) {
      // External link (Google Meet, Zoom, etc.)
      window.open(meetingLink, "_blank");
    } else {
      // Platform class → navigate to the live room
      navigate(`/live-class/${lcId}`);
    }
  };

  if (!course)
    return (
      <div className="min-h-screen bg-transparent text-[var(--text)] flex flex-col relative overflow-hidden">
        <Navbar showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl glass border border-[var(--border)]/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-[var(--muted)] font-semibold">
              Loading course...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );

  const tabs = isTeacher
    ? ["materials", "assignments", "quizzes", "live-classes", "students"]
    : ["materials", "assignments", "quizzes", "live-classes"];

  const tabCount = {
    materials: materials.length,
    assignments: assignments.length,
    quizzes: quizzes.length,
    "live-classes": liveClasses.length,
    students: students.length,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col transition-colors duration-300">
      <Navbar showBack />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Course Header Banner */}
        <CourseHeader
          course={course}
          materials={materials}
          assignments={assignments}
          quizzes={quizzes}
          liveClasses={liveClasses}
          isTeacher={isTeacher}
          matProgress={matProgress}
        />

        {/* Two-column layout: Left Sidebar + Content */}
        <div className="flex gap-5 items-start">
          {/* ── LEFT SIDEBAR ── */}
          <aside
            className="hidden md:flex flex-col w-52 shrink-0 sticky top-4
                            animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ top: "1rem" }}
          >
            {/* Sidebar nav card */}
            <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-lg">
              {/* Sidebar header */}
              <div className="px-4 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/8 to-transparent">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Course Content
                </p>
                <p className="text-sm font-semibold text-[var(--text)] truncate">
                  {course.title}
                </p>
              </div>

              {/* Tab buttons */}
              <div className="p-2">
                {tabs.map((t) => {
                  const meta = TAB_META[t];
                  const isActive = tab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => navigate(`/course/${id}/${t}`)}
                      className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl
text-sm font-semibold transition-all duration-200 cursor-pointer mb-1 relative overflow-hidden border-none
${
  isActive
    ? "bg-[var(--accent)]/12 text-[var(--accent)]"
    : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]"
}`}
                      style={
                        isActive
                          ? { boxShadow: "inset 3px 0 0 var(--accent)" }
                          : {}
                      }
                    >
                      {/* Icon */}
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all
  ${
    isActive
      ? "bg-[var(--accent)]/20"
      : "bg-[var(--surface-elevated)] group-hover:bg-[var(--border)]"
  }`}
                      >
                        {meta.icon}
                      </span>

                      {/* Label */}
                      <span className="relative flex-1 text-left text-xs font-bold truncate">
                        {meta.label}
                      </span>

                      {/* Count badge */}
                      <span
                        className={`relative text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 transition-all duration-200
                                        ${
                                          isActive
                                            ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                                            : "bg-[var(--border)] text-[var(--muted)]"
                                        }`}
                      >
                        {tabCount[t]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Progress strip for students */}
              {!isTeacher && materials.length > 0 && (
                <div className="px-4 py-3 border-t border-[var(--border)]">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
                      Progress
                    </span>
                    <span className="text-xs font-black text-[var(--accent)]">
                      {matProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                      style={{ width: `${matProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted)] mt-1.5 font-medium">
                    {completedMats.size}/{materials.length} materials done
                  </p>
                </div>
              )}

              {/* Quick stats for teacher */}
              {isTeacher && (
                <div className="px-4 pb-4">
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                    Overview
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Students",
                        val: course.enrollmentCount || 0,
                        color: "text-emerald-500",
                      },
                      {
                        label: "Materials",
                        val: materials.length,
                        color: "text-blue-500",
                      },
                      {
                        label: "Quizzes",
                        val: quizzes.length,
                        color: "text-pink-500",
                      },
                      {
                        label: "Live",
                        val: liveClasses.length,
                        color: "text-red-500",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl p-3 border border-[var(--border)] bg-[var(--surface-elevated)]"
                      >
                        <p className={`text-sm font-black ${s.color}`}>
                          {s.val}
                        </p>
                        <p className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-wider">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Mobile tab selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 md:hidden scrollbar-hide">
              {tabs.map((t) => {
                const meta = TAB_META[t];
                const isActive = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => navigate(`/course/${id}/${t}`)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap
                                text-xs font-bold transition-all duration-200 cursor-pointer shrink-0
                                ${
                                  isActive
                                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20"
                                    : "glass border border-[var(--border)]/20 text-[var(--muted)] hover:text-[var(--text)]"
                                }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                    <span
                      className={`text-[9px] font-black px-1 py-0.5 rounded ${isActive ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--border)]/20 text-[var(--muted)]"}`}
                    >
                      {tabCount[t]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface)] shadow-sm animate-fade-in transition-colors duration-300">
              <div className="animate-[fade-in_0.3s_ease_both]" key={tab}>
                {tab === "materials" && (
                  <MaterialsTab
                    materials={materials}
                    isTeacher={isTeacher}
                    completedMats={completedMats}
                    onToggleComplete={toggleComplete}
                    onDelete={deleteMaterial}
                    onAddClick={() => setModal("material")}
                  />
                )}
                {tab === "assignments" && (
                  <AssignmentsTab
                    assignments={assignments}
                    isTeacher={isTeacher}
                    mySubmissions={mySubmissions}
                    expandedSubs={expandedSubs}
                    submissionText={submissionText}
                    onSubmit={submitAssignment}
                    onToggleSubs={toggleSubs}
                    onDelete={deleteAssignment}
                    onGrade={(subId, score, feedback) => {
                      setGradingSubId(subId);
                      setGradeForm({
                        score: score ?? "",
                        feedback: feedback ?? "",
                      });
                    }}
                    onAddClick={() => setModal("assignment")}
                  />
                )}
                {tab === "quizzes" && (
                  <QuizzesTab
                    quizzes={quizzes}
                    isTeacher={isTeacher}
                    onDelete={deleteQuiz}
                    onAddClick={() => setModal("quiz")}
                  />
                )}
                {tab === "live-classes" && (
                  <LiveClassesTab
                    liveClasses={liveClasses}
                    isTeacher={isTeacher}
                    onStatusChange={setClassStatus}
                    onDelete={deleteLiveClass}
                    onJoin={joinClass}
                    onAddClick={() => setModal("live-class")}
                  />
                )}
                {tab === "students" && isTeacher && (
                  <StudentsTab students={students} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <GradeModal
        isOpen={!!gradingSubId}
        gradeForm={gradeForm}
        onSubmit={gradeSubmission}
        onClose={() => {
          setGradingSubId(null);
          setGradeForm({ score: "", feedback: "" });
        }}
        onChange={setGradeForm}
      />
      <MaterialModal
        isOpen={modal === "material"}
        form={matForm}
        saving={saving}
        onSubmit={saveMaterial}
        onClose={() => setModal(null)}
        onChange={setMatForm}
      />
      <AssignmentModal
        isOpen={modal === "assignment"}
        form={assForm}
        saving={saving}
        onSubmit={saveAssignment}
        onClose={() => setModal(null)}
        onChange={setAssForm}
      />
      <QuizModal
        isOpen={modal === "quiz"}
        form={quizForm}
        saving={saving}
        onSubmit={saveQuiz}
        onClose={() => setModal(null)}
        onChange={setQuizForm}
      />
      <LiveClassModal
        isOpen={modal === "live-class"}
        form={lcForm}
        saving={saving}
        onSubmit={saveLiveClass}
        onClose={() => setModal(null)}
        onChange={setLcForm}
      />
    </div>
  );
}

export default CourseView;
