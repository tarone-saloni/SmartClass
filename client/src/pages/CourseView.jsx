import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api.js";
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
      setModal(null);
      setMatForm({
        title: "",
        description: "",
        type: "video",
        fileUrl: "",
        uploadFile: null,
        uploadMode: "url",
      });
      loadMaterials();
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
      setModal(null);
      setAssForm({ title: "", description: "", dueDate: "", maxScore: 100 });
      loadAssignments();
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
      setModal(null);
      setQuizForm({
        title: "",
        description: "",
        timeLimit: 0,
        questions: [{ question: "", options: ["", "", "", ""], answer: 0 }],
      });
      loadQuizzes();
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white flex flex-col relative overflow-hidden">
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
            <div className="glass-dark rounded-2xl overflow-hidden border border-white/5 shadow-2xl glow">
              {/* Sidebar header */}
              <div className="px-4 py-4 border-b border-white/5 bg-gradient-to-r from-[#7CFF4F]/10 to-transparent">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Course Content
                </p>
                <p className="text-sm font-semibold text-white truncate">
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
text-sm font-semibold transition-all duration-300 cursor-pointer mb-1 relative overflow-hidden
${
  isActive
    ? "text-[#7CFF4F] bg-[#7CFF4F]/10 glow"
    : "text-gray-400 hover:text-white hover:bg-white/5"
}`}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(90deg, var(--accent)/12%, var(--accent)/4%)",
                              boxShadow: "inset 3px 0 0 var(--accent)",
                            }
                          : {}
                      }
                    >
                      {/* Hover bg */}
                      {!isActive && (
                        <span className="absolute inset-0 rounded-xl bg-[var(--border)]/0 group-hover:bg-[var(--border)]/12 transition-all duration-200" />
                      )}

                      {/* Icon */}
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all
  ${
    isActive
      ? "bg-[#7CFF4F]/20 text-[#7CFF4F]"
      : "bg-white/5 group-hover:bg-white/10"
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
                                            : "bg-[var(--border)]/20 text-[var(--muted)] group-hover:bg-[var(--border)]/30"
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
                <div className="px-4 py-3 border-t border-[var(--border)]/15">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
                      Progress
                    </span>
                    <span className="text-xs font-black text-[var(--accent)]">
                      {matProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7CFF4F] to-lime-400 rounded-full transition-all duration-700 shadow-[0_0_10px_#7CFF4F]"
                      style={{ width: `${matProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted)]/70 mt-1.5 font-medium">
                    {completedMats.size}/{materials.length} materials done
                  </p>
                </div>
              )}

              {/* Quick stats for teacher */}
              {isTeacher && (
                <div className="px-4 py-2 rounded-xl bg-[#7CFF4F] text-black font-semibold glow-hover transition-all duration-300">
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                    Overview
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Students",
                        val: course.enrollmentCount || 0,
                        color: "text-emerald-400",
                      },
                      {
                        label: "Materials",
                        val: materials.length,
                        color: "text-emerald-400",
                      },
                      {
                        label: "Quizzes",
                        val: quizzes.length,
                        color: "text-pink-400",
                      },
                      {
                        label: "Live",
                        val: liveClasses.length,
                        color: "text-red-400",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="glass-dark rounded-2xl p-6 border border-white/10 shadow-2xl glow"
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
            <div className="glass-dark rounded-2xl p-5 border border-white/5 shadow-xl glow animate-fade-in">
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
