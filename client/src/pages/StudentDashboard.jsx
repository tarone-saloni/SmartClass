import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function StudentDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [enrollingId, setEnrollingId] = useState(null);

  const load = () => {
    fetch(`/api/students/${user.id}/dashboard`).then(r => r.json()).then(d => setEnrolled(d.enrolledCourses || []));
    fetch('/api/courses').then(r => r.json()).then(d => Array.isArray(d) && setAllCourses(d));
  };

  useEffect(() => { load(); }, [user.id]);

  const enroll = async courseId => {
    setEnrollingId(courseId);
    await fetch(`/api/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: user.id }),
    });
    setEnrollingId(null);
    load();
  };

  const enrolledIds = enrolled.map(c => c.id);
  const available = allCourses.filter(c => !enrolledIds.includes(c.id));
  const totalCompleted = enrolled.reduce((s, c) => s + c.completedMaterials, 0);
  const totalQuizzes = enrolled.reduce((s, c) => s + c.quizzesTaken, 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar user={user} onLogout={onLogout} />
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Welcome back, {user.name}! 🎒</h1>
          <p className="text-sm text-[var(--muted)]">Continue your learning journey</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '📚', val: enrolled.length, label: 'Enrolled Courses' },
            { icon: '✅', val: totalCompleted, label: 'Materials Completed' },
            { icon: '🏆', val: totalQuizzes, label: 'Quizzes Taken' },
          ].map(s => (
            <div key={s.label} className="bg-[var(--surface)] rounded-xl px-6 py-5 border border-[var(--border)] shadow-sm">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold text-[var(--text)] mb-1">{s.val}</div>
              <p className="text-sm text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>

        {enrolled.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-[var(--text)] mb-5">My Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {enrolled.map(c => (
                <div key={c.id} className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-1.5">
                    <h3 className="text-base font-bold text-[var(--text)] flex-1 mr-2 leading-snug">{c.title}</h3>
                    {c.subject && (
                      <span className="px-2.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-xs font-semibold whitespace-nowrap">
                        {c.subject}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-3">👨‍🏫 {c.teacher?.name}</p>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-[var(--muted)] mb-1.5">
                      <span>Progress</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="h-2 bg-[var(--border)]/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-4 text-xs text-[var(--muted)]">
                    <span>📄 {c.completedMaterials}/{c.materialCount} materials</span>
                    <span>🏆 {c.quizzesTaken}/{c.quizCount} quizzes</span>
                  </div>
                  <button
                    onClick={() => navigate(`/course/${c.id}`)}
                    className="w-full py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
                  >
                    Continue Learning →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {available.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-[var(--text)] mb-5">Available Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {available.map(c => (
                <div key={c.id} className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-1.5">
                    <h3 className="text-base font-bold text-[var(--text)] flex-1 mr-2 leading-snug">{c.title}</h3>
                    {c.subject && (
                      <span className="px-2.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-xs font-semibold whitespace-nowrap">
                        {c.subject}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-2">👨‍🏫 {c.teacher?.name}</p>
                  <p className="text-sm text-[var(--muted)] mb-4 leading-relaxed">{c.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-3 mb-4 text-xs text-[var(--muted)]">
                    <span>👨‍🎓 {c.enrollmentCount} enrolled</span>
                    <span>📄 {c.materialCount} materials</span>
                  </div>
                  <button
                    onClick={() => enroll(c.id)}
                    disabled={enrollingId === c.id}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-600 rounded-lg text-sm font-semibold border border-emerald-100 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    {enrollingId === c.id ? 'Enrolling...' : '+ Enroll Now'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {enrolled.length === 0 && available.length === 0 && (
          <div className="text-center py-16 text-[var(--muted)]">
            <div className="text-5xl mb-3">🎓</div>
            <div className="text-base">No courses available yet. Ask your teacher to create one!</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
