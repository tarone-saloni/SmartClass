import Course from '../models/Course.js';
import Material from '../models/Material.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import LiveClass from '../models/LiveClass.js';

// ─── GET /api/teachers/:id/dashboard ────────────────────────────────────────
export async function getTeacherDashboard(req, res) {
  try {
    const { id } = req.params;
    const courses = await Course.find({ teacher: id }).sort({ createdAt: -1 });
    const courseIds = courses.map((c) => c._id);
    const totalStudents = courses.reduce((acc, c) => acc + c.enrolledStudents.length, 0);

    const [materialCounts, assignmentCounts, quizCounts, liveClassCounts, pendingSubmissions] =
      await Promise.all([
        Material.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
        Assignment.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
        Quiz.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
        LiveClass.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
        Submission.countDocuments({
          assignment: {
            $in: await Assignment.find({ course: { $in: courseIds } }).distinct('_id'),
          },
          status: 'submitted',
        }),
      ]);

    const toMap = (arr) => Object.fromEntries(arr.map((x) => [x._id.toString(), x.count]));
    const matMap = toMap(materialCounts);
    const asnMap = toMap(assignmentCounts);
    const qzMap = toMap(quizCounts);
    const lcMap = toMap(liveClassCounts);

    // Upcoming live classes
    const upcomingClasses = await LiveClass.find({
      course: { $in: courseIds },
      status: { $in: ['scheduled', 'live'] },
      scheduledAt: { $gte: new Date() },
    })
      .populate('course', 'title')
      .sort({ scheduledAt: 1 })
      .limit(5);

    res.json({
      totalCourses: courses.length,
      totalStudents,
      pendingSubmissions,
      upcomingClasses: upcomingClasses.map(formatUpcoming),
      courses: courses.map((c) => ({
        id: c._id,
        title: c.title,
        description: c.description,
        subject: c.subject,
        enrollmentCount: c.enrolledStudents.length,
        materialCount: matMap[c._id.toString()] ?? 0,
        assignmentCount: asnMap[c._id.toString()] ?? 0,
        quizCount: qzMap[c._id.toString()] ?? 0,
        liveClassCount: lcMap[c._id.toString()] ?? 0,
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

    const [materialCounts, assignmentCounts, quizCounts, mySubmissions, myQuizResults] =
      await Promise.all([
        Material.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
        Assignment.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
        Quiz.aggregate([
          { $match: { course: { $in: courseIds }, isActive: true } },
          { $group: { _id: '$course', count: { $sum: 1 } } },
        ]),
        Submission.find({
          student: id,
          assignment: {
            $in: await Assignment.find({ course: { $in: courseIds } }).distinct('_id'),
          },
        }).select('assignment status score'),
        QuizResult.find({
          student: id,
          quiz: { $in: await Quiz.find({ course: { $in: courseIds } }).distinct('_id') },
        }).select('quiz score totalPoints'),
      ]);

    const toMap = (arr) => Object.fromEntries(arr.map((x) => [x._id.toString(), x.count]));
    const matMap = toMap(materialCounts);
    const asnMap = toMap(assignmentCounts);
    const qzMap = toMap(quizCounts);

    const submittedAssignments = new Set(mySubmissions.map((s) => s.assignment.toString()));
    const completedQuizzes = new Set(myQuizResults.map((r) => r.quiz.toString()));

    // Total pending assignments across all courses
    const totalAssignments = await Assignment.find({ course: { $in: courseIds } }).distinct('_id');
    const pendingAssignments = totalAssignments.filter(
      (aId) => !submittedAssignments.has(aId.toString())
    ).length;

    // Upcoming live classes for this student
    const upcomingClasses = await LiveClass.find({
      course: { $in: courseIds },
      status: { $in: ['scheduled', 'live'] },
      scheduledAt: { $gte: new Date() },
    })
      .populate('course', 'title')
      .sort({ scheduledAt: 1 })
      .limit(5);

    res.json({
      totalEnrolled: courses.length,
      pendingAssignments,
      completedQuizzes: completedQuizzes.size,
      upcomingClasses: upcomingClasses.map(formatUpcoming),
      enrolledCourses: courses.map((c) => ({
        id: c._id,
        title: c.title,
        description: c.description,
        subject: c.subject,
        teacher: c.teacher ? { id: c.teacher._id, name: c.teacher.name } : null,
        materialCount: matMap[c._id.toString()] ?? 0,
        assignmentCount: asnMap[c._id.toString()] ?? 0,
        quizCount: qzMap[c._id.toString()] ?? 0,
      })),
    });
  } catch (err) {
    console.error('getStudentDashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatUpcoming(lc) {
  return {
    id: lc._id,
    title: lc.title,
    course: lc.course ? { id: lc.course._id, title: lc.course.title } : lc.course,
    scheduledAt: lc.scheduledAt,
    status: lc.status,
    meetingLink: lc.meetingLink,
  };
}
