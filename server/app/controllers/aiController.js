import Anthropic from "@anthropic-ai/sdk";
import Quiz from "../models/Quiz.js";
import Course from "../models/Course.js";
import QuizResult from "../models/QuizResult.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import AIStudyPlan from "../models/AIStudyPlan.js";
import AICourseOutline from "../models/AICourseOutline.js";
import {
  generateQuiz as llmGenerateQuiz,
  summarizeMaterial,
  explainConcept,
  gradeAndFeedback,
  createStudySchedule,
  analyzePerformance as llmAnalyzePerformance,
  generateCourseOutline,
  MODEL,
} from "../ai/llm.js";
import { runAgent } from "../ai/agent.js";

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const CHAT_SYSTEM = (userRole, courseContext) =>
  `You are SmartClass AI, a helpful and friendly educational assistant.
You are currently talking with a **${userRole}**.
${courseContext ? `Current course context: ${courseContext}` : ""}

Guidelines:
- For students: explain concepts clearly, use examples, be encouraging.
- For teachers: offer pedagogical strategies, help with content creation.
- Keep responses focused and educational.
- If asked something outside education, gently redirect.`;

// ─── Chat ─────────────────────────────────────────────────────────────────────
export async function chat(req, res) {
  try {
    const { message, history = [], user_role = "student", course_context } = req.body;
    if (!message) return res.status(400).json({ error: "message is required." });

    const messages = (history || []).map((m) => ({ role: m.role, content: m.content }));
    messages.push({ role: "user", content: message });

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: CHAT_SYSTEM(user_role, course_context),
      messages,
    });

    res.json({
      response: response.content[0].text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (err) {
    console.error("chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Summarize ────────────────────────────────────────────────────────────────
export async function summarize(req, res) {
  try {
    const { content, style = "bullet-points", subject } = req.body;
    if (!content) return res.status(400).json({ error: "content is required." });
    const result = await summarizeMaterial({ content, format: style, subject });
    res.json({ summary: result, style, word_count: result.split(/\s+/).length });
  } catch (err) {
    console.error("summarize error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Explain ──────────────────────────────────────────────────────────────────
export async function explain(req, res) {
  try {
    const { concept, difficulty_level = "intermediate", course_context } = req.body;
    if (!concept) return res.status(400).json({ error: "concept is required." });
    const result = await explainConcept({
      concept,
      level: difficulty_level,
      include_examples: true,
      subject_context: course_context || "",
    });
    res.json({ explanation: result, concept, level: difficulty_level });
  } catch (err) {
    console.error("explain error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Agent ────────────────────────────────────────────────────────────────────
export async function agent(req, res) {
  try {
    const { task, context = {} } = req.body;
    if (!task) return res.status(400).json({ error: "task is required." });
    const result = await runAgent(task, context);
    res.json(result);
  } catch (err) {
    console.error("agent error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Generate Quiz (no save) ──────────────────────────────────────────────────
export async function generateQuiz(req, res) {
  try {
    const { topic, content, num_questions = 5, difficulty = "medium" } = req.body;
    if (!topic) return res.status(400).json({ error: "topic is required." });
    const raw = await llmGenerateQuiz({ topic, content, num_questions, difficulty });
    try {
      let text = raw.trim();
      if (text.startsWith("```")) {
        text = text.split("```")[1];
        if (text.startsWith("json")) text = text.slice(4);
      }
      const questions = JSON.parse(text);
      res.json({ questions, topic, difficulty, count: questions.length });
    } catch {
      res.json({ raw_response: raw, topic, parse_error: true });
    }
  } catch (err) {
    console.error("generateQuiz error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── POST /api/ai/courses/:courseId/save-quiz ─────────────────────────────────
export async function saveQuizToCourse(req, res) {
  try {
    const { courseId } = req.params;
    const { title, questions, teacherId, timeLimit, dueDate } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0 || !teacherId)
      return res.status(400).json({ error: "title, questions[], and teacherId are required." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });
    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can save quizzes." });

    const dbQuestions = questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctOption: q.correct_answer ?? q.correctOption ?? 0,
      points: q.points ?? 1,
    }));

    const quiz = await Quiz.create({
      title,
      description: `AI-generated quiz`,
      course: courseId,
      createdBy: teacherId,
      questions: dbQuestions,
      timeLimit: timeLimit || 0,
      dueDate: dueDate || null,
    });

    res.status(201).json(formatQuiz(quiz));
  } catch (err) {
    console.error("saveQuizToCourse error:", err);
    res.status(500).json({ error: "Failed to save quiz." });
  }
}

// ─── Feedback (no save) ───────────────────────────────────────────────────────
export async function feedback(req, res) {
  try {
    const {
      assignment_title,
      assignment_description,
      student_submission,
      max_score = 100,
    } = req.body;
    if (!assignment_title || !student_submission)
      return res
        .status(400)
        .json({ error: "assignment_title and student_submission are required." });
    const result = await gradeAndFeedback({
      assignment_title,
      assignment_requirements: assignment_description || "",
      student_submission,
      max_score,
    });
    res.json({ feedback: result, assignment: assignment_title, max_score });
  } catch (err) {
    console.error("feedback error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── POST /api/ai/submissions/:submissionId/feedback ──────────────────────────
export async function feedbackAndSave(req, res) {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId).populate(
      "assignment",
      "title description maxScore"
    );
    if (!submission) return res.status(404).json({ error: "Submission not found." });

    const feedbackText = await gradeAndFeedback({
      assignment_title: submission.assignment.title,
      assignment_requirements: submission.assignment.description,
      student_submission: submission.content,
      max_score: submission.assignment.maxScore,
    });

    submission.feedback = feedbackText;
    if (submission.status === "submitted") submission.status = "graded";
    await submission.save();

    res.json({ feedback: feedbackText, submissionId, saved: true });
  } catch (err) {
    console.error("feedbackAndSave error:", err);
    res.status(500).json({ error: err.message || "Failed to generate feedback." });
  }
}

// ─── Analyze Performance (no save) ───────────────────────────────────────────
export async function analyzePerformance(req, res) {
  try {
    const { subject, quiz_scores = [], assignment_grades = [], course_progress = 0 } = req.body;
    if (!subject) return res.status(400).json({ error: "subject is required." });
    const result = await llmAnalyzePerformance({
      subject,
      quiz_scores,
      assignment_grades,
      course_progress,
    });
    res.json({ analysis: result, subject });
  } catch (err) {
    console.error("analyzePerformance error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── GET /api/ai/students/:studentId/performance-context ─────────────────────
export async function getPerformanceContext(req, res) {
  try {
    const { studentId } = req.params;

    const courses = await Course.find({ enrolledStudents: studentId });
    const courseIds = courses.map((c) => c._id);

    const [quizResults, submissions] = await Promise.all([
      QuizResult.find({
        student: studentId,
        quiz: { $in: await Quiz.find({ course: { $in: courseIds } }).distinct("_id") },
      }).populate("quiz", "title course"),
      Submission.find({
        student: studentId,
        assignment: {
          $in: await Assignment.find({ course: { $in: courseIds } }).distinct("_id"),
        },
        status: "graded",
      }).select("score assignment"),
    ]);

    const courseMap = {};
    for (const c of courses) {
      courseMap[c._id.toString()] = {
        courseId: c._id.toString(),
        title: c.title,
        quizScores: [],
        assignmentGrades: [],
      };
    }

    for (const r of quizResults) {
      const cId = r.quiz?.course?.toString();
      if (cId && courseMap[cId] && r.totalPoints > 0) {
        courseMap[cId].quizScores.push(Math.round((r.score / r.totalPoints) * 100));
      }
    }

    const assignmentIds = submissions.map((s) => s.assignment);
    const assignments = await Assignment.find({ _id: { $in: assignmentIds } }).select(
      "course maxScore"
    );
    const assignMap = Object.fromEntries(assignments.map((a) => [a._id.toString(), a]));
    for (const s of submissions) {
      const asn = assignMap[s.assignment?.toString()];
      if (asn && asn.maxScore > 0) {
        const cId = asn.course.toString();
        if (courseMap[cId]) {
          courseMap[cId].assignmentGrades.push(Math.round((s.score / asn.maxScore) * 100));
        }
      }
    }

    const performanceData = Object.values(courseMap).filter(
      (c) => c.quizScores.length > 0 || c.assignmentGrades.length > 0
    );

    res.json({ courses: performanceData, totalCourses: courses.length });
  } catch (err) {
    console.error("getPerformanceContext error:", err);
    res.status(500).json({ error: "Failed to fetch performance data." });
  }
}

// ─── POST /api/ai/analyze-performance-real ───────────────────────────────────
export async function analyzeRealPerformance(req, res) {
  try {
    const { studentId, subject } = req.body;
    if (!studentId || !subject)
      return res.status(400).json({ error: "studentId and subject are required." });

    const courses = await Course.find({
      enrolledStudents: studentId,
      subject: new RegExp(subject, "i"),
    });
    const courseIds = courses.map((c) => c._id);

    const quizScores = [];
    const assignmentGrades = [];

    if (courseIds.length > 0) {
      const qrs = await QuizResult.find({
        student: studentId,
        quiz: { $in: await Quiz.find({ course: { $in: courseIds } }).distinct("_id") },
      });
      for (const r of qrs) {
        if (r.totalPoints > 0) quizScores.push(Math.round((r.score / r.totalPoints) * 100));
      }

      const subs = await Submission.find({
        student: studentId,
        assignment: { $in: await Assignment.find({ course: { $in: courseIds } }).distinct("_id") },
        status: "graded",
      }).populate("assignment", "maxScore");
      for (const s of subs) {
        if (s.assignment?.maxScore > 0)
          assignmentGrades.push(Math.round((s.score / s.assignment.maxScore) * 100));
      }
    }

    const result = await llmAnalyzePerformance({
      subject,
      quiz_scores: quizScores,
      assignment_grades: assignmentGrades,
      course_progress: Math.round(
        courseIds.length > 0 ? (quizScores.length / Math.max(quizScores.length + 2, 5)) * 100 : 0
      ),
    });

    res.json({ analysis: result, subject, quizScores, assignmentGrades });
  } catch (err) {
    console.error("analyzeRealPerformance error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze performance." });
  }
}

// ─── Generate Assignment (via agent) ─────────────────────────────────────────
export async function generateAssignment(req, res) {
  try {
    const { course_title, topic, difficulty = "intermediate", max_score = 100 } = req.body;
    if (!course_title || !topic)
      return res.status(400).json({ error: "course_title and topic are required." });
    const result = await runAgent(
      `Create a detailed assignment for a course on "${course_title}" about "${topic}". Include: a clear description of what students must do, learning objectives, deliverables, and grading criteria. Level: ${difficulty}. Max score: ${max_score} points. Use plain text paragraphs (no JSON).`
    );
    res.json(result);
  } catch (err) {
    console.error("generateAssignment error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Generate Class Agenda (via agent) ───────────────────────────────────────
export async function generateClassAgenda(req, res) {
  try {
    const { course_title, topic, duration_minutes = 60 } = req.body;
    if (!course_title || !topic)
      return res.status(400).json({ error: "course_title and topic are required." });
    const result = await runAgent(
      `Create a detailed ${duration_minutes}-minute live class agenda for "${topic}" in the course "${course_title}". Include: learning objectives, timestamped segments, activities, discussion questions, and key takeaways. Format with clear headings.`
    );
    res.json(result);
  } catch (err) {
    console.error("generateClassAgenda error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Study Plan (no save) ────────────────────────────────────────────────────
export async function studyPlan(req, res) {
  try {
    const {
      student_name,
      enrolled_courses,
      weak_areas = [],
      available_hours_per_week = 10,
      goals = "",
    } = req.body;
    if (!student_name || !enrolled_courses?.length)
      return res.status(400).json({ error: "student_name and enrolled_courses are required." });
    const result = await createStudySchedule({
      courses: enrolled_courses,
      weak_topics: weak_areas,
      hours_per_week: available_hours_per_week,
      goals: goals || `Academic excellence for ${student_name}`,
      student_name,
    });
    res.json({ study_plan: result, student: student_name });
  } catch (err) {
    console.error("studyPlan error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── POST /api/ai/students/:studentId/study-plans — generate + save ───────────
export async function generateAndSaveStudyPlan(req, res) {
  try {
    const { studentId } = req.params;
    const { student_name, enrolled_courses, weak_areas, available_hours_per_week, goals } =
      req.body;

    if (!student_name || !enrolled_courses?.length)
      return res.status(400).json({ error: "student_name and enrolled_courses are required." });

    const studyPlanText = await createStudySchedule({
      courses: enrolled_courses,
      weak_topics: weak_areas || [],
      hours_per_week: available_hours_per_week || 10,
      goals: goals || `Academic excellence for ${student_name}`,
      student_name,
    });

    const plan = await AIStudyPlan.create({
      student: studentId,
      title: `Study Plan — ${enrolled_courses.slice(0, 2).join(", ")}`,
      content: studyPlanText,
      courses: enrolled_courses,
      hoursPerWeek: available_hours_per_week || 10,
      goals: goals || "",
    });

    res
      .status(201)
      .json({ study_plan: studyPlanText, student: student_name, savedPlan: formatPlan(plan) });
  } catch (err) {
    console.error("generateAndSaveStudyPlan error:", err);
    res.status(500).json({ error: err.message || "Failed to generate study plan." });
  }
}

// ─── POST /api/ai/students/:studentId/study-plans/save ───────────────────────
export async function saveStudyPlan(req, res) {
  try {
    const { studentId } = req.params;
    const { content, courses, hoursPerWeek, goals } = req.body;
    if (!content) return res.status(400).json({ error: "content is required." });

    const plan = await AIStudyPlan.create({
      student: studentId,
      title: `Study Plan — ${(courses || []).slice(0, 2).join(", ") || "General"}`,
      content,
      courses: courses || [],
      hoursPerWeek: hoursPerWeek || 10,
      goals: goals || "",
    });
    res.status(201).json(formatPlan(plan));
  } catch (err) {
    console.error("saveStudyPlan error:", err);
    res.status(500).json({ error: "Failed to save study plan." });
  }
}

// ─── GET /api/ai/students/:studentId/study-plans ─────────────────────────────
export async function getStudyPlans(req, res) {
  try {
    const plans = await AIStudyPlan.find({ student: req.params.studentId }).sort({ createdAt: -1 });
    res.json(plans.map(formatPlan));
  } catch {
    res.status(500).json({ error: "Failed to fetch study plans." });
  }
}

// ─── DELETE /api/ai/study-plans/:id ──────────────────────────────────────────
export async function deleteStudyPlan(req, res) {
  try {
    const plan = await AIStudyPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found." });
    if (plan.student.toString() !== req.user.id.toString())
      return res.status(403).json({ error: "Not authorized." });
    await plan.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete study plan." });
  }
}

// ─── Course Outline (no save) ────────────────────────────────────────────────
export async function courseOutline(req, res) {
  try {
    const {
      course_title,
      subject,
      duration_weeks = 8,
      target_level = "intermediate",
      learning_objectives = "",
    } = req.body;
    if (!course_title || !subject)
      return res.status(400).json({ error: "course_title and subject are required." });
    const result = await generateCourseOutline({
      course_title,
      subject,
      duration_weeks,
      target_level,
      learning_objectives,
    });
    res.json({ outline: result, course_title });
  } catch (err) {
    console.error("courseOutline error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── POST /api/ai/teachers/:teacherId/outlines — generate + save ──────────────
export async function generateAndSaveOutline(req, res) {
  try {
    const { teacherId } = req.params;
    const { course_title, subject, duration_weeks, target_level, learning_objectives, courseId } =
      req.body;

    if (!course_title || !subject)
      return res.status(400).json({ error: "course_title and subject are required." });

    const outlineText = await generateCourseOutline({
      course_title,
      subject,
      duration_weeks: duration_weeks || 8,
      target_level: target_level || "intermediate",
      learning_objectives: learning_objectives || "",
    });

    const outline = await AICourseOutline.create({
      teacher: teacherId,
      course: courseId || null,
      courseTitle: course_title,
      subject,
      durationWeeks: duration_weeks || 8,
      targetLevel: target_level || "intermediate",
      content: outlineText,
    });

    res
      .status(201)
      .json({ outline: outlineText, course_title, savedOutline: formatOutline(outline) });
  } catch (err) {
    console.error("generateAndSaveOutline error:", err);
    res.status(500).json({ error: err.message || "Failed to generate outline." });
  }
}

// ─── POST /api/ai/teachers/:teacherId/outlines/save ──────────────────────────
export async function saveOutline(req, res) {
  try {
    const { teacherId } = req.params;
    const { content, courseTitle, subject, durationWeeks, targetLevel, courseId } = req.body;
    if (!content || !courseTitle)
      return res.status(400).json({ error: "content and courseTitle are required." });

    const outline = await AICourseOutline.create({
      teacher: teacherId,
      course: courseId || null,
      courseTitle,
      subject: subject || "",
      durationWeeks: durationWeeks || 8,
      targetLevel: targetLevel || "intermediate",
      content,
    });
    res.status(201).json(formatOutline(outline));
  } catch {
    res.status(500).json({ error: "Failed to save outline." });
  }
}

// ─── GET /api/ai/teachers/:teacherId/outlines ────────────────────────────────
export async function getOutlines(req, res) {
  try {
    const outlines = await AICourseOutline.find({ teacher: req.params.teacherId })
      .populate("course", "title")
      .sort({ createdAt: -1 });
    res.json(outlines.map(formatOutline));
  } catch {
    res.status(500).json({ error: "Failed to fetch outlines." });
  }
}

// ─── DELETE /api/ai/outlines/:id ─────────────────────────────────────────────
export async function deleteOutline(req, res) {
  try {
    const outline = await AICourseOutline.findById(req.params.id);
    if (!outline) return res.status(404).json({ error: "Outline not found." });
    if (outline.teacher.toString() !== req.user.id.toString())
      return res.status(403).json({ error: "Not authorized." });
    await outline.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete outline." });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatQuiz(q) {
  return {
    id: q._id,
    title: q.title,
    course: q.course,
    questions: q.questions,
    timeLimit: q.timeLimit,
    dueDate: q.dueDate,
    isActive: q.isActive,
    questionCount: q.questions?.length ?? 0,
    createdAt: q.createdAt,
  };
}

function formatPlan(p) {
  return {
    _id: p._id,
    id: p._id,
    title: p.title,
    content: p.content,
    courses: p.courses,
    hoursPerWeek: p.hoursPerWeek,
    goals: p.goals,
    createdAt: p.createdAt,
  };
}

function formatOutline(o) {
  return {
    id: o._id,
    courseTitle: o.courseTitle,
    subject: o.subject,
    durationWeeks: o.durationWeeks,
    targetLevel: o.targetLevel,
    content: o.content,
    course: o.course ? { id: o.course._id || o.course, title: o.course.title } : null,
    createdAt: o.createdAt,
  };
}
