import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Material from "../models/Material.js";
import CompletedMaterial from "../models/CompletedMaterial.js";
import { getIO } from "../services/socketService.js";
import { pushNotification } from "../services/notificationService.js";

// ─── POST /api/enrollments ────────────────────────────────────────────────────
export async function enroll(req, res) {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId)
      return res.status(400).json({ error: "studentId and courseId are required." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    // Check already enrolled
    const alreadyEnrolled = course.enrolledStudents.some((s) => s.toString() === studentId);
    if (alreadyEnrolled) return res.status(400).json({ error: "Already enrolled." });

    // Add to Course.enrolledStudents (keeps existing code working)
    course.enrolledStudents.push(studentId);
    await course.save();

    // Create or reactivate Enrollment record
    const enrollment = await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { status: "active", enrolledAt: new Date(), progress: 0, completedAt: null },
      { upsert: true, new: true }
    );

    // Notify the teacher (persists to DB + emits notification:new)
    pushNotification(
      course.teacher.toString(),
      `🎓 A new student enrolled in "${course.title}"`,
      "course"
    );
    // Keep student-enrolled for StudentDashboard / other listeners
    try {
      const io = getIO();
      io.to(`user:${course.teacher}`).emit("student-enrolled", {
        message: `A new student enrolled in "${course.title}"`,
        courseId,
        studentId,
      });
    } catch {
      /* non-critical */
    }

    res.status(201).json(formatEnrollment(enrollment, course));
  } catch (err) {
    console.error("enroll error:", err);
    res.status(500).json({ error: "Failed to enroll." });
  }
}

// ─── DELETE /api/enrollments ──────────────────────────────────────────────────
export async function unenroll(req, res) {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId)
      return res.status(400).json({ error: "studentId and courseId are required." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    const idx = course.enrolledStudents.findIndex((s) => s.toString() === studentId);
    if (idx === -1) return res.status(400).json({ error: "Not enrolled in this course." });

    course.enrolledStudents.splice(idx, 1);
    await course.save();

    // Mark enrollment as dropped
    await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { status: "dropped" }
    );

    res.json({ message: "Unenrolled successfully." });
  } catch (err) {
    console.error("unenroll error:", err);
    res.status(500).json({ error: "Failed to unenroll." });
  }
}

// ─── GET /api/enrollments/my-courses?studentId= ───────────────────────────────
// Student gets all their enrollments with progress
export async function getMyEnrollments(req, res) {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ error: "studentId is required." });

    const enrollments = await Enrollment.find({ student: studentId, status: "active" })
      .populate({
        path: "course",
        populate: { path: "teacher", select: "name email" },
      })
      .sort({ enrolledAt: -1 });

    res.json(enrollments.map((e) => formatEnrollment(e, e.course)));
  } catch (err) {
    console.error("getMyEnrollments error:", err);
    res.status(500).json({ error: "Failed to fetch enrollments." });
  }
}

// ─── GET /api/enrollments/course/:courseId?teacherId= ────────────────────────
// Teacher sees all enrolled students for a course
export async function getCourseEnrollments(req, res) {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.query;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    if (teacherId && course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can view enrollments." });

    const enrollments = await Enrollment.find({ course: courseId, status: "active" })
      .populate("student", "name email avatar")
      .sort({ enrolledAt: -1 });

    res.json({
      courseId,
      courseTitle: course.title,
      total: enrollments.length,
      enrollments: enrollments.map((e) => ({
        id: e._id,
        student: e.student
          ? {
              id: e.student._id,
              name: e.student.name,
              email: e.student.email,
              avatar: e.student.avatar,
            }
          : null,
        progress: e.progress,
        status: e.status,
        enrolledAt: e.enrolledAt,
      })),
    });
  } catch (err) {
    console.error("getCourseEnrollments error:", err);
    res.status(500).json({ error: "Failed to fetch enrollments." });
  }
}

// ─── GET /api/enrollments/progress?studentId=&courseId= ──────────────────────
// Get a student's progress in a specific course
export async function getCourseProgress(req, res) {
  try {
    const { studentId, courseId } = req.query;
    if (!studentId || !courseId)
      return res.status(400).json({ error: "studentId and courseId are required." });

    const [enrollment, totalMaterials, completedMaterials] = await Promise.all([
      Enrollment.findOne({ student: studentId, course: courseId }),
      Material.countDocuments({ course: courseId }),
      CompletedMaterial.countDocuments({ student: studentId, course: courseId }),
    ]);

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found." });

    const progress =
      totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

    // Keep enrollment progress in sync
    if (enrollment.progress !== progress) {
      enrollment.progress = progress;
      if (progress === 100) {
        enrollment.status = "completed";
        enrollment.completedAt = new Date();
      }
      await enrollment.save();
    }

    res.json({
      studentId,
      courseId,
      totalMaterials,
      completedMaterials,
      progress,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    });
  } catch (err) {
    console.error("getCourseProgress error:", err);
    res.status(500).json({ error: "Failed to fetch progress." });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatEnrollment(e, course) {
  return {
    id: e._id,
    student: e.student,
    course: course
      ? {
          id: course._id,
          title: course.title,
          description: course.description,
          subject: course.subject,
          teacher: course.teacher
            ? { id: course.teacher._id || course.teacher, name: course.teacher.name }
            : null,
        }
      : e.course,
    progress: e.progress,
    status: e.status,
    enrolledAt: e.enrolledAt,
    completedAt: e.completedAt,
  };
}
