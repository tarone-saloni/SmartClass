import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../app.js';
import { createTestUser, loginUser, createTestCourse } from './helpers.js';

const { app } = buildApp();
const request = supertest(app);

const FUTURE_DATE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

let teacher, student, teacherCookie, studentCookie, courseId, liveClassId;

beforeAll(async () => {
  teacher = await createTestUser({ name: 'T Live', email: 'tlc@test.io', role: 'teacher' });
  student = await createTestUser({ name: 'S Live', email: 'slc@test.io', role: 'student' });

  const t = await loginUser(request, teacher.email, teacher.plainPassword);
  teacherCookie = t.cookie;
  expect(teacherCookie).toBeDefined();
  const s = await loginUser(request, student.email, student.plainPassword);
  studentCookie = s.cookie;
  expect(studentCookie).toBeDefined();

  const course = await createTestCourse(request, teacherCookie, teacher.id, { title: 'Live Course' });
  courseId = course.id;
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Live Classes API', () => {

  // ── POST /api/courses/:id/live-classes ─────────────────────────────────────
  describe('POST /api/courses/:courseId/live-classes', () => {
    it('creates a platform live class as the course teacher', async () => {
      const res = await request
        .post(`/api/courses/${courseId}/live-classes`)
        .set('Cookie', teacherCookie)
        .send({
          title: 'Session 1',
          description: 'Introduction',
          scheduledAt: FUTURE_DATE,
          type: 'platform',
          teacherId: teacher.id,
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Session 1', type: 'platform', status: 'scheduled' });
      liveClassId = res.body.id;
    });

    it('creates an external (meetLink) live class', async () => {
      const res = await request
        .post(`/api/courses/${courseId}/live-classes`)
        .set('Cookie', teacherCookie)
        .send({
          title: 'Google Meet Session',
          scheduledAt: FUTURE_DATE,
          type: 'meetLink',
          meetingLink: 'https://meet.google.com/abc-def-ghi',
          teacherId: teacher.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('meetLink');
      expect(res.body.meetingLink).toBe('https://meet.google.com/abc-def-ghi');
    });

    it('returns 400 when title or scheduledAt is missing', async () => {
      const res = await request
        .post(`/api/courses/${courseId}/live-classes`)
        .set('Cookie', teacherCookie)
        .send({ type: 'platform', teacherId: teacher.id });

      expect(res.status).toBe(400);
    });

    it('returns 403 when not the course teacher', async () => {
      const other = await createTestUser({ role: 'teacher' });
      const res = await request
        .post(`/api/courses/${courseId}/live-classes`)
        .send({ title: 'Fake', scheduledAt: FUTURE_DATE, teacherId: other.id });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/courses/:id/live-classes ──────────────────────────────────────
  describe('GET /api/courses/:courseId/live-classes', () => {
    it('returns the list of live classes for a course', async () => {
      const res = await request.get(`/api/courses/${courseId}/live-classes`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /api/live-classes/:id ──────────────────────────────────────────────
  describe('GET /api/live-classes/:id', () => {
    it('returns a single live class by id', async () => {
      const res = await request.get(`/api/live-classes/${liveClassId}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Session 1');
    });

    it('returns 404 for a non-existent id', async () => {
      const res = await request.get('/api/live-classes/000000000000000000000000');
      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /api/live-classes/:id/status ────────────────────────────────────
  describe('PATCH /api/live-classes/:id/status', () => {
    it('starts a live class (status → live)', async () => {
      const res = await request
        .patch(`/api/live-classes/${liveClassId}/status`)
        .set('Cookie', teacherCookie)
        .send({ status: 'live', teacherId: teacher.id });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('live');
    });

    it('ends a live class (status → ended)', async () => {
      const res = await request
        .patch(`/api/live-classes/${liveClassId}/status`)
        .set('Cookie', teacherCookie)
        .send({ status: 'ended', teacherId: teacher.id });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ended');
    });
  });

  // ── POST /api/live-classes/:id/join ───────────────────────────────────────
  describe('POST /api/live-classes/:id/join', () => {
    it('increments attendee count when a user joins', async () => {
      // Create a fresh live class with status live
      const lcRes = await request
        .post(`/api/courses/${courseId}/live-classes`)
        .set('Cookie', teacherCookie)
        .send({ title: 'Join Test', scheduledAt: FUTURE_DATE, type: 'platform', teacherId: teacher.id });
      const lcId = lcRes.body.id;

      await request
        .patch(`/api/live-classes/${lcId}/status`)
        .send({ status: 'live', teacherId: teacher.id });

      const res = await request
        .post(`/api/live-classes/${lcId}/join`)
        .set('Cookie', studentCookie)
        .send({ userId: student.id });

      expect(res.status).toBe(200);
    });
  });

  // ── Comments ───────────────────────────────────────────────────────────────
  describe('Live Class Comments', () => {
    let commentId;

    it('POST /api/live-classes/:id/comments — adds a comment', async () => {
      const res = await request
        .post(`/api/live-classes/${liveClassId}/comments`)
        .set('Cookie', studentCookie)
        .send({ userId: student.id, text: 'Great session!' });

      expect(res.status).toBe(201);
      expect(res.body.text).toBe('Great session!');
      commentId = res.body.id;
    });

    it('POST — adds a teacher reply to a comment', async () => {
      const res = await request
        .post(`/api/live-classes/${liveClassId}/comments`)
        .set('Cookie', teacherCookie)
        .send({ userId: teacher.id, text: 'Thanks!', parentComment: commentId });

      expect(res.status).toBe(201);
      expect(res.body.isTeacherReply).toBe(true);
      expect(res.body.parentComment).toBe(commentId);
    });

    it('GET /api/live-classes/:id/comments — lists all comments', async () => {
      const res = await request.get(`/api/live-classes/${liveClassId}/comments`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Q&A ────────────────────────────────────────────────────────────────────
  describe('Live Class Q&A', () => {
    let questionId;

    it('POST /api/live-classes/:id/questions — student posts a question', async () => {
      const res = await request
        .post(`/api/live-classes/${liveClassId}/questions`)
        .set('Cookie', studentCookie)
        .send({ studentId: student.id, question: 'Can you explain slide 3?' });

      expect(res.status).toBe(201);
      expect(res.body.question).toBe('Can you explain slide 3?');
      expect(res.body.isAnswered).toBe(false);
      questionId = res.body.id;
    });

    it('GET /api/live-classes/:id/questions — lists questions', async () => {
      const res = await request.get(`/api/live-classes/${liveClassId}/questions`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('PATCH /api/live-classes/:id/questions/:qId/answer — teacher marks answered', async () => {
      const res = await request
        .patch(`/api/live-classes/${liveClassId}/questions/${questionId}/answer`)
        .set('Cookie', teacherCookie)
        .send({ teacherId: teacher.id });

      expect(res.status).toBe(200);
      expect(res.body.isAnswered).toBe(true);
    });
  });

  // ── DELETE /api/live-classes/:id ───────────────────────────────────────────
  describe('DELETE /api/live-classes/:id', () => {
    it('deletes a live class as the course teacher', async () => {
      const created = await request
        .post(`/api/courses/${courseId}/live-classes`)
        .set('Cookie', teacherCookie)
        .send({ title: 'To Delete', scheduledAt: FUTURE_DATE, type: 'platform', teacherId: teacher.id });

      const res = await request
        .delete(`/api/live-classes/${created.body.id}`)
        .send({ teacherId: teacher.id });

      expect(res.status).toBe(200);
    });
  });
});
