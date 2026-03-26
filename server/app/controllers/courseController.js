import Course from '../models/Course.js';
import User from '../models/User.js';
import Material from '../models/Material.js';
import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import transporter from '../config/NodeMailer.js';
import { getIO } from '../services/socketService.js';

// ─── POST /api/courses ────────────────────────────────────────────────────────
export async function createCourse(req, res) {
  try {
    const { title, description, subject, teacherId } = req.body;
    if (!title || !teacherId)
      return res.status(400).json({ error: 'Title and teacherId are required.' });

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher')
      return res.status(403).json({ error: 'Only teachers can create courses.' });

    const course = await Course.create({ title, description, subject, teacher: teacherId });

    const students = await User.find({ role: 'student', isVerified: true });

    if (students.length > 0) {
      const notifMessage = `New course available: "${title}" by ${teacher.name}`;

      await Notification.insertMany(
        students.map((s) => ({ user: s._id, message: notifMessage, type: 'course' }))
      );

      try {
        const io = getIO();
        students.forEach((s) => {
          io.to(`user:${s._id}`).emit('new-course', {
            id: `notif_${Date.now()}_${s._id}`,
            message: notifMessage,
            courseId: course._id,
            createdAt: course.createdAt,
            read: false,
          });
        });
      } catch (_) {
        // socket not critical — continue
      }

      sendCourseEmails(students, course, teacher.name).catch(console.error);
    }

    res.status(201).json(formatCourse(course, teacher));
  } catch (err) {
    console.error('createCourse error:', err);
    res.status(500).json({ error: 'Failed to create course.' });
  }
}

// ─── GET /api/courses ─────────────────────────────────────────────────────────
export async function getCourses(_req, res) {
  try {
    const courses = await Course.find().populate('teacher', 'name email').sort({ createdAt: -1 });

    const courseIds = courses.map((c) => c._id);
    const [materialCounts, assignmentCounts] = await Promise.all([
      Material.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
      Assignment.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
    ]);

    const matMap = Object.fromEntries(materialCounts.map((x) => [x._id.toString(), x.count]));
    const asnMap = Object.fromEntries(assignmentCounts.map((x) => [x._id.toString(), x.count]));

    res.json(
      courses.map((c) =>
        formatCourse(c, c.teacher, matMap[c._id.toString()] ?? 0, asnMap[c._id.toString()] ?? 0)
      )
    );
  } catch (err) {
    console.error('getCourses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
}

// ─── GET /api/courses/:id ─────────────────────────────────────────────────────
export async function getCourse(req, res) {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name email');
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const [materialCount, assignmentCount] = await Promise.all([
      Material.countDocuments({ course: course._id }),
      Assignment.countDocuments({ course: course._id }),
    ]);

    res.json(formatCourse(course, course.teacher, materialCount, assignmentCount));
  } catch (err) {
    console.error('getCourse error:', err);
    res.status(500).json({ error: 'Failed to fetch course.' });
  }
}

// ─── PATCH /api/courses/:id ───────────────────────────────────────────────────
export async function updateCourse(req, res) {
  try {
    const { title, description, subject, teacherId } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the course teacher can update it.' });

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (subject !== undefined) course.subject = subject;
    await course.save();

    const [materialCount, assignmentCount] = await Promise.all([
      Material.countDocuments({ course: course._id }),
      Assignment.countDocuments({ course: course._id }),
    ]);

    res.json(formatCourse(course, null, materialCount, assignmentCount));
  } catch (err) {
    console.error('updateCourse error:', err);
    res.status(500).json({ error: 'Failed to update course.' });
  }
}

// ─── DELETE /api/courses/:id ──────────────────────────────────────────────────
export async function deleteCourse(req, res) {
  try {
    const { teacherId } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the course teacher can delete it.' });

    await Course.findByIdAndDelete(req.params.id);
    // Clean up related data
    await Promise.all([
      Material.deleteMany({ course: req.params.id }),
      Assignment.deleteMany({ course: req.params.id }),
    ]);

    res.json({ message: 'Course deleted.' });
  } catch (err) {
    console.error('deleteCourse error:', err);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
}

// ─── POST /api/courses/:id/enroll ────────────────────────────────────────────
export async function enrollCourse(req, res) {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required.' });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const alreadyEnrolled = course.enrolledStudents.some(
      (s) => s.toString() === studentId.toString()
    );
    if (alreadyEnrolled) return res.status(400).json({ error: 'Already enrolled.' });

    course.enrolledStudents.push(studentId);
    await course.save();

    res.json({ message: 'Enrolled successfully.' });
  } catch (err) {
    console.error('enrollCourse error:', err);
    res.status(500).json({ error: 'Failed to enroll.' });
  }
}

// ─── DELETE /api/courses/:id/enroll ──────────────────────────────────────────
export async function unenrollCourse(req, res) {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required.' });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const idx = course.enrolledStudents.findIndex((s) => s.toString() === studentId.toString());
    if (idx === -1) return res.status(400).json({ error: 'Not enrolled in this course.' });

    course.enrolledStudents.splice(idx, 1);
    await course.save();

    res.json({ message: 'Unenrolled successfully.' });
  } catch (err) {
    console.error('unenrollCourse error:', err);
    res.status(500).json({ error: 'Failed to unenroll.' });
  }
}

// ─── GET /api/courses/:id/students ───────────────────────────────────────────
export async function getCourseStudents(req, res) {
  try {
    const { id } = req.params;
    const { teacherId } = req.query;

    const course = await Course.findById(id).populate('enrolledStudents', 'name email avatar');
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    if (teacherId && course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the course teacher can view students.' });

    res.json({
      courseId: course._id,
      title: course.title,
      students: course.enrolledStudents.map((s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        avatar: s.avatar,
      })),
      total: course.enrolledStudents.length,
    });
  } catch (err) {
    console.error('getCourseStudents error:', err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
}

// ─── GET /api/teachers/:id/dashboard ────────────────────────────────────────
export async function getTeacherDashboard(req, res) {
  try {
    const { id } = req.params;
    const courses = await Course.find({ teacher: id }).sort({ createdAt: -1 });
    const totalStudents = courses.reduce((acc, c) => acc + c.enrolledStudents.length, 0);

    const courseIds = courses.map((c) => c._id);
    const [materialCounts, assignmentCounts] = await Promise.all([
      Material.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
      Assignment.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
    ]);

    const matMap = Object.fromEntries(materialCounts.map((x) => [x._id.toString(), x.count]));
    const asnMap = Object.fromEntries(assignmentCounts.map((x) => [x._id.toString(), x.count]));

    res.json({
      totalCourses: courses.length,
      totalStudents,
      courses: courses.map((c) => ({
        id: c._id,
        title: c.title,
        description: c.description,
        subject: c.subject,
        enrollmentCount: c.enrolledStudents.length,
        materialCount: matMap[c._id.toString()] ?? 0,
        assignmentCount: asnMap[c._id.toString()] ?? 0,
      })),
    });
  } catch (err) {
    console.error('getTeacherDashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
}

// ─── GET /api/students/:id/dashboard ────────────────────────────────────────
export async function getStudentDashboard(req, res) {
  try {
    const { id } = req.params;
    const courses = await Course.find({ enrolledStudents: id })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    const courseIds = courses.map((c) => c._id);
    const [materialCounts, assignmentCounts] = await Promise.all([
      Material.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
      Assignment.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
    ]);

    const matMap = Object.fromEntries(materialCounts.map((x) => [x._id.toString(), x.count]));
    const asnMap = Object.fromEntries(assignmentCounts.map((x) => [x._id.toString(), x.count]));

    res.json({
      enrolledCourses: courses.map((c) => ({
        id: c._id,
        title: c.title,
        description: c.description,
        subject: c.subject,
        teacher: c.teacher ? { id: c.teacher._id, name: c.teacher.name } : null,
        materialCount: matMap[c._id.toString()] ?? 0,
        assignmentCount: asnMap[c._id.toString()] ?? 0,
      })),
    });
  } catch (err) {
    console.error('getStudentDashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCourse(course, teacher, materialCount = 0, assignmentCount = 0) {
  return {
    id: course._id,
    title: course.title,
    description: course.description,
    subject: course.subject,
    teacher: teacher
      ? { id: teacher._id || teacher.id, name: teacher.name }
      : null,
    enrollmentCount: course.enrolledStudents?.length ?? 0,
    materialCount,
    assignmentCount,
    createdAt: course.createdAt,
  };
}

async function sendCourseEmails(students, course, teacherName) {
  for (const student of students) {
    try {
      await transporter.sendMail({
        from: `"SmartClass" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `New Course Available: ${course.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#6366f1;margin-top:0">SmartClass</h2>
            <h3 style="color:#111827;margin-bottom:4px">New Course Available!</h3>
            <p style="color:#374151;margin-top:4px">Hi ${student.name},</p>
            <p style="color:#374151">A new course has just been published that you can enroll in:</p>
            <div style="background:#f3f4f6;border-radius:10px;padding:20px;margin:16px 0;border-left:4px solid #6366f1">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827">${course.title}</p>
              ${course.subject ? `<p style="margin:0 0 8px;color:#6366f1;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">${course.subject}</p>` : ''}
              ${course.description ? `<p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5">${course.description}</p>` : ''}
            </div>
            <p style="color:#374151;font-size:14px">Taught by: <strong>${teacherName}</strong></p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px">
              Log in to <strong>SmartClass</strong> to enroll and start learning!
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error(`Failed to send email to ${student.email}:`, emailErr.message);
    }
  }
}
