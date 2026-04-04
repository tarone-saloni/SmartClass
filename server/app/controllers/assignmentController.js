import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Course from "../models/Course.js";
import { emitToCourse, emitToUser } from "../services/socketService.js";
import { pushNotification } from "../services/notificationService.js";

// ─── POST /api/courses/:courseId/assignments ──────────────────────────────────
export async function createAssignment(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, dueDate, maxScore, teacherId } = req.body;

    if (!title || !teacherId)
      return res.status(400).json({ error: "title and teacherId are required." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can create assignments." });

    // Auto-set order to next available position in this course
    const lastAssignment = await Assignment.findOne({ course: courseId }).sort({ order: -1 });
    const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;

    const assignment = await Assignment.create({
      title,
      description,
      dueDate: dueDate || null,
      maxScore: maxScore || 100,
      order: nextOrder,
      course: courseId,
      createdBy: teacherId,
    });

    const formatted = formatAssignment(assignment);
    emitToCourse(courseId, "assignment:new", formatted);

    // Notify every enrolled student
    course.enrolledStudents.forEach((studentId) => {
      pushNotification(studentId.toString(), `📝 New assignment: "${title}"`, "course");
    });

    res.status(201).json(formatted);
  } catch (err) {
    console.error("createAssignment error:", err);
    res.status(500).json({ error: "Failed to create assignment." });
  }
}

// ─── GET /api/courses/:courseId/assignments ───────────────────────────────────
export async function getCourseAssignments(req, res) {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    // Always return in sequential order (ascending by order, then createdAt for ties)
    const assignments = await Assignment.find({ course: courseId }).sort({
      order: 1,
      createdAt: 1,
    });
    res.json(assignments.map(formatAssignment));
  } catch (err) {
    console.error("getCourseAssignments error:", err);
    res.status(500).json({ error: "Failed to fetch assignments." });
  }
}

// ─── GET /api/assignments/:id ─────────────────────────────────────────────────
export async function getAssignment(req, res) {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("createdBy", "name");
    if (!assignment) return res.status(404).json({ error: "Assignment not found." });
    res.json(formatAssignment(assignment));
  } catch (err) {
    console.error("getAssignment error:", err);
    res.status(500).json({ error: "Failed to fetch assignment." });
  }
}

// ─── PATCH /api/assignments/:id ───────────────────────────────────────────────
export async function updateAssignment(req, res) {
  try {
    const { title, description, dueDate, maxScore, teacherId } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found." });

    if (assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ error: "Only the assignment creator can update it." });

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (maxScore !== undefined) assignment.maxScore = maxScore;
    await assignment.save();

    const formatted = formatAssignment(assignment);
    emitToCourse(assignment.course.toString(), "assignment:updated", formatted);
    res.json(formatted);
  } catch (err) {
    console.error("updateAssignment error:", err);
    res.status(500).json({ error: "Failed to update assignment." });
  }
}

// ─── DELETE /api/assignments/:id ──────────────────────────────────────────────
export async function deleteAssignment(req, res) {
  try {
    const { teacherId } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found." });

    if (assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ error: "Only the assignment creator can delete it." });

    const courseId = assignment.course.toString();
    const deletedOrder = assignment.order;

    await Assignment.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ assignment: req.params.id });

    // Re-number remaining assignments to keep order contiguous
    await Assignment.updateMany(
      { course: courseId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    emitToCourse(courseId, "assignment:deleted", { id: req.params.id, courseId });
    res.json({ message: "Assignment deleted." });
  } catch (err) {
    console.error("deleteAssignment error:", err);
    res.status(500).json({ error: "Failed to delete assignment." });
  }
}

// ─── POST /api/assignments/:id/submit ────────────────────────────────────────
export async function submitAssignment(req, res) {
  try {
    const { id } = req.params;
    const { studentId, content, fileUrl } = req.body;

    if (!studentId) return res.status(400).json({ error: "studentId is required." });

    const assignment = await Assignment.findById(id).populate("createdBy", "name");
    if (!assignment) return res.status(404).json({ error: "Assignment not found." });

    const course = await Course.findById(assignment.course);
    const isEnrolled = course.enrolledStudents.some((s) => s.toString() === studentId);
    if (!isEnrolled) return res.status(403).json({ error: "You are not enrolled in this course." });

    // ── Sequential submission check ─────────────────────────────────────────
    // Get all assignments in this course that come before this one (lower order)
    const previousAssignments = await Assignment.find({
      course: assignment.course,
      order: { $lt: assignment.order },
    }).select("_id title order dueDate");

    if (previousAssignments.length > 0) {
      const prevIds = previousAssignments.map((a) => a._id);
      const completedPrevious = await Submission.find({
        assignment: { $in: prevIds },
        student: studentId,
      }).select("assignment");

      const now = new Date();
      const completedIds = new Set(completedPrevious.map((s) => s.assignment.toString()));
      // A previous assignment blocks submission only if it has no submission AND its due date hasn't passed
      const missing = previousAssignments.find((a) => {
        const isSubmitted = completedIds.has(a._id.toString());
        const isOverdue = a.dueDate && now > a.dueDate;
        return !isSubmitted && !isOverdue;
      });

      if (missing) {
        return res.status(403).json({
          error: `You must submit Assignment ${missing.order}: "${missing.title}" before submitting this one.`,
          blockedBy: { id: missing._id, title: missing.title, order: missing.order },
        });
      }
    }
    // ── End sequential check ────────────────────────────────────────────────

    const now = new Date();
    const isLate = assignment.dueDate && now > assignment.dueDate;

    const submission = await Submission.findOneAndUpdate(
      { assignment: id, student: studentId },
      {
        content: content || "",
        fileUrl: fileUrl || "",
        status: isLate ? "late" : "submitted",
        submittedAt: now,
        score: null,
        feedback: "",
      },
      { upsert: true, new: true }
    );

    // Notify teacher in real-time (socket) + persist notification
    emitToUser(course.teacher.toString(), "assignment:submitted", {
      assignmentId: id,
      assignmentTitle: assignment.title,
      studentId,
      courseId: assignment.course.toString(),
      submittedAt: now,
    });
    pushNotification(
      course.teacher.toString(),
      `📤 A student submitted assignment: "${assignment.title}"`,
      "course"
    );

    res.status(201).json(formatSubmission(submission));
  } catch (err) {
    console.error("submitAssignment error:", err);
    res.status(500).json({ error: "Failed to submit assignment." });
  }
}

// ─── GET /api/assignments/:id/submissions ─────────────────────────────────────
export async function getSubmissions(req, res) {
  try {
    const { id } = req.params;
    const { teacherId } = req.query;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found." });

    if (assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ error: "Only the assignment creator can view submissions." });

    const submissions = await Submission.find({ assignment: id })
      .populate("student", "name email")
      .sort({ submittedAt: -1 });

    res.json(submissions.map(formatSubmission));
  } catch (err) {
    console.error("getSubmissions error:", err);
    res.status(500).json({ error: "Failed to fetch submissions." });
  }
}

// ─── GET /api/assignments/:id/my-submission ───────────────────────────────────
export async function getMySubmission(req, res) {
  try {
    const { id } = req.params;
    const { studentId } = req.query;

    if (!studentId) return res.status(400).json({ error: "studentId is required." });

    const submission = await Submission.findOne({ assignment: id, student: studentId });
    if (!submission) return res.status(404).json({ error: "No submission found." });

    res.json(formatSubmission(submission));
  } catch (err) {
    console.error("getMySubmission error:", err);
    res.status(500).json({ error: "Failed to fetch submission." });
  }
}

// ─── PATCH /api/submissions/:submissionId/grade ───────────────────────────────
export async function gradeSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const { score, feedback, teacherId } = req.body;

    const submission = await Submission.findById(submissionId).populate("assignment");
    if (!submission) return res.status(404).json({ error: "Submission not found." });

    if (submission.assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ error: "Only the assignment teacher can grade submissions." });

    if (score !== undefined) submission.score = score;
    if (feedback !== undefined) submission.feedback = feedback;
    submission.status = "graded";
    await submission.save();

    // Notify the student of their grade (socket) + persist notification
    emitToUser(submission.student.toString(), "assignment:graded", {
      assignmentId: submission.assignment._id.toString(),
      assignmentTitle: submission.assignment.title,
      submissionId,
      score: submission.score,
      feedback: submission.feedback,
      maxScore: submission.assignment.maxScore,
    });
    pushNotification(
      submission.student.toString(),
      `✅ Your assignment "${submission.assignment.title}" was graded: ${submission.score}/${submission.assignment.maxScore}`,
      "course"
    );

    res.json(formatSubmission(submission));
  } catch (err) {
    console.error("gradeSubmission error:", err);
    res.status(500).json({ error: "Failed to grade submission." });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAssignment(a) {
  return {
    id: a._id,
    title: a.title,
    description: a.description,
    dueDate: a.dueDate,
    maxScore: a.maxScore,
    order: a.order,
    course: a.course,
    createdBy: a.createdBy ? { id: a.createdBy._id || a.createdBy, name: a.createdBy.name } : null,
    createdAt: a.createdAt,
  };
}

function formatSubmission(s) {
  return {
    id: s._id,
    assignment: s.assignment?._id || s.assignment,
    student: s.student
      ? { id: s.student._id || s.student, name: s.student.name, email: s.student.email }
      : null,
    content: s.content,
    fileUrl: s.fileUrl,
    status: s.status,
    score: s.score,
    feedback: s.feedback,
    submittedAt: s.submittedAt,
  };
}
