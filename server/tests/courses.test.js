import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../app.js';
import { createTestUser, loginUser } from './helpers.js';

const { app } = buildApp();
const request = supertest(app);

let teacher, student, teacherCookie, studentCookie;

beforeAll(async () => {
  teacher = await createTestUser({ name: 'Prof. Smith', email: 'teacher.course@test.io', role: 'teacher' });
  student = await createTestUser({ name: 'Student Lee', email: 'student.course@test.io', role: 'student' });

  const t = await loginUser(request, teacher.email, teacher.plainPassword);
  teacherCookie = t.cookie;
  expect(teacherCookie).toBeDefined();

  const s = await loginUser(request, student.email, student.plainPassword);
  studentCookie = s.cookie;
  expect(studentCookie).toBeDefined();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Courses API', () => {

  // ── POST /api/courses ──────────────────────────────────────────────────────
  describe('POST /api/courses', () => {
    it('creates a course as a teacher', async () => {
      const res = await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ title: 'Algebra 101', subject: 'Math', teacherId: teacher.id });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Algebra 101', subject: 'Math' });
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 when title is missing', async () => {
      const res = await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ subject: 'Math', teacherId: teacher.id });

      expect(res.status).toBe(400);
    });

    it('returns 403 when a non-teacher tries to create a course', async () => {
      const res = await request
        .post('/api/courses')
        .set('Cookie', studentCookie)
        .send({ title: 'Hack 101', subject: 'CS', teacherId: student.id });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/courses ───────────────────────────────────────────────────────
  describe('GET /api/courses', () => {
    it('returns an array of courses', async () => {
      // Create a course first
      await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ title: 'Biology', subject: 'Science', teacherId: teacher.id });

      const res = await request.get('/api/courses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── GET /api/courses/:id ───────────────────────────────────────────────────
  describe('GET /api/courses/:id', () => {
    it('returns a single course by id', async () => {
      const created = await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ title: 'Chemistry', subject: 'Science', teacherId: teacher.id });

      const res = await request.get(`/api/courses/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Chemistry');
    });

    it('returns 404 for a non-existent id', async () => {
      const res = await request.get('/api/courses/000000000000000000000000');
      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /api/courses/:id ─────────────────────────────────────────────────
  describe('PATCH /api/courses/:id', () => {
    it('updates a course as the owning teacher', async () => {
      const created = await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ title: 'Old Title', subject: 'Math', teacherId: teacher.id });

      const res = await request
        .patch(`/api/courses/${created.body.id}`)
        .set('Cookie', teacherCookie)
        .send({ title: 'New Title', teacherId: teacher.id });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Title');
    });
  });

  // ── POST /api/courses/:id/enroll ───────────────────────────────────────────
  describe('POST /api/courses/:id/enroll', () => {
    it('enrolls a student in a course', async () => {
      const courseRes = await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ title: 'Enroll Test', subject: 'Math', teacherId: teacher.id });

      const res = await request
        .post(`/api/courses/${courseRes.body.id}/enroll`)
        .set('Cookie', studentCookie)
        .send({ studentId: student.id });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/enrolled/i);
    });

    it('returns 400 if the student is already enrolled', async () => {
      const courseRes = await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ title: 'Double Enroll', subject: 'Math', teacherId: teacher.id });

      // Enroll once
      await request
        .post(`/api/courses/${courseRes.body.id}/enroll`)
        .set('Cookie', studentCookie)
        .send({ studentId: student.id });

      // Try to enroll again
      const res = await request
        .post(`/api/courses/${courseRes.body.id}/enroll`)
        .set('Cookie', studentCookie)
        .send({ studentId: student.id });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/courses/:id/enroll ─────────────────────────────────────────
  describe('DELETE /api/courses/:id/enroll', () => {
    it('unenrolls a student from a course', async () => {
      const courseRes = await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ title: 'Unenroll Test', subject: 'Math', teacherId: teacher.id });

      await request
        .post(`/api/courses/${courseRes.body.id}/enroll`)
        .send({ studentId: student.id });

      const res = await request
        .delete(`/api/courses/${courseRes.body.id}/enroll`)
        .send({ studentId: student.id });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/unenrolled/i);
    });
  });

  // ── DELETE /api/courses/:id ────────────────────────────────────────────────
  describe('DELETE /api/courses/:id', () => {
    it('deletes a course as the owning teacher', async () => {
      const created = await request
        .post('/api/courses')
        .set('Cookie', teacherCookie)
        .send({ title: 'To Delete', subject: 'Math', teacherId: teacher.id });

      const res = await request
        .delete(`/api/courses/${created.body.id}`)
        .send({ teacherId: teacher.id });

      expect(res.status).toBe(200);
    });
  });
});
