import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const inputCls =
  "w-full px-4 py-3 border border-[var(--border)]/50 rounded-xl text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 focus:shadow-[0_4px_16px_-4px_var(--accent)] transition-all duration-300 glass text-[var(--text)] placeholder:text-[var(--muted)]/50 hover:border-[var(--accent)]/30";

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

  const load = () =>
    fetch(`/api/teachers/${user.id}/dashboard`)
      .then((r) => r.json())
      .then((d) => !d.error && setData(d));

  useEffect(() => { load(); }, [user.id]);

  const openCreate = () => {
    setEditCourse(null);
    setForm({ title: "", description: "", subject: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setForm({ title: c.title, description: c.description || "", subject: c.subject || "" });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const isEdit = !!editCourse;
      const res = await fetch(
        isEdit ? `/api/courses/${editCourse.id}` : "/api/courses",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...form, teacherId: user.id }),
        }
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
      await fetch(`/api/courses/${confirmDelete.id}`, {
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

  const totalMaterials = data.courses.reduce((s, c) => s + (c.materialCount || 0), 0);
  const totalQuizzes = data.courses.reduce((s, c) => s + (c.quizCount || 0), 0);

  const stats = [
    { icon: "📚", val: data.totalCourses, label: "Courses", bg: "from-blue-500/15 to-blue-600/5", color: "from-blue-500 to-blue-600" },
    { icon: "👨‍🎓", val: data.totalStudents, label: "Students", bg: "from-purple-500/15 to-purple-600/5", color: "from-purple-500 to-purple-600" },
    { icon: "📄", val: totalMaterials, label: "Materials", bg: "from-amber-500/15 to-amber-600/5", color: "from-amber-500 to-amber-600" },
    { icon: "🧠", val: totalQuizzes, label: "Quizzes", bg: "from-pink-500/15 to-pink-600/5", color: "from-pink-500 to-pink-600" },
    { icon: "📬", val: data.pendingSubmissions ?? 0, label: "Reviews", bg: "from-emerald-500/15 to-emerald-600/5", color: "from-emerald-500 to-emerald-600" },
    { icon: "📹", val: data.upcomingClasses?.length ?? 0, label: "Live", bg: "from-indigo-500/15 to-indigo-600/5", color: "from-indigo-500 to-indigo-600" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 z-10">
        {/* Header */}
        <div className="mb-12 animate-[slide-down_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="flex items-center gap-5 mb-2">
            <div className="text-5xl sm:text-6xl drop-shadow-lg animate-float">👋</div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] sc-title">
                Welcome back, <span className="gradient-text">{user.name.split(" ")[0]}</span>!
              </h1>
              <p className="text-sm font-medium text-[var(--muted)] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Manage your courses, track student progress, and inspire the future.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`group sc-card-premium glass rounded-2xl p-5 bg-gradient-to-br ${s.bg}
                         animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3
                              bg-gradient-to-br ${s.color} shadow-lg
                              group-hover:scale-110 group-hover:rotate-[-5deg] transition-all duration-500`}>
                <span className="brightness-0 invert text-sm">{s.icon}</span>
              </div>
              <div className="text-3xl font-extrabold text-[var(--text)] mb-1 tracking-tighter
                              animate-[count-up_0.8s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: `${200 + i * 80}ms` }}>
                {s.val}
              </div>
              <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Live Classes */}
        {data.upcomingClasses?.length > 0 && (
          <div className="mb-12 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-extrabold text-[var(--text)] mb-5 flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-xl">📹</span>
              Upcoming Live Classes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.upcomingClasses.map((lc, i) => (
                <div
                  key={lc.id}
                  className="group sc-card-premium glass rounded-2xl p-6 cursor-pointer hover-lift
                             animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => navigate(`/course/${lc.course?.id || lc.course}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${lc.status === "live"
                      ? "bg-red-500/15 text-red-500 animate-pulse border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                      : "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25"
                      }`}>
                      {lc.status === "live" ? "🔴 Live Now" : "🗓 Scheduled"}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--muted)]">
                      {new Date(lc.scheduledAt).toLocaleDateString()} · {new Date(lc.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors duration-300 line-clamp-2">
                    {lc.title}
                  </p>
                  {lc.course?.title && (
                    <p className="text-xs font-semibold text-[var(--muted)] mt-2">📚 {lc.course.title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course list header */}
        <div className="flex items-center justify-between mb-8 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: "300ms" }}>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl">🎯</span>
              My Courses
            </h2>
            <p className="text-sm font-medium text-[var(--muted)] mt-1 ml-[52px]">Manage and edit your entire curriculum</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 sc-btn-glow
                       rounded-xl text-sm font-bold cursor-pointer active:scale-95"
          >
            <span className="text-lg font-light leading-none">+</span> Create Course
          </button>
        </div>

        {data.courses.length === 0 ? (
          <div className="text-center py-24 sc-card-premium glass rounded-3xl animate-[scale-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="text-8xl mb-6 drop-shadow-2xl animate-float">📖</div>
            <div className="text-2xl font-extrabold mb-3 text-[var(--text)] sc-title">No courses yet</div>
            <div className="text-base text-[var(--muted)] max-w-sm mx-auto font-medium leading-relaxed">
              Create your first course to begin sharing your knowledge with the world.
            </div>
            <button
              onClick={openCreate}
              className="mt-8 px-8 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
            >
              Start Creating
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: "400ms" }}>
            {data.courses.map((c, i) => (
              <div
                key={c.id}
                className="group sc-card-premium glass rounded-2xl p-6 flex flex-col overflow-hidden
                           animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-transparent 
                               opacity-0 group-hover:opacity-100 group-hover:from-[var(--accent)]/5 transition-all duration-500 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <h3 className="text-xl font-extrabold text-[var(--text)] flex-1 leading-snug group-hover:text-[var(--accent)] transition-colors duration-300">
                      {c.title}
                    </h3>
                    {c.subject && (
                      <span className="px-3 py-1 bg-[var(--accent)]/12 text-[var(--accent)] rounded-lg text-[9px] uppercase font-bold tracking-wider whitespace-nowrap
                                       border border-[var(--accent)]/15">
                        {c.subject}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-[var(--muted)] mb-6 flex-1 line-clamp-3 leading-relaxed">
                    {c.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {[
                      { label: "Students", val: c.enrollmentCount || 0 },
                      { label: "Mats", val: c.materialCount || 0 },
                      { label: "Tasks", val: c.assignmentCount || 0 },
                      { label: "Live", val: c.liveClassCount || 0 },
                    ].map((s) => (
                      <div key={s.label} className="glass border border-[var(--border)]/30 rounded-xl p-2 text-center 
                                    group-hover:border-[var(--accent)]/20 transition-all duration-300">
                        <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider mb-0.5">{s.label}</div>
                        <div className="text-sm font-extrabold text-[var(--text)]">{s.val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/course/${c.id}`)}
                      className="flex-1 py-3 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95"
                    >
                      Manage →
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="px-3.5 py-3 glass hover:bg-[var(--accent)]/10 text-[var(--text)] rounded-xl text-sm 
                                 border border-[var(--border)]/40 cursor-pointer transition-all duration-300 
                                 hover:border-[var(--accent)]/40 active:scale-95"
                      title="Edit course"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfirmDelete(c)}
                      className="px-3.5 py-3 bg-red-500/8 hover:bg-red-500/15 text-red-500 rounded-xl text-sm 
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
      </div>

      <Footer />

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setError(""); } }}
        >
          <div className="glass-heavy border border-[var(--border)]/50 rounded-2xl p-8 w-full max-w-lg 
                          shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)]
                          animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
            <h3 className="text-2xl font-extrabold text-[var(--text)] mb-8 flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl">📝</span>
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
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1">Subject</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Physics"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2 ml-1">Description</label>
                <textarea
                  className={`${inputCls} resize-y min-h-[120px]`}
                  placeholder="Describe what students will learn..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 font-medium
                                animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
                  <span>⚠️</span> {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]/30">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(""); }}
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
                  {loading ? "Saving..." : editCourse ? "Save Changes" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className="glass-heavy border border-[var(--border)]/50 rounded-2xl p-8 w-full max-w-sm 
                          shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)] text-center
                          animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-extrabold text-[var(--text)] mb-3 sc-title">Delete Course?</h3>
            <p className="text-sm font-medium text-[var(--muted)] mb-6 leading-relaxed">
              <strong className="text-[var(--text)] font-bold">"{confirmDelete.title}"</strong> will be permanently deleted
              along with all materials and student records.
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
