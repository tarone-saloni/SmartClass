import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import socket from '../socket';

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors';
const textareaCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-y focus:border-indigo-500 transition-colors';

function VideoEmbed({ url }) {
  const yt = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) {
    return (
      <div className="mt-3 rounded-lg overflow-hidden">
        <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${yt[1]}`} frameBorder="0" allowFullScreen className="block rounded-lg" />
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium mt-2 hover:underline">
      ▶ Open Video
    </a>
  );
}

function CourseView({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('materials');
  const [completedIds, setCompletedIds] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});
  const [submissionText, setSubmissionText] = useState({});
  const [modal, setModal] = useState(null);
  const isTeacher = user.role === 'teacher';

  const [matForm, setMatForm] = useState({ title: '', type: 'video', url: '' });
  const [matFile, setMatFile] = useState(null);
  const [assForm, setAssForm] = useState({ title: '', description: '', dueDate: '' });
  const [quizForm, setQuizForm] = useState({ title: '', questions: [{ question: '', options: ['', '', '', ''], answer: 0 }] });
  const [saving, setSaving] = useState(false);

  const load = () => fetch(`/api/courses/${id}`).then(r => r.json()).then(setCourse);

  useEffect(() => {
    load();
    socket.emit('join-course', { courseId: id });
    const onMat = m => setCourse(p => p ? { ...p, materials: [...p.materials, m] } : p);
    const onAss = a => setCourse(p => p ? { ...p, assignments: [...p.assignments, a] } : p);
    const onQuiz = q => setCourse(p => p ? { ...p, quizzes: [...p.quizzes, q] } : p);
    socket.on('new-material', onMat);
    socket.on('new-assignment', onAss);
    socket.on('new-quiz', onQuiz);
    return () => {
      socket.emit('leave-course', { courseId: id });
      socket.off('new-material', onMat);
      socket.off('new-assignment', onAss);
      socket.off('new-quiz', onQuiz);
    };
  }, [id]);

  useEffect(() => {
    if (!isTeacher && course) {
      course.assignments.forEach(a =>
        fetch(`/api/assignments/${a.id}/submission/${user.id}`).then(r => r.json())
          .then(s => s && setSubmissions(p => ({ ...p, [a.id]: s })))
      );
      course.quizzes.forEach(q =>
        fetch(`/api/quizzes/${q.id}/result/${user.id}`).then(r => r.json())
          .then(r => r && setQuizResults(p => ({ ...p, [q.id]: r })))
      );
    }
  }, [course?.id, isTeacher]);

  const markComplete = async mid => {
    await fetch(`/api/materials/${mid}/complete`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: user.id }),
    });
    setCompletedIds(p => [...p, mid]);
  };

  const submitAssignment = async aid => {
    const content = submissionText[aid];
    if (!content?.trim()) return;

    const res = await fetch(`/api/assignments/${aid}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: user.id, content }),
    });

    const data = await res.json();
    setSubmissions(p => ({ ...p, [aid]: data }));
  };

  const toggleSubs = async aid => {
    if (expandedSubs[aid]) { setExpandedSubs(p => ({ ...p, [aid]: null })); return; }
    const data = await fetch(`/api/assignments/${aid}/submissions`).then(r => r.json());
    setExpandedSubs(p => ({ ...p, [aid]: data }));
  };

  const deleteMaterial = async mid => {
    await fetch(`/api/materials/${mid}`, { method: 'DELETE' });
    setCourse(p => ({ ...p, materials: p.materials.filter(m => m.id !== mid) }));
  };

  const deleteAssignment = async aid => {
    await fetch(`/api/assignments/${aid}`, { method: 'DELETE' });
    setCourse(p => ({ ...p, assignments: p.assignments.filter(a => a.id !== aid) }));
  };

  const deleteQuiz = async qid => {
    await fetch(`/api/quizzes/${qid}`, { method: 'DELETE' });
    setCourse(p => ({ ...p, quizzes: p.quizzes.filter(q => q.id !== qid) }));
  };

  const saveMaterial = async e => {
    e.preventDefault(); setSaving(true);
    const fd = new FormData();
    fd.append('title', matForm.title);
    fd.append('type', matForm.type);
    if (matFile) fd.append('file', matFile); else fd.append('url', matForm.url);
    await fetch(`/api/courses/${id}/materials`, { method: 'POST', body: fd });
    setSaving(false); setModal(null); setMatForm({ title: '', type: 'video', url: '' }); setMatFile(null); load();
  };

  const saveAssignment = async e => {
    e.preventDefault(); setSaving(true);
    await fetch(`/api/courses/${id}/assignments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assForm),
    });
    setSaving(false); setModal(null); setAssForm({ title: '', description: '', dueDate: '' }); load();
  };

  const saveQuiz = async e => {
    e.preventDefault();
    if (quizForm.questions.some(q => !q.question || q.options.some(o => !o))) return;
    setSaving(true);
    await fetch(`/api/courses/${id}/quizzes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizForm),
    });
    setSaving(false); setModal(null);
    setQuizForm({ title: '', questions: [{ question: '', options: ['', '', '', ''], answer: 0 }] });
    load();
  };

  const updateQ = (qi, field, val) =>
    setQuizForm(p => ({ ...p, questions: p.questions.map((q, i) => i === qi ? { ...q, [field]: val } : q) }));

  const updateOpt = (qi, oi, val) =>
    setQuizForm(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q
      ),
    }));

  const addQuestion = () =>
    setQuizForm(p => ({ ...p, questions: [...p.questions, { question: '', options: ['', '', '', ''], answer: 0 }] }));

  const removeQuestion = qi =>
    setQuizForm(p => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }));

  if (!course) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={onLogout} showBack />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    </div>
  );

  const tabs = isTeacher ? ['materials', 'assignments', 'quizzes', 'students'] : ['materials', 'assignments', 'quizzes'];
  const tabCount = { materials: course.materials.length, assignments: course.assignments.length, quizzes: course.quizzes.length, students: course.enrolledStudents.length };

  const scoreCls = pct => pct >= 70 ? 'bg-emerald-100 text-emerald-700' : pct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';

  const modalOverlay = (onClose, children) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={onLogout} showBack />
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Course header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-7 text-white mb-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold mb-1.5">{course.title}</h1>
              <p className="text-sm opacity-80 mb-1">👨‍🏫 {course.teacher?.name}</p>
              {course.description && <p className="text-sm opacity-75 leading-relaxed">{course.description}</p>}
            </div>
            {course.subject && (
              <span className="px-3.5 py-1.5 bg-white/20 rounded-full text-sm font-semibold whitespace-nowrap">
                {course.subject}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b-2 border-gray-200 mb-6">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-0.5 transition-colors capitalize bg-transparent border-x-0 border-t-0 cursor-pointer ${
                tab === t
                  ? 'text-indigo-600 border-b-indigo-600 font-semibold'
                  : 'text-gray-500 border-b-transparent hover:text-indigo-500'
              }`}
            >
              {t} ({tabCount[t]})
            </button>
          ))}
        </div>

        {/* ── MATERIALS ── */}
        {tab === 'materials' && (
          <div>
            {isTeacher && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">Course Materials</h2>
                <button onClick={() => setModal('material')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors">
                  + Upload Material
                </button>
              </div>
            )}
            {course.materials.length === 0
              ? <div className="text-center py-14 text-gray-400 text-sm">No materials yet{isTeacher ? '. Upload your first one!' : '.'}</div>
              : <div className="space-y-3">
                {course.materials.map(m => {
                  const done = completedIds.includes(m.id);
                  const typeCls = m.type === 'video' ? 'bg-red-100 text-red-600' : m.type === 'pdf' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                  const typeLabel = m.type === 'video' ? '▶ Video' : m.type === 'pdf' ? '📄 PDF' : '📝 Notes';
                  return (
                    <div key={m.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{m.title}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeCls}`}>{typeLabel}</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-1">{new Date(m.uploadedAt).toLocaleDateString()}</p>
                          {m.type === 'video' && m.url && <VideoEmbed url={m.url} />}
                          {m.type !== 'video' && m.url && (
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium mt-1 hover:underline">
                              📎 Open {m.type}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {!isTeacher && (
                            done
                              ? <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">✓ Done</span>
                              : <button onClick={() => markComplete(m.id)} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-semibold border-none cursor-pointer">Mark Done</button>
                          )}
                          {isTeacher && (
                            <button onClick={() => deleteMaterial(m.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-semibold border-none cursor-pointer">Delete</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {/* ── ASSIGNMENTS ── */}
        {tab === 'assignments' && (
          <div>
            {isTeacher && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">Assignments</h2>
                <button onClick={() => setModal('assignment')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors">
                  + Add Assignment
                </button>
              </div>
            )}
            {course.assignments.length === 0
              ? <div className="text-center py-14 text-gray-400 text-sm">No assignments yet{isTeacher ? '. Create one!' : '.'}</div>
              : <div className="space-y-3">
                {course.assignments.map(a => {
                  const mySub = submissions[a.id];
                  return (
                    <div key={a.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{a.title}</p>
                          {a.dueDate && <p className="text-xs text-gray-400 mb-1">Due: {new Date(a.dueDate).toLocaleDateString()}</p>}
                          {a.description && <p className="text-sm text-gray-500 leading-relaxed mt-1">{a.description}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {isTeacher
                            ? <>
                              <button onClick={() => toggleSubs(a.id)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold border-none cursor-pointer">
                                {expandedSubs[a.id] ? 'Hide' : 'Submissions'}
                              </button>
                              <button onClick={() => deleteAssignment(a.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-semibold border-none cursor-pointer">Delete</button>
                            </>
                            : mySub && <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">✓ Submitted</span>
                          }
                        </div>
                      </div>

                      {/* Student submission form */}
                      {!isTeacher && !mySub && (
                        <div className="mt-4 space-y-2">
                          <textarea
                            className={`${textareaCls} min-h-[80px]`}
                            placeholder="Write your answer here..."
                            value={submissionText[a.id] || ''}
                            onChange={e => setSubmissionText(p => ({ ...p, [a.id]: e.target.value }))}
                          />
                          <div className="flex justify-end">
                            <button onClick={() => submitAssignment(a.id)} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-semibold border-none cursor-pointer">
                              Submit
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Student submitted content */}
                      {!isTeacher && mySub && (
                        <div className="mt-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Your submission</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{mySub.content}</p>
                        </div>
                      )}

                      {/* Teacher submissions list */}
                      {isTeacher && expandedSubs[a.id] && (
                        <div className="mt-4 space-y-2">
                          {expandedSubs[a.id].length === 0
                            ? <p className="text-xs text-gray-400 italic">No submissions yet</p>
                            : expandedSubs[a.id].map(s => (
                              <div key={s.id} className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-600 mb-1">{s.student?.name} · {new Date(s.submittedAt).toLocaleString()}</p>
                                <p className="text-sm text-gray-600 leading-relaxed">{s.content}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {/* ── QUIZZES ── */}
        {tab === 'quizzes' && (
          <div>
            {isTeacher && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">Quizzes</h2>
                <button onClick={() => setModal('quiz')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors">
                  + Create Quiz
                </button>
              </div>
            )}
            {course.quizzes.length === 0
              ? <div className="text-center py-14 text-gray-400 text-sm">No quizzes yet{isTeacher ? '. Create one!' : '.'}</div>
              : <div className="space-y-3">
                {course.quizzes.map(q => {
                  const result = quizResults[q.id];
                  return (
                    <div key={q.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{q.title}</p>
                        <p className="text-xs text-gray-400">{q.questions?.length} questions · {new Date(q.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {isTeacher
                          ? <button onClick={() => deleteQuiz(q.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-semibold border-none cursor-pointer">Delete</button>
                          : result
                            ? <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${scoreCls(result.percentage)}`}>
                              {result.score}/{result.total} ({result.percentage}%)
                            </span>
                            : <button onClick={() => navigate(`/quiz/${q.id}`)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold border-none cursor-pointer">
                              Take Quiz
                            </button>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {/* ── STUDENTS (teacher) ── */}
        {tab === 'students' && isTeacher && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            {course.enrolledStudents.length === 0
              ? <div className="text-center py-10 text-gray-400 text-sm">No students enrolled yet</div>
              : course.enrolledStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {s.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* ── MODAL: Upload Material ── */}
      {modal === 'material' && modalOverlay(() => setModal(null), (
        <>
          <h3 className="text-lg font-bold text-gray-900 mb-5">Upload Material</h3>
          <form onSubmit={saveMaterial} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
              <input className={inputCls} value={matForm.title} onChange={e => setMatForm({ ...matForm, title: e.target.value })} placeholder="Material title" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
              <select className={inputCls} value={matForm.type} onChange={e => setMatForm({ ...matForm, type: e.target.value })}>
                <option value="video">Video (YouTube URL)</option>
                <option value="notes">Notes (File)</option>
                <option value="pdf">PDF (File)</option>
              </select>
            </div>
            {matForm.type === 'video'
              ? <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">YouTube URL *</label>
                <input className={inputCls} value={matForm.url} onChange={e => setMatForm({ ...matForm, url: e.target.value })} placeholder="https://youtube.com/watch?v=..." required />
              </div>
              : <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Upload File *</label>
                <input type="file" onChange={e => setMatFile(e.target.files[0])} required className="text-sm text-gray-600" />
              </div>
            }
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium border-none cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold border-none cursor-pointer">
                {saving ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </>
      ))}

      {/* ── MODAL: Create Assignment ── */}
      {modal === 'assignment' && modalOverlay(() => setModal(null), (
        <>
          <h3 className="text-lg font-bold text-gray-900 mb-5">Create Assignment</h3>
          <form onSubmit={saveAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
              <input className={inputCls} value={assForm.title} onChange={e => setAssForm({ ...assForm, title: e.target.value })} placeholder="Assignment title" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
              <textarea className={`${textareaCls} min-h-[70px]`} value={assForm.description} onChange={e => setAssForm({ ...assForm, description: e.target.value })} placeholder="Instructions for students..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date</label>
              <input type="date" className={inputCls} value={assForm.dueDate} onChange={e => setAssForm({ ...assForm, dueDate: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium border-none cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold border-none cursor-pointer">
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </>
      ))}

      {/* ── MODAL: Create Quiz ── */}
      {modal === 'quiz' && modalOverlay(() => setModal(null), (
        <>
          <h3 className="text-lg font-bold text-gray-900 mb-5">Create Quiz</h3>
          <form onSubmit={saveQuiz} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Quiz Title *</label>
              <input className={inputCls} value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Quiz title" required />
            </div>

            {quizForm.questions.map((q, qi) => (
              <div key={qi} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500">Question {qi + 1}</span>
                  {quizForm.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer text-lg leading-none">×</button>
                  )}
                </div>
                <input
                  className={`${inputCls} mb-3`}
                  placeholder="Question text..."
                  value={q.question}
                  onChange={e => updateQ(qi, 'question', e.target.value)}
                  required
                />
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={q.answer === oi}
                      onChange={() => updateQ(qi, 'answer', oi)}
                      className="cursor-pointer accent-indigo-600"
                      title="Mark as correct answer"
                    />
                    <input
                      className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors ${q.answer === oi ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'}`}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={e => updateOpt(qi, oi, e.target.value)}
                      required
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-1">Click the radio button to mark the correct answer</p>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-medium cursor-pointer transition-colors"
            >
              + Add Question
            </button>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium border-none cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold border-none cursor-pointer">
                {saving ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </>
      ))}
    </div>
  );
}

export default CourseView;
