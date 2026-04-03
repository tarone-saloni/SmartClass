import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import Course from "../models/Course.js";
import { emitToCourse, emitToUser } from "../services/socketService.js";

// ─── POST /api/courses/:courseId/quizzes ──────────────────────────────────────
export async function createQuiz(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, questions, timeLimit, dueDate, teacherId } = req.body;

    if (!title || !teacherId)
      return res.status(400).json({ error: "title and teacherId are required." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can create quizzes." });

    const quiz = await Quiz.create({
      title,
      description,
      course: courseId,
      createdBy: teacherId,
      questions: questions || [],
      timeLimit: timeLimit || 0,
      dueDate: dueDate || null,
    });

    const formatted = formatQuiz(quiz);
    emitToCourse(courseId, "quiz:new", formatted);
    res.status(201).json(formatted);
  } catch (err) {
    console.error("createQuiz error:", err);
    res.status(500).json({ error: "Failed to create quiz." });
  }
}

// ─── GET /api/courses/:courseId/quizzes ───────────────────────────────────────
export async function getCourseQuizzes(req, res) {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    const quizzes = await Quiz.find({ course: courseId }).sort({ createdAt: -1 });
    res.json(quizzes.map(formatQuiz));
  } catch (err) {
    console.error("getCourseQuizzes error:", err);
    res.status(500).json({ error: "Failed to fetch quizzes." });
  }
}

// ─── GET /api/quizzes/:id ─────────────────────────────────────────────────────
export async function getQuiz(req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("createdBy", "name");
    if (!quiz) return res.status(404).json({ error: "Quiz not found." });
    res.json(formatQuiz(quiz));
  } catch (err) {
    console.error("getQuiz error:", err);
    res.status(500).json({ error: "Failed to fetch quiz." });
  }
}

// ─── PATCH /api/quizzes/:id ───────────────────────────────────────────────────
export async function updateQuiz(req, res) {
  try {
    const { title, description, questions, timeLimit, dueDate, isActive, teacherId } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found." });

    if (quiz.createdBy.toString() !== teacherId)
      return res.status(403).json({ error: "Only the quiz creator can update it." });

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions !== undefined) quiz.questions = questions;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (dueDate !== undefined) quiz.dueDate = dueDate;
    if (isActive !== undefined) quiz.isActive = isActive;
    await quiz.save();

    const formatted = formatQuiz(quiz);
    emitToCourse(quiz.course.toString(), "quiz:updated", formatted);
    res.json(formatted);
  } catch (err) {
    console.error("updateQuiz error:", err);
    res.status(500).json({ error: "Failed to update quiz." });
  }
}

// ─── DELETE /api/quizzes/:id ──────────────────────────────────────────────────
export async function deleteQuiz(req, res) {
  try {
    const { teacherId } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found." });

    if (quiz.createdBy.toString() !== teacherId)
      return res.status(403).json({ error: "Only the quiz creator can delete it." });

    const courseId = quiz.course.toString();
    await Quiz.findByIdAndDelete(req.params.id);
    await QuizResult.deleteMany({ quiz: req.params.id });

    emitToCourse(courseId, "quiz:deleted", { id: req.params.id, courseId });
    res.json({ message: "Quiz deleted." });
  } catch (err) {
    console.error("deleteQuiz error:", err);
    res.status(500).json({ error: "Failed to delete quiz." });
  }
}

// ─── POST /api/quizzes/:id/submit ─────────────────────────────────────────────
export async function submitQuiz(req, res) {
  try {
    const { id } = req.params;
    const { studentId, answers } = req.body;

    if (!studentId || !Array.isArray(answers))
      return res.status(400).json({ error: "studentId and answers array are required." });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found." });
    if (!quiz.isActive) return res.status(400).json({ error: "This quiz is no longer active." });

    const course = await Course.findById(quiz.course);
    const isEnrolled = course.enrolledStudents.some((s) => s.toString() === studentId);
    if (!isEnrolled) return res.status(403).json({ error: "You are not enrolled in this course." });

    // Grade the quiz
    let score = 0;
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    const gradedAnswers = answers.map((a) => {
      const q = quiz.questions[a.questionIndex];
      if (q && a.selectedOption === q.correctOption) score += q.points;
      return { questionIndex: a.questionIndex, selectedOption: a.selectedOption };
    });

    const result = await QuizResult.findOneAndUpdate(
      { quiz: id, student: studentId },
      { answers: gradedAnswers, score, totalPoints, submittedAt: new Date() },
      { upsert: true, new: true }
    );

    const formatted = formatResult(result);

    // Notify teacher of new submission
    emitToUser(course.teacher.toString(), "quiz:submitted", {
      quizId: id,
      quizTitle: quiz.title,
      studentId,
      courseId: quiz.course.toString(),
      score,
      totalPoints,
    });

    res.status(201).json(formatted);
  } catch (err) {
    console.error("submitQuiz error:", err);
    res.status(500).json({ error: "Failed to submit quiz." });
  }
}

// ─── GET /api/quizzes/:id/results ─────────────────────────────────────────────
export async function getQuizResults(req, res) {
  try {
    const { id } = req.params;
    const { teacherId } = req.query;

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found." });

    if (quiz.createdBy.toString() !== teacherId)
      return res.status(403).json({ error: "Only the quiz creator can view all results." });

    const results = await QuizResult.find({ quiz: id })
      .populate("student", "name email")
      .sort({ submittedAt: -1 });

    res.json(results.map(formatResult));
  } catch (err) {
    console.error("getQuizResults error:", err);
    res.status(500).json({ error: "Failed to fetch results." });
  }
}

// ─── GET /api/quizzes/:id/my-result ──────────────────────────────────────────
export async function getMyResult(req, res) {
  try {
    const { id } = req.params;
    const { studentId } = req.query;

    if (!studentId) return res.status(400).json({ error: "studentId is required." });

    const result = await QuizResult.findOne({ quiz: id, student: studentId });
    if (!result) return res.status(404).json({ error: "No result found." });

    res.json(formatResult(result));
  } catch (err) {
    console.error("getMyResult error:", err);
    res.status(500).json({ error: "Failed to fetch result." });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatQuiz(q) {
  return {
    id: q._id,
    title: q.title,
    description: q.description,
    course: q.course,
    createdBy: q.createdBy ? { id: q.createdBy._id || q.createdBy, name: q.createdBy.name } : null,
    questions: q.questions,
    timeLimit: q.timeLimit,
    dueDate: q.dueDate,
    isActive: q.isActive,
    questionCount: q.questions?.length ?? 0,
    totalPoints: q.questions?.reduce((sum, qn) => sum + qn.points, 0) ?? 0,
    createdAt: q.createdAt,
  };
}

function formatResult(r) {
  return {
    id: r._id,
    quiz: r.quiz?._id || r.quiz,
    student: r.student
      ? { id: r.student._id || r.student, name: r.student.name, email: r.student.email }
      : null,
    answers: r.answers,
    score: r.score,
    totalPoints: r.totalPoints,
    percentage: r.totalPoints > 0 ? Math.round((r.score / r.totalPoints) * 100) : 0,
    submittedAt: r.submittedAt,
  };
}
