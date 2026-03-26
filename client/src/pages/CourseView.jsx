import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseHeader from "../components/CourseView/CourseHeader";
import TabNavigation from "../components/CourseView/TabNavigation";
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

function CourseView() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isTeacher = user.role === "teacher";

  // Core data
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [students, setStudents] = useState([]);

  // Student-specific
  const [completedMats, setCompletedMats] = useState(new Set());
  const [matProgress, setMatProgress] = useState(0);

  const [tab, setTab] = useState("materials");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [mySubmissions, setMySubmissions] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});
  const [submissionText, setSubmissionText] = useState({});
  const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });
  const [gradingSubId, setGradingSubId] = useState(null);
  const [matForm, setMatForm] = useState({ title: "", description: "", type: "video", fileUrl: "" });
  const [assForm, setAssForm] = useState({ title: "", description: "", dueDate: "", maxScore: 100 });
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    timeLimit: 0,
    questions: [{ question: "", options: ["", "", "", ""], answer: 0 }],
  });
  const [lcForm, setLcForm] = useState({ title: "", description: "", scheduledAt: "", meetingLink: "" });

  // Loaders
  const loadCourse = useCallback(() =>
    fetch(`/api/courses/${id}`).then(r => r.json()).then(d => !d.error && setCourse(d)), [id]);

  const loadMaterials = useCallback(() =>
    fetch(`/api/courses/${id}/materials`).then(r => r.json())
      .then(d => Array.isArray(d) && setMaterials(d)), [id]);

  const loadAssignments = useCallback(() =>
    fetch(`/api/courses/${id}/assignments`).then(r => r.json())
      .then(d => Array.isArray(d) && setAssignments(d)), [id]);

  const loadQuizzes = useCallback(() =>
    fetch(`/api/courses/${id}/quizzes`).then(r => r.json())
      .then(d => Array.isArray(d) && setQuizzes(d)), [id]);

  const loadLiveClasses = useCallback(() =>
    fetch(`/api/courses/${id}/live-classes`).then(r => r.json())
      .then(d => Array.isArray(d) && setLiveClasses(d)), [id]);

  const loadStudents = useCallback(() => {
    const qs = isTeacher ? `?teacherId=${user.id}` : "";
    fetch(`/api/courses/${id}/students${qs}`).then(r => r.json())
      .then(d => d.students && setStudents(d.students));
  }, [id, isTeacher, user.id]);

  const loadProgress = useCallback(() => {
    if (isTeacher) return;
    fetch(`/api/courses/${id}/materials/progress?studentId=${user.id}`).then(r => r.json())
      .then(d => {
        if (!d.error) {
          setMatProgress(d.progress ?? 0);
          setCompletedMats(new Set(
            (d.materials || []).filter(m => m.isCompleted).map(m => m.id)
          ));
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
    assignments.forEach(a => {
      fetch(`/api/assignments/${a.id}/my-submission?studentId=${user.id}`)
        .then(r => r.json())
        .then(s => { if (!s.error) setMySubmissions(p => ({ ...p, [a.id]: s })); });
    });
  }, [assignments, isTeacher, user.id]);

  // Material actions
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
    setMaterials(p => p.filter(m => m.id !== mid));
  };

  const toggleComplete = async (mid) => {
    const isDone = completedMats.has(mid);
    await fetch(`/api/courses/${id}/materials/${mid}/complete`, {
      method: isDone ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: user.id }),
    });
    setCompletedMats(prev => {
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
    setAssignments(p => p.filter(a => a.id !== aid));
    setExpandedSubs(p => { const n = { ...p }; delete n[aid]; return n; });
  };

  const submitAssignment = async (aid, content, isUpdate = false) => {
    if (!isUpdate) {
      if (!content?.trim()) return;
      const res = await fetch(`/api/assignments/${aid}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, content }),
      });
      const data = await res.json();
      if (!data.error) setMySubmissions(p => ({ ...p, [aid]: data }));
    } else {
      setSubmissionText(p => ({ ...p, [aid]: content }));
    }
  };

  const toggleSubs = async (aid) => {
    if (expandedSubs[aid] !== undefined) {
      setExpandedSubs(p => { const n = { ...p }; delete n[aid]; return n; });
      return;
    }
    const data = await fetch(`/api/assignments/${aid}/submissions?teacherId=${user.id}`)
      .then(r => r.json());
    setExpandedSubs(p => ({ ...p, [aid]: Array.isArray(data) ? data : [] }));
  };

  const gradeSubmission = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/assignments/submissions/${gradingSubId}/grade`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(gradeForm.score), feedback: gradeForm.feedback, teacherId: user.id }),
    });
    const updated = await res.json();
    if (!updated.error) {
      setExpandedSubs(p => {
        const n = { ...p };
        for (const aid in n) {
          if (Array.isArray(n[aid]))
            n[aid] = n[aid].map(s => s.id === gradingSubId ? { ...s, ...updated } : s);
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
    if (quizForm.questions.some(q => !q.question || q.options.some(o => !o))) return;
    setSaving(true);
    const payload = {
      title: quizForm.title,
      description: quizForm.description,
      timeLimit: Number(quizForm.timeLimit) || 0,
      teacherId: user.id,
      questions: quizForm.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctOption: q.answer,
        points: 1,
      })),
    };
    const res = await fetch(`/api/courses/${id}/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setModal(null);
      setQuizForm({ title: "", description: "", timeLimit: 0, questions: [{ question: "", options: ["", "", "", ""], answer: 0 }] });
      loadQuizzes();
    }
    setSaving(false);
  };

  const deleteQuiz = async (qid) => {
    await fetch(`/api/quizzes/${qid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: user.id }),
    });
    setQuizzes(p => p.filter(q => q.id !== qid));
  };

  // Live Class actions
  const saveLiveClass = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/courses/${id}/live-classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lcForm, teacherId: user.id }),
    });
    if (res.ok) {
      setModal(null);
      setLcForm({ title: "", description: "", scheduledAt: "", meetingLink: "" });
      loadLiveClasses();
    }
    setSaving(false);
  };

  const deleteLiveClass = async (lcId) => {
    await fetch(`/api/live-classes/${lcId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: user.id }),
    });
    setLiveClasses(p => p.filter(lc => lc.id !== lcId));
  };

  const setClassStatus = async (lcId, status) => {
    const res = await fetch(`/api/live-classes/${lcId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, teacherId: user.id }),
    });
    const updated = await res.json();
    if (!updated.error)
      setLiveClasses(p => p.map(lc => lc.id === lcId ? { ...lc, status: updated.status } : lc));
  };

  const joinClass = async (lcId, meetingLink) => {
    await fetch(`/api/live-classes/${lcId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (meetingLink) window.open(meetingLink, "_blank");
  };

  if (!course)
    return (
      <div className="min-h-screen bg-transparent text-[var(--text)] flex flex-col relative overflow-hidden">
        <Navbar showBack />
        <div className="flex-1 flex items-center justify-center text-[var(--muted)]">Loading...</div>
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

  const tabLabel = { "live-classes": "Live Classes" };

  return (
    <div className="min-h-screen bg-transparent text-[var(--text)] flex flex-col relative overflow-hidden">
      <Navbar showBack />
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

        <CourseHeader
          course={course}
          materials={materials}
          assignments={assignments}
          quizzes={quizzes}
          liveClasses={liveClasses}
          isTeacher={isTeacher}
          matProgress={matProgress}
        />

        <TabNavigation
          tabs={tabs}
          tab={tab}
          setTab={setTab}
          tabCount={tabCount}
          tabLabel={tabLabel}
        />

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
              setGradeForm({ score: score ?? "", feedback: feedback ?? "" });
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

      <Footer />

      <GradeModal
        isOpen={!!gradingSubId}
        gradeForm={gradeForm}
        onSubmit={gradeSubmission}
        onClose={() => { setGradingSubId(null); setGradeForm({ score: "", feedback: "" }); }}
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