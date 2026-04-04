import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { buildApp } from "../app.js";
import { createTestUser, loginUser, createTestCourse, enrollStudent } from "./helpers.js";

const { app } = buildApp();
const request = supertest(app);

let teacher, student, teacherCookie, studentCookie, courseId;

beforeAll(async () => {
  teacher = await createTestUser({ name: "T Assign", email: "ta@test.io", role: "teacher" });
  student = await createTestUser({ name: "S Assign", email: "sa@test.io", role: "student" });

  const t = await loginUser(request, teacher.email, teacher.plainPassword);
  teacherCookie = t.cookie;
  const s = await loginUser(request, student.email, student.plainPassword);
  studentCookie = s.cookie;

  const course = await createTestCourse(request, teacherCookie, teacher.id, {
    title: "Assign Course",
  });
  courseId = course.id;

  // Enroll student so they can submit
  await enrollStudent(request, courseId, student.id);
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Assignments API", () => {
  // ── POST /api/courses/:id/assignments ──────────────────────────────────────
  describe("POST /api/courses/:courseId/assignments", () => {
    it("creates an assignment as the course teacher", async () => {
      const res = await request
        .post(`/api/courses/${courseId}/assignments`)
        .set("Cookie", teacherCookie)
        .send({
          title: "Homework 1",
          description: "Solve all exercises",
          maxScore: 100,
          teacherId: teacher.id,
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: "Homework 1", maxScore: 100 });
    });

    it("returns 400 when title is missing", async () => {
      const res = await request
        .post(`/api/courses/${courseId}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ teacherId: teacher.id });

      expect(res.status).toBe(400);
    });

    it("returns 403 when someone other than the course teacher creates", async () => {
      // Create a second teacher
      const other = await createTestUser({ role: "teacher" });
      const res = await request
        .post(`/api/courses/${courseId}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ title: "Fake", teacherId: other.id });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/courses/:id/assignments ──────────────────────────────────────
  describe("GET /api/courses/:courseId/assignments", () => {
    it("returns assignment list for the course", async () => {
      const res = await request.get(`/api/courses/${courseId}/assignments`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /api/assignments/:id ──────────────────────────────────────────────
  describe("GET /api/assignments/:id", () => {
    it("returns a single assignment by id", async () => {
      const created = await request
        .post(`/api/courses/${courseId}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ title: "Solo HW", teacherId: teacher.id });

      const res = await request.get(`/api/assignments/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Solo HW");
    });
  });

  // ── PATCH /api/assignments/:id ────────────────────────────────────────────
  describe("PATCH /api/assignments/:id", () => {
    it("updates an assignment as the creator teacher", async () => {
      const created = await request
        .post(`/api/courses/${courseId}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ title: "Update Me", teacherId: teacher.id });

      const res = await request
        .patch(`/api/assignments/${created.body.id}`)
        .set("Cookie", teacherCookie)
        .send({ title: "Updated Title", teacherId: teacher.id });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
    });
  });

  // ── POST /api/assignments/:id/submit ──────────────────────────────────────
  describe("POST /api/assignments/:id/submit", () => {
    it("submits an assignment as an enrolled student", async () => {
      // Use a fresh single-assignment course so sequential lock has no predecessors
      const sc = await createTestCourse(request, teacherCookie, teacher.id, {
        title: "Submit Course",
      });
      await enrollStudent(request, sc.id, student.id);
      const created = await request
        .post(`/api/courses/${sc.id}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ title: "Submit Me", teacherId: teacher.id });
      const aId = created.body.id;

      const res = await request
        .post(`/api/assignments/${aId}/submit`)
        .set("Cookie", studentCookie)
        .send({ studentId: student.id, content: "My answer here" });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("My answer here");
    });

    it("returns 403 when student is not enrolled", async () => {
      const otherStudent = await createTestUser({ role: "student" });

      const created = await request
        .post(`/api/courses/${courseId}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ title: "Not Enrolled", teacherId: teacher.id });

      const res = await request
        .post(`/api/assignments/${created.body.id}/submit`)
        .send({ studentId: otherStudent.id, content: "Try it" });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/assignments/:id/submissions ──────────────────────────────────
  describe("GET /api/assignments/:id/submissions", () => {
    it("returns submissions for an assignment", async () => {
      // Fresh single-assignment course so the student can submit without sequential blocking
      const sc = await createTestCourse(request, teacherCookie, teacher.id, {
        title: "Subs Course",
      });
      await enrollStudent(request, sc.id, student.id);
      const created = await request
        .post(`/api/courses/${sc.id}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ title: "View Subs", teacherId: teacher.id });
      const aId = created.body.id;

      await request
        .post(`/api/assignments/${aId}/submit`)
        .set("Cookie", studentCookie)
        .send({ studentId: student.id, content: "Done" });

      const res = await request.get(`/api/assignments/${aId}/submissions?teacherId=${teacher.id}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── PATCH /api/assignments/submissions/:id/grade ──────────────────────────
  describe("PATCH /api/assignments/submissions/:submissionId/grade", () => {
    it("grades a submission as the teacher", async () => {
      // Fresh single-assignment course so the student can submit without sequential blocking
      const sc = await createTestCourse(request, teacherCookie, teacher.id, {
        title: "Grade Course",
      });
      await enrollStudent(request, sc.id, student.id);
      const created = await request
        .post(`/api/courses/${sc.id}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ title: "Grade Me", maxScore: 50, teacherId: teacher.id });
      const aId = created.body.id;

      await request
        .post(`/api/assignments/${aId}/submit`)
        .set("Cookie", studentCookie)
        .send({ studentId: student.id, content: "My work" });

      const subsRes = await request.get(
        `/api/assignments/${aId}/submissions?teacherId=${teacher.id}`
      );
      const submissionId = subsRes.body[0].id;

      const res = await request
        .patch(`/api/assignments/submissions/${submissionId}/grade`)
        .set("Cookie", teacherCookie)
        .send({ score: 45, feedback: "Great work!", teacherId: teacher.id });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(45);
      expect(res.body.feedback).toBe("Great work!");
    });
  });

  // ── DELETE /api/assignments/:id ───────────────────────────────────────────
  describe("DELETE /api/assignments/:id", () => {
    it("deletes an assignment as the creator teacher", async () => {
      const created = await request
        .post(`/api/courses/${courseId}/assignments`)
        .set("Cookie", teacherCookie)
        .send({ title: "Delete Me", teacherId: teacher.id });

      const res = await request
        .delete(`/api/assignments/${created.body.id}`)
        .send({ teacherId: teacher.id });

      expect(res.status).toBe(200);
    });
  });
});

afterAll(async () => {
  const cols = mongoose.connection.collections;
  for (const key of Object.keys(cols)) {
    await cols[key].deleteMany({});
  }
});
