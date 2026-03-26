import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const inputCls =
  "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm outline-none focus:border-[var(--accent)] transition-colors bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/70";

function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ courses: [], totalStudents: 0, totalCourses: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null); // null = create, object = edit
  const [confirmDelete, setConfirmDelete] = useState(null); // course to delete
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

  const totalMaterials = data.courses.reduce((s, c) => s + c.materialCount, 0);
  const totalAssignments = data.courses.reduce((s, c) => s + c.assignmentCount, 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">
            Welcome, {user.name}! 👋
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Manage your courses and track student progress
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "📚", val: data.totalCourses, label: "Total Courses" },
            { icon: "👨‍🎓", val: data.totalStudents, label: "Total Students" },
            { icon: "📄", val: totalMaterials, label: "Materials" },
            { icon: "📋", val: totalAssignments, label: "Assignments" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[var(--surface)] rounded-xl px-5 py-4 border border-[var(--border)] shadow-sm"
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-[var(--text)]">{s.val}</div>
              <p className="text-xs text-[var(--muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Course list header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--text)]">My Courses</h2>
          <button
            onClick={openCreate}
            className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
          >
            + Create Course
          </button>
        </div>

        {data.courses.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted)]">
            <div className="text-5xl mb-3">📖</div>
            <div className="text-base font-medium mb-1">No courses yet</div>
            <div className="text-sm">Create your first course to get started</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.courses.map((c) => (
              <div
                key={c.id}
                className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-[var(--text)] flex-1 mr-2 leading-snug">
                    {c.title}
                  </h3>
                  {c.subject && (
                    <span className="px-2.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-xs font-semibold whitespace-nowrap">
                      {c.subject}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted)] mb-4 leading-relaxed flex-1">
                  {c.description || "No description"}
                </p>
                <div className="flex flex-wrap gap-3 mb-4 text-xs text-[var(--muted)]">
                  <span>👨‍🎓 {c.enrollmentCount} students</span>
                  <span>📄 {c.materialCount} materials</span>
                  <span>📋 {c.assignmentCount} assignments</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/course/${c.id}`)}
                    className="flex-1 py-2 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
                  >
                    Manage →
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="px-3 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/40 text-[var(--muted)] rounded-lg text-sm border border-[var(--border)] cursor-pointer transition-colors"
                    title="Edit course"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-sm border border-red-100 cursor-pointer transition-colors"
                    title="Delete course"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setError(""); } }}
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--text)] mb-6">
              {editCourse ? "Edit Course" : "Create New Course"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Course Title *
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. Introduction to Physics"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Subject
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. Science, Math, History"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Description
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-lg text-sm outline-none resize-y min-h-[80px] focus:border-[var(--accent)] transition-colors bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/70"
                  placeholder="Brief course overview..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(""); }}
                  className="px-5 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/40 text-[var(--text)] rounded-lg text-sm font-medium border border-[var(--border)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer"
                >
                  {loading ? "Saving..." : editCourse ? "Save Changes" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
          onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 w-full max-w-sm shadow-2xl text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">Delete Course?</h3>
            <p className="text-sm text-[var(--muted)] mb-1">
              <strong className="text-[var(--text)]">"{confirmDelete.title}"</strong> will be permanently deleted
              along with all its materials and assignments.
            </p>
            <p className="text-xs text-red-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2 bg-[var(--bg)] hover:bg-[var(--border)]/40 text-[var(--text)] rounded-lg text-sm font-medium border border-[var(--border)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
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
