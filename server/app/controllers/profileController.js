import User from "../models/User.js";
import Course from "../models/Course.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import LiveClass from "../models/LiveClass.js";
import Enrollment from "../models/Enrollment.js";
import Material from "../models/Material.js";
import CompletedMaterial from "../models/CompletedMaterial.js";

// ─── GET /api/profile/:userId ─────────────────────────────────────────────────
export async function getProfile(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    if (user.role === "teacher") {
      return res.json(await buildTeacherProfile(user));
    } else {
      return res.json(await buildStudentProfile(user));
    }
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
}

// ─── Teacher profile ──────────────────────────────────────────────────────────
async function buildTeacherProfile(user) {
  const courses = await Course.find({ teacher: user._id }).sort({ createdAt: -1 });
  const courseIds = courses.map((c) => c._id);

  const [assignments, quizzes, liveClasses, submissions] = await Promise.all([
    Assignment.find({ course: { $in: courseIds } }),
    Quiz.find({ course: { $in: courseIds } }),
    LiveClass.find({ course: { $in: courseIds } }),
    Submission.find({
      assignment: {
        $in: await Assignment.find({ course: { $in: courseIds } }).distinct("_id"),
      },
    }).select("status score assignment"),
  ]);

  const totalStudents = courses.reduce((acc, c) => acc + c.enrolledStudents.length, 0);
  const pendingReviews = submissions.filter(
    (s) => s.status === "submitted" || s.status === "late"
  ).length;
  const gradedCount = submissions.filter((s) => s.status === "graded").length;

  // Per-course stats
  const assignmentMap = {};
  const quizMap = {};
  const lcMap = {};
  assignments.forEach((a) => {
    const cid = a.course.toString();
    assignmentMap[cid] = (assignmentMap[cid] || 0) + 1;
  });
  quizzes.forEach((q) => {
    const cid = q.course.toString();
    quizMap[cid] = (quizMap[cid] || 0) + 1;
  });
  liveClasses.forEach((lc) => {
    const cid = lc.course.toString();
    lcMap[cid] = (lcMap[cid] || 0) + 1;
  });

  // Recent activity: last 5 submissions across all courses
  const recentSubmissions = await Submission.find({
    assignment: { $in: assignments.map((a) => a._id) },
  })
    .populate("student", "name avatar")
    .populate("assignment", "title")
    .sort({ submittedAt: -1 })
    .limit(5);

  return {
    user: formatUser(user),
    stats: {
      totalCourses: courses.length,
      totalStudents,
      totalAssignments: assignments.length,
      totalQuizzes: quizzes.length,
      totalLiveClasses: liveClasses.length,
      pendingReviews,
      gradedCount,
    },
    courses: courses.map((c) => ({
      id: c._id,
      title: c.title,
      description: c.description,
      subject: c.subject,
      enrollmentCount: c.enrolledStudents.length,
      assignmentCount: assignmentMap[c._id.toString()] ?? 0,
      quizCount: quizMap[c._id.toString()] ?? 0,
      liveClassCount: lcMap[c._id.toString()] ?? 0,
      createdAt: c.createdAt,
    })),
    recentActivity: recentSubmissions.map((s) => ({
      type: "submission",
      student: s.student ? { id: s.student._id, name: s.student.name } : null,
      assignmentTitle: s.assignment?.title,
      status: s.status,
      submittedAt: s.submittedAt,
    })),
    achievements: buildTeacherAchievements({
      courseCount: courses.length,
      totalStudents,
      gradedCount,
      totalAssignments: assignments.length,
      totalQuizzes: quizzes.length,
    }),
  };
}

// ─── Student profile ──────────────────────────────────────────────────────────
async function buildStudentProfile(user) {
  const enrolledCourses = await Course.find({ enrolledStudents: user._id })
    .populate("teacher", "name avatar")
    .sort({ createdAt: -1 });

  const courseIds = enrolledCourses.map((c) => c._id);

  const allAssignmentIds = await Assignment.find({ course: { $in: courseIds } }).distinct("_id");
  const allAssignments = await Assignment.find({ course: { $in: courseIds } }).sort({ order: 1 });

  const [mySubmissions, myQuizResults, enrollments, completedMaterials, totalMaterials] =
    await Promise.all([
      Submission.find({ student: user._id, assignment: { $in: allAssignmentIds } })
        .populate("assignment", "title maxScore order course")
        .sort({ submittedAt: -1 }),
      QuizResult.find({
        student: user._id,
        quiz: { $in: await Quiz.find({ course: { $in: courseIds } }).distinct("_id") },
      })
        .populate("quiz", "title course")
        .sort({ submittedAt: -1 }),
      Enrollment.find({ student: user._id, course: { $in: courseIds } }),
      CompletedMaterial.countDocuments({ student: user._id, course: { $in: courseIds } }),
      Material.countDocuments({ course: { $in: courseIds } }),
    ]);

  const submittedIds = new Set(mySubmissions.map((s) => s.assignment?._id?.toString()));
  const pendingAssignments = allAssignmentIds.filter(
    (id) => !submittedIds.has(id.toString())
  ).length;

  // Average quiz score
  const gradedSubs = mySubmissions.filter((s) => s.status === "graded" && s.score !== null);
  const avgAssignmentScore =
    gradedSubs.length > 0
      ? Math.round(
          gradedSubs.reduce(
            (acc, s) => acc + (s.score / (s.assignment?.maxScore || 100)) * 100,
            0
          ) / gradedSubs.length
        )
      : null;

  const avgQuizScore =
    myQuizResults.length > 0
      ? Math.round(
          myQuizResults.reduce((acc, r) => acc + (r.score / (r.totalPoints || 1)) * 100, 0) /
            myQuizResults.length
        )
      : null;

  // Build enrollment progress map
  const enrollmentMap = {};
  enrollments.forEach((e) => {
    enrollmentMap[e.course.toString()] = e.progress;
  });

  // Per-course assignment progress
  const assignmentsByCourse = {};
  allAssignments.forEach((a) => {
    const cid = a.course.toString();
    if (!assignmentsByCourse[cid]) assignmentsByCourse[cid] = { total: 0, submitted: 0 };
    assignmentsByCourse[cid].total++;
    if (submittedIds.has(a._id.toString())) assignmentsByCourse[cid].submitted++;
  });

  return {
    user: formatUser(user),
    stats: {
      coursesEnrolled: enrolledCourses.length,
      assignmentsSubmitted: mySubmissions.length,
      pendingAssignments,
      quizzesCompleted: myQuizResults.length,
      avgAssignmentScore,
      avgQuizScore,
      materialsCompleted: completedMaterials,
      totalMaterials,
    },
    courses: enrolledCourses.map((c) => ({
      id: c._id,
      title: c.title,
      description: c.description,
      subject: c.subject,
      teacher: c.teacher ? { id: c.teacher._id, name: c.teacher.name } : null,
      progress: enrollmentMap[c._id.toString()] ?? 0,
      assignmentProgress: assignmentsByCourse[c._id.toString()] || { total: 0, submitted: 0 },
      enrolledAt: enrollments.find((e) => e.course.toString() === c._id.toString())?.enrolledAt,
    })),
    recentSubmissions: mySubmissions.slice(0, 5).map((s) => ({
      id: s._id,
      assignmentTitle: s.assignment?.title,
      assignmentOrder: s.assignment?.order,
      status: s.status,
      score: s.score,
      maxScore: s.assignment?.maxScore,
      submittedAt: s.submittedAt,
    })),
    recentQuizzes: myQuizResults.slice(0, 5).map((r) => ({
      id: r._id,
      quizTitle: r.quiz?.title,
      score: r.score,
      totalPoints: r.totalPoints,
      submittedAt: r.submittedAt,
    })),
    submissionHistory: [...gradedSubs].reverse().map((s) => ({
      date: s.submittedAt,
      scorePercent: Math.round((s.score / (s.assignment?.maxScore || 100)) * 100),
      title: s.assignment?.title,
    })),
    quizHistory: [...myQuizResults].reverse().map((r) => ({
      date: r.submittedAt,
      scorePercent: Math.round((r.score / (r.totalPoints || 1)) * 100),
      title: r.quiz?.title,
    })),
    achievements: buildStudentAchievements({
      coursesEnrolled: enrolledCourses.length,
      assignmentsSubmitted: mySubmissions.length,
      quizzesCompleted: myQuizResults.length,
      avgAssignmentScore,
      avgQuizScore,
      pendingAssignments,
      gradedSubs: gradedSubs.length,
    }),
  };
}

// ─── Achievement builders ─────────────────────────────────────────────────────
function buildStudentAchievements({
  coursesEnrolled,
  assignmentsSubmitted,
  quizzesCompleted,
  avgAssignmentScore,
  avgQuizScore,
  gradedSubs,
}) {
  const all = [
    {
      id: "first_enroll",
      title: "First Step",
      description: "Enrolled in your first course",
      icon: "🎓",
      unlocked: coursesEnrolled >= 1,
    },
    {
      id: "multi_learner",
      title: "Multi-Learner",
      description: "Enrolled in 3 or more courses",
      icon: "📚",
      unlocked: coursesEnrolled >= 3,
    },
    {
      id: "first_submit",
      title: "First Submission",
      description: "Submitted your first assignment",
      icon: "📝",
      unlocked: assignmentsSubmitted >= 1,
    },
    {
      id: "dedicated",
      title: "Dedicated Student",
      description: "Submitted 5 assignments",
      icon: "💪",
      unlocked: assignmentsSubmitted >= 5,
    },
    {
      id: "prolific",
      title: "Prolific Learner",
      description: "Submitted 10 assignments",
      icon: "🏆",
      unlocked: assignmentsSubmitted >= 10,
    },
    {
      id: "quiz_taker",
      title: "Quiz Taker",
      description: "Completed your first quiz",
      icon: "🧠",
      unlocked: quizzesCompleted >= 1,
    },
    {
      id: "quiz_master",
      title: "Quiz Master",
      description: "Completed 5 quizzes",
      icon: "🎯",
      unlocked: quizzesCompleted >= 5,
    },
    {
      id: "high_scorer",
      title: "High Achiever",
      description: "Average assignment score above 80%",
      icon: "⭐",
      unlocked: avgAssignmentScore !== null && avgAssignmentScore >= 80,
    },
    {
      id: "perfect_quiz",
      title: "Quiz Ace",
      description: "Average quiz score above 90%",
      icon: "🌟",
      unlocked: avgQuizScore !== null && avgQuizScore >= 90,
    },
    {
      id: "graded_5",
      title: "Feedback Received",
      description: "Got 5 graded assignments",
      icon: "✅",
      unlocked: gradedSubs >= 5,
    },
  ];
  return all;
}

function buildTeacherAchievements({
  courseCount,
  totalStudents,
  gradedCount,
  totalAssignments,
  totalQuizzes,
}) {
  const all = [
    {
      id: "first_course",
      title: "Course Creator",
      description: "Created your first course",
      icon: "🎓",
      unlocked: courseCount >= 1,
    },
    {
      id: "multi_course",
      title: "Curriculum Builder",
      description: "Created 3 or more courses",
      icon: "📚",
      unlocked: courseCount >= 3,
    },
    {
      id: "first_student",
      title: "First Student",
      description: "Got your first enrolled student",
      icon: "👨‍🎓",
      unlocked: totalStudents >= 1,
    },
    {
      id: "class_10",
      title: "Growing Class",
      description: "10 or more students enrolled",
      icon: "👥",
      unlocked: totalStudents >= 10,
    },
    {
      id: "class_50",
      title: "Popular Teacher",
      description: "50 or more students enrolled",
      icon: "🌟",
      unlocked: totalStudents >= 50,
    },
    {
      id: "first_assignment",
      title: "Assignment Creator",
      description: "Created your first assignment",
      icon: "📋",
      unlocked: totalAssignments >= 1,
    },
    {
      id: "graded_first",
      title: "Feedback Giver",
      description: "Graded your first submission",
      icon: "✅",
      unlocked: gradedCount >= 1,
    },
    {
      id: "graded_20",
      title: "Dedicated Reviewer",
      description: "Graded 20 or more submissions",
      icon: "🏆",
      unlocked: gradedCount >= 20,
    },
    {
      id: "quiz_creator",
      title: "Quiz Maker",
      description: "Created your first quiz",
      icon: "🧠",
      unlocked: totalQuizzes >= 1,
    },
    {
      id: "full_curriculum",
      title: "Full Curriculum",
      description: "Created 5+ assignments and 3+ quizzes",
      icon: "🎯",
      unlocked: totalAssignments >= 5 && totalQuizzes >= 3,
    },
  ];
  return all;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    isVerified: u.isVerified,
    joinedAt: u.createdAt,
  };
}
