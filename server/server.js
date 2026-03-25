const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST', 'PATCH'] },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

// ── In-memory data ────────────────────────────────────────────────────────────
let users = [];
let courses = [];
let enrollments = [];       // { studentId, courseId }
let materials = [];
let assignments = [];
let submissions = [];       // { id, assignmentId, studentId, content, submittedAt }
let quizzes = [];
let quizResults = [];       // { id, quizId, studentId, score, total, percentage, answers, completedAt }
let completedMaterials = []; // { studentId, materialId }
let notifications = [];     // { id, userId, message, read, createdAt, type }

// ── Helpers ───────────────────────────────────────────────────────────────────
function addNotification(userId, message, type = 'info') {
  const notif = { id: uuidv4(), userId, message, read: false, createdAt: new Date(), type };
  notifications.push(notif);
  io.to(`user-${userId}`).emit('notification', notif);
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'All fields required' });
  if (users.find(u => u.email === email))
    return res.status(409).json({ error: 'Email already registered' });
  const user = { id: uuidv4(), name, email, password, role, createdAt: new Date() };
  users.push(user);
  const { password: _, ...safe } = user;
  res.json(safe);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// ── COURSES ───────────────────────────────────────────────────────────────────
app.get('/api/courses', (req, res) => {
  const result = courses.map(c => ({
    ...c,
    teacher: users.find(u => u.id === c.teacherId),
    enrollmentCount: enrollments.filter(e => e.courseId === c.id).length,
    materialCount: materials.filter(m => m.courseId === c.id).length,
  }));
  res.json(result);
});

app.post('/api/courses', (req, res) => {
  const { title, description, subject, teacherId } = req.body;
  if (!title || !teacherId) return res.status(400).json({ error: 'Title and teacherId required' });
  const course = { id: uuidv4(), title, description, subject, teacherId, createdAt: new Date() };
  courses.push(course);
  res.json(course);
});

app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Not found' });
  const teacher = users.find(u => u.id === course.teacherId);
  const courseMaterials = materials.filter(m => m.courseId === course.id);
  const courseAssignments = assignments.filter(a => a.courseId === course.id);
  const courseQuizzes = quizzes.filter(q => q.courseId === course.id);
  const enrolledStudents = enrollments
    .filter(e => e.courseId === course.id)
    .map(e => users.find(u => u.id === e.studentId))
    .filter(Boolean);
  res.json({ ...course, teacher, materials: courseMaterials, assignments: courseAssignments, quizzes: courseQuizzes, enrolledStudents });
});

app.post('/api/courses/:id/enroll', (req, res) => {
  const { studentId } = req.body;
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (enrollments.find(e => e.studentId === studentId && e.courseId === req.params.id))
    return res.status(409).json({ error: 'Already enrolled' });
  enrollments.push({ studentId, courseId: req.params.id });
  const student = users.find(u => u.id === studentId);
  addNotification(course.teacherId, `${student?.name} enrolled in "${course.title}"`, 'enrollment');
  res.json({ success: true });
});

// ── MATERIALS ─────────────────────────────────────────────────────────────────
app.post('/api/courses/:id/materials', upload.single('file'), (req, res) => {
  const { title, type, url } = req.body;
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const material = {
    id: uuidv4(),
    courseId: req.params.id,
    title,
    type,
    url: req.file ? `/uploads/${req.file.filename}` : url,
    uploadedAt: new Date(),
  };
  materials.push(material);
  const enrolled = enrollments.filter(e => e.courseId === req.params.id);
  enrolled.forEach(e =>
    addNotification(e.studentId, `New ${type} "${title}" added to "${course.title}"`, 'material')
  );
  io.to(`course-${req.params.id}`).emit('new-material', material);
  res.json(material);
});

app.delete('/api/materials/:id', (req, res) => {
  materials = materials.filter(m => m.id !== req.params.id);
  res.json({ success: true });
});

app.patch('/api/materials/:id/complete', (req, res) => {
  const { studentId } = req.body;
  if (!completedMaterials.find(c => c.studentId === studentId && c.materialId === req.params.id))
    completedMaterials.push({ studentId, materialId: req.params.id });
  res.json({ success: true });
});

// ── ASSIGNMENTS ───────────────────────────────────────────────────────────────
app.post('/api/courses/:id/assignments', (req, res) => {
  const { title, description, dueDate } = req.body;
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const assignment = { id: uuidv4(), courseId: req.params.id, title, description, dueDate, createdAt: new Date() };
  assignments.push(assignment);
  enrollments
    .filter(e => e.courseId === req.params.id)
    .forEach(e => addNotification(e.studentId, `New assignment "${title}" in "${course.title}"`, 'assignment'));
  io.to(`course-${req.params.id}`).emit('new-assignment', assignment);
  res.json(assignment);
});

app.delete('/api/assignments/:id', (req, res) => {
  assignments = assignments.filter(a => a.id !== req.params.id);
  res.json({ success: true });
});

app.post('/api/assignments/:id/submit', (req, res) => {
  const { studentId, content } = req.body;
  const assignment = assignments.find(a => a.id === req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Not found' });
  const existing = submissions.find(s => s.assignmentId === req.params.id && s.studentId === studentId);
  if (existing) {
    existing.content = content;
    existing.submittedAt = new Date();
    return res.json(existing);
  }
  const submission = { id: uuidv4(), assignmentId: req.params.id, studentId, content, submittedAt: new Date() };
  submissions.push(submission);
  const student = users.find(u => u.id === studentId);
  const course = courses.find(c => c.id === assignment.courseId);
  addNotification(course?.teacherId, `${student?.name} submitted "${assignment.title}"`, 'submission');
  res.json(submission);
});

app.get('/api/assignments/:id/submissions', (req, res) => {
  const result = submissions
    .filter(s => s.assignmentId === req.params.id)
    .map(s => ({ ...s, student: users.find(u => u.id === s.studentId) }));
  res.json(result);
});

app.get('/api/assignments/:id/submission/:studentId', (req, res) => {
  const sub = submissions.find(s => s.assignmentId === req.params.id && s.studentId === req.params.studentId);
  res.json(sub || null);
});

// ── QUIZZES ───────────────────────────────────────────────────────────────────
app.post('/api/courses/:id/quizzes', (req, res) => {
  const { title, questions } = req.body;
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const quiz = { id: uuidv4(), courseId: req.params.id, title, questions, createdAt: new Date() };
  quizzes.push(quiz);
  enrollments
    .filter(e => e.courseId === req.params.id)
    .forEach(e => addNotification(e.studentId, `New quiz "${title}" in "${course.title}"`, 'quiz'));
  io.to(`course-${req.params.id}`).emit('new-quiz', quiz);
  res.json(quiz);
});

app.get('/api/quizzes/:id', (req, res) => {
  const quiz = quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Not found' });
  res.json(quiz);
});

app.delete('/api/quizzes/:id', (req, res) => {
  quizzes = quizzes.filter(q => q.id !== req.params.id);
  res.json({ success: true });
});

app.post('/api/quizzes/:id/submit', (req, res) => {
  const { studentId, answers } = req.body;
  const quiz = quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Not found' });
  let score = 0;
  answers.forEach((ans, i) => {
    if (quiz.questions[i] && ans === quiz.questions[i].answer) score++;
  });
  const result = {
    id: uuidv4(),
    quizId: req.params.id,
    studentId,
    score,
    total: quiz.questions.length,
    percentage: Math.round((score / quiz.questions.length) * 100),
    answers,
    completedAt: new Date(),
  };
  const idx = quizResults.findIndex(r => r.quizId === req.params.id && r.studentId === studentId);
  if (idx >= 0) quizResults[idx] = result;
  else quizResults.push(result);
  res.json(result);
});

app.get('/api/quizzes/:id/result/:studentId', (req, res) => {
  const result = quizResults.find(r => r.quizId === req.params.id && r.studentId === req.params.studentId);
  res.json(result || null);
});

app.get('/api/quizzes/:id/results', (req, res) => {
  const results = quizResults
    .filter(r => r.quizId === req.params.id)
    .map(r => ({ ...r, student: users.find(u => u.id === r.studentId) }));
  res.json(results);
});

// ── DASHBOARDS ────────────────────────────────────────────────────────────────
app.get('/api/students/:id/dashboard', (req, res) => {
  const studentId = req.params.id;
  const enrolledIds = enrollments.filter(e => e.studentId === studentId).map(e => e.courseId);
  const enrolledCourses = courses.filter(c => enrolledIds.includes(c.id)).map(c => {
    const courseMaterials = materials.filter(m => m.courseId === c.id);
    const completed = completedMaterials.filter(
      cm => cm.studentId === studentId && courseMaterials.find(m => m.id === cm.materialId)
    ).length;
    const progress = courseMaterials.length > 0 ? Math.round((completed / courseMaterials.length) * 100) : 0;
    const courseQuizzes = quizzes.filter(q => q.courseId === c.id);
    const quizzesTaken = quizResults.filter(
      r => r.studentId === studentId && courseQuizzes.find(q => q.id === r.quizId)
    ).length;
    return {
      ...c,
      teacher: users.find(u => u.id === c.teacherId),
      materialCount: courseMaterials.length,
      completedMaterials: completed,
      progress,
      quizCount: courseQuizzes.length,
      quizzesTaken,
    };
  });
  res.json({ enrolledCourses });
});

app.get('/api/teachers/:id/dashboard', (req, res) => {
  const teacherId = req.params.id;
  const teacherCourses = courses.filter(c => c.teacherId === teacherId).map(c => ({
    ...c,
    enrollmentCount: enrollments.filter(e => e.courseId === c.id).length,
    materialCount: materials.filter(m => m.courseId === c.id).length,
    assignmentCount: assignments.filter(a => a.courseId === c.id).length,
    quizCount: quizzes.filter(q => q.courseId === c.id).length,
  }));
  const allEnrollments = enrollments.filter(e =>
    courses.find(c => c.id === e.courseId && c.teacherId === teacherId)
  );
  const totalStudents = [...new Set(allEnrollments.map(e => e.studentId))].length;
  res.json({ courses: teacherCourses, totalStudents, totalCourses: teacherCourses.length });
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
app.get('/api/notifications/:userId', (req, res) => {
  const list = notifications
    .filter(n => n.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const n = notifications.find(n => n.id === req.params.id);
  if (n) n.read = true;
  res.json({ success: true });
});

app.patch('/api/notifications/read-all/:userId', (req, res) => {
  notifications.filter(n => n.userId === req.params.userId).forEach(n => (n.read = true));
  res.json({ success: true });
});

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  socket.on('authenticate', ({ userId }) => {
    socket.join(`user-${userId}`);
  });
  socket.on('join-course', ({ courseId }) => {
    socket.join(`course-${courseId}`);
  });
  socket.on('leave-course', ({ courseId }) => {
    socket.leave(`course-${courseId}`);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`SmartClass server running on http://localhost:${PORT}`));
