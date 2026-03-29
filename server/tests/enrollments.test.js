import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../app.js';
import { createTestUser, loginUser, createTestCourse } from './helpers.js';

const { app } = buildApp();
const request = supertest(app);

let teacher, student, teacherCookie, studentCookie, courseId;

beforeAll(async () => {
  teacher = await createTestUser({ name: 'T Enroll', email: 'te@test.io', role: 'teacher' });
  student = await createTestUser({ name: 'S Enroll', email: 'se@test.io', role: 'student' });

  const t = await loginUser(request, teacher.email, teacher.plainPassword);
  teacherCookie = t.cookie;
  const s = await loginUser(request, student.email, student.plainPassword);
  studentCookie = s.cookie;

  const course = await createTestCourse(request, teacherCookie, teacher.id, { title: 'Enroll Course' });
  courseId = course.id;
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Enrollments API', () => {

  // ── POST /api/enrollments ─────────────────────────────────────────────────
  describe('POST /api/enrollments', () => {
    it('enrolls a student in a course', async () => {
      const res = await request
        .post('/api/enrollments')
        .set('Cookie', studentCookie)
        .send({ studentId: student.id, courseId });

      expect(res.status).toBe(201);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request
        .post('/api/enrollments')
        .send({ studentId: student.id }); // missing courseId

      expect(res.status).toBe(400);
    });

    it('returns 400 when already enrolled', async () => {
      // Enroll once
      await request
        .post('/api/enrollments')
        .send({ studentId: student.id, courseId });

      // Enroll again
      const res = await request
        .post('/api/enrollments')
        .send({ studentId: student.id, courseId });

      expect(res.status).toBe(400);
    });

    it('returns 404 when course does not exist', async () => {
      const res = await request
        .post('/api/enrollments')
        .send({ studentId: student.id, courseId: '000000000000000000000000' });

      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/enrollments/my-courses ──────────────────────────────────────
  describe('GET /api/enrollments/my-courses', () => {
    it('returns the enrolled courses for a student', async () => {
      // Enroll first
      await request
        .post('/api/enrollments')
        .send({ studentId: student.id, courseId });

      const res = await request
        .get(`/api/enrollments/my-courses?studentId=${student.id}`)
        .set('Cookie', studentCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── GET /api/enrollments/course/:courseId ─────────────────────────────────
  describe('GET /api/enrollments/course/:courseId', () => {
    it('returns enrollments for a course (teacher view)', async () => {
      await request
        .post('/api/enrollments')
        .send({ studentId: student.id, courseId });

      const res = await request
        .get(`/api/enrollments/course/${courseId}?teacherId=${teacher.id}`)
        .set('Cookie', teacherCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /api/enrollments/progress ────────────────────────────────────────
  describe('GET /api/enrollments/progress', () => {
    it('returns course progress for an enrolled student', async () => {
      await request
        .post('/api/enrollments')
        .send({ studentId: student.id, courseId });

      const res = await request
        .get(`/api/enrollments/progress?studentId=${student.id}&courseId=${courseId}`)
        .set('Cookie', studentCookie);

      expect(res.status).toBe(200);
      expect(typeof res.body.progress).toBe('number');
    });
  });

  // ── DELETE /api/enrollments ────────────────────────────────────────────────
  describe('DELETE /api/enrollments', () => {
    it('unenrolls a student from a course', async () => {
      // Enroll first
      await request
        .post('/api/enrollments')
        .send({ studentId: student.id, courseId });

      const res = await request
        .delete('/api/enrollments')
        .set('Cookie', studentCookie)
        .send({ studentId: student.id, courseId });

      expect(res.status).toBe(200);
    });

    it('returns 400 when not enrolled', async () => {
      const otherStudent = await createTestUser({ role: 'student' });

      const res = await request
        .delete('/api/enrollments')
        .send({ studentId: otherStudent.id, courseId });

      expect(res.status).toBe(400);
    });
  });
});
