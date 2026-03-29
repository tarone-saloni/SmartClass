import User from '../app/models/User.js';

// ─── Create a fully-verified user directly in the DB ─────────────────────────
// Passes the plain-text password to User.create() so the Mongoose pre-save
// hook hashes it exactly once (avoids double-hashing if we called bcrypt.hash
// ourselves before create).
export async function createTestUser({
  name,
  email,
  password = 'Test1234!',
  role = 'student',
} = {}) {
  const resolvedEmail =
    email || `${role}_${Date.now()}_${Math.random().toString(36).slice(2)}@test.io`;
  const resolvedName = name || `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`;

  const user = await User.create({
    name: resolvedName,
    email: resolvedEmail,
    password,       // plain — let the pre-save hook hash it once
    role,
    isVerified: true,
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    plainPassword: password,
  };
}

// ─── Login and return the Set-Cookie header value ─────────────────────────────
export async function loginUser(request, email, password) {
  const res = await request
    .post('/api/auth/login')
    .send({ email, password });
  const cookie = res.headers['set-cookie']?.[0]?.split(';')[0];
  return { cookie, user: res.body, status: res.status };
}

// ─── Create a course (teacher must already be logged in) ──────────────────────
export async function createTestCourse(request, teacherCookie, teacherId, overrides = {}) {
  const res = await request
    .post('/api/courses')
    .set('Cookie', teacherCookie)
    .send({
      title: overrides.title || `Course ${Date.now()}`,
      description: overrides.description || 'Auto-generated test course',
      subject: overrides.subject || 'General',
      teacherId,
    });
  return res.body;
}

// ─── Enroll a student in a course ─────────────────────────────────────────────
export async function enrollStudent(request, courseId, studentId) {
  return request
    .post('/api/enrollments')
    .send({ studentId, courseId });
}
