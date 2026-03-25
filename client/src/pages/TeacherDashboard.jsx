import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors';

function TeacherDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [data, setData] = useState({ courses: [], totalStudents: 0, totalCourses: 0 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '' });
  const [loading, setLoading] = useState(false);

  const load = () =>
    fetch(`/api/teachers/${user.id}/dashboard`).then(r => r.json()).then(setData);

  useEffect(() => { load(); }, [user.id]);

  const handleCreate = async e => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, teacherId: user.id }),
    });
    setLoading(false);
    if (res.ok) { setShowModal(false); setForm({ title: '', description: '', subject: '' }); load(); }
  };

  const totalMaterials = data.courses.reduce((s, c) => s + c.materialCount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={onLogout} />
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {user.name}! 👋</h1>
          <p className="text-sm text-gray-500">Manage your courses and track student progress</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '📚', val: data.totalCourses, label: 'Total Courses' },
            { icon: '👨‍🎓', val: data.totalStudents, label: 'Total Students' },
            { icon: '📄', val: totalMaterials, label: 'Materials Uploaded' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl px-6 py-5 border border-gray-100 shadow-sm">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{s.val}</div>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">My Courses</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
          >
            + Create Course
          </button>
        </div>

        {data.courses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📖</div>
            <div className="text-base text-gray-500 font-medium mb-1">No courses yet</div>
            <div className="text-sm">Create your first course to get started</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.courses.map(c => (
              <div key={c.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900 flex-1 mr-2 leading-snug">{c.title}</h3>
                  {c.subject && (
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold whitespace-nowrap">
                      {c.subject}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{c.description || 'No description'}</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="text-xs text-gray-400">👨‍🎓 {c.enrollmentCount} students</span>
                  <span className="text-xs text-gray-400">📄 {c.materialCount} materials</span>
                  <span className="text-xs text-gray-400">📋 {c.assignmentCount} assignments</span>
                  <span className="text-xs text-gray-400">🏆 {c.quizCount} quizzes</span>
                </div>
                <button
                  onClick={() => navigate(`/course/${c.id}`)}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                  Manage Course →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Course</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Course Title *</label>
                <input className={inputCls} placeholder="e.g. Introduction to Physics" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject</label>
                <input className={inputCls} placeholder="e.g. Science, Math, History" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-y min-h-[80px] focus:border-indigo-500 transition-colors"
                  placeholder="Brief course overview..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium border-none cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold border-none cursor-pointer">
                  {loading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
