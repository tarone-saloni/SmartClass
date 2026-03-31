import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../app.js';
import { createTestUser, loginUser, createTestCourse, enrollStudent } from './helpers.js';

const { app } = buildApp();
const request = supertest(app);

const QUIZ_QUESTIONS = [
  { question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctOption: 1, points: 1 },
  { question: 'Capital of France?', options: ['Berlin', 'London', 'Paris', 'Rome'], correctOption: 2, points: 2 },
];

let teacher, student, teacherCookie, studentCookie, courseId, quizId;

beforeAll(async () => {
  teacher = await createTestUser({ name: 'T Quiz', email: 'tq@test.io', role: 'teacher' });
  student = await createTestUser({ name: 'S Quiz', email: 'sq@test.io', role: 'student' });

  const t = await loginUser(request, teacher.email, teacher.plainPassword);
  teacherCookie = t.cookie;
  const s = await loginUser(request, student.email, student.plainPassword);
  studentCookie = s.cookie;

  const course = await createTestCourse(request, teacherCookie, teacher.id, { title: 'Quiz Course' });
  courseId = course.id;

  // Enroll student so they can submit quizzes
  await enrollStudent(request, courseId, student.id);
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Quizzes API', () => {

  // ── POST /api/courses/:id/quizzes ──────────────────────────────────────────
  describe('POST /api/courses/:courseId/quizzes', () => {
    it('creates a quiz as the course teacher', async () => {
      const res = await request
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', teacherCookie)
        .send({
          title: 'Math Quiz',
          description: 'Basic arithmetic',
          questions: QUIZ_QUESTIONS,
          timeLimit: 30,
          teacherId: teacher.id,
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Math Quiz' });
      expect(res.body.questions).toHaveLength(2);
      quizId = res.body.id;
    });

    it('returns 400 when title is missing', async () => {
      const res = await request
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', teacherCookie)
        .send({ teacherId: teacher.id });

      expect(res.status).toBe(400);
    });

    it('returns 403 when not the course teacher', async () => {
      const other = await createTestUser({ role: 'teacher' });
      const res = await request
        .post(`/api/courses/${courseId}/quizzes`)
        .send({ title: 'Fake Quiz', teacherId: other.id });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/courses/:id/quizzes ───────────────────────────────────────────
  describe('GET /api/courses/:courseId/quizzes', () => {
    it('returns the list of quizzes for a course', async () => {
      const res = await request.get(`/api/courses/${courseId}/quizzes`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /api/quizzes/:id ───────────────────────────────────────────────────
  describe('GET /api/quizzes/:id', () => {
    it('returns a single quiz by id', async () => {
      const created = await request
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', teacherCookie)
        .send({ title: 'Single Quiz', questions: QUIZ_QUESTIONS, teacherId: teacher.id });

      const res = await request.get(`/api/quizzes/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Single Quiz');
    });

    it('returns 404 for a non-existent quiz', async () => {
      const res = await request.get('/api/quizzes/000000000000000000000000');
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/quizzes/:id/submit ───────────────────────────────────────────
  describe('POST /api/quizzes/:id/submit', () => {
    it('submits quiz answers and returns a graded result', async () => {
      const created = await request
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', teacherCookie)
        .send({ title: 'Graded Quiz', questions: QUIZ_QUESTIONS, teacherId: teacher.id });
      const qId = created.body.id;

      // Both answers correct: Q1 option 1, Q2 option 2
      const res = await request
        .post(`/api/quizzes/${qId}/submit`)
        .set('Cookie', studentCookie)
        .send({
          studentId: student.id,
          answers: [
            { questionIndex: 0, selectedOption: 1 },
            { questionIndex: 1, selectedOption: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.score).toBe(3); // 1 + 2 points
      expect(res.body.totalPoints).toBe(3);
    });

    it('scores 0 when all answers are wrong', async () => {
      const created = await request
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', teacherCookie)
        .send({ title: 'Wrong Quiz', questions: QUIZ_QUESTIONS, teacherId: teacher.id });
      const qId = created.body.id;

      const res = await request
        .post(`/api/quizzes/${qId}/submit`)
        .set('Cookie', studentCookie)
        .send({
          studentId: student.id,
          answers: [
            { questionIndex: 0, selectedOption: 0 }, // wrong
            { questionIndex: 1, selectedOption: 0 }, // wrong
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.score).toBe(0);
    });

    it('returns 403 when student is not enrolled', async () => {
      const other = await createTestUser({ role: 'student' });

      const res = await request
        .post(`/api/quizzes/${quizId}/submit`)
        .send({
          studentId: other.id,
          answers: [{ questionIndex: 0, selectedOption: 1 }],
        });

      expect(res.status).toBe(403);
    });

    it('returns 400 when answers field is missing', async () => {
      const res = await request
        .post(`/api/quizzes/${quizId}/submit`)
        .send({ studentId: student.id });

      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /api/quizzes/:id ────────────────────────────────────────────────
  describe('PATCH /api/quizzes/:id', () => {
    it('updates a quiz title as the creator teacher', async () => {
      const created = await request
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', teacherCookie)
        .send({ title: 'Old Quiz Title', teacherId: teacher.id });

      const res = await request
        .patch(`/api/quizzes/${created.body.id}`)
        .set('Cookie', teacherCookie)
        .send({ title: 'New Quiz Title', teacherId: teacher.id });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Quiz Title');
    });
  });

  // ── DELETE /api/quizzes/:id ────────────────────────────────────────────────
  describe('DELETE /api/quizzes/:id', () => {
    it('deletes a quiz as the creator teacher', async () => {
      const created = await request
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', teacherCookie)
        .send({ title: 'Delete Quiz', teacherId: teacher.id });

      const res = await request
        .delete(`/api/quizzes/${created.body.id}`)
        .send({ teacherId: teacher.id });

      expect(res.status).toBe(200);
    });
  });
});
