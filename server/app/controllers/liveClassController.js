import LiveClass from '../models/LiveClass.js';
import ClassComment from '../models/ClassComment.js';
import ClassQuestion from '../models/ClassQuestion.js';
import Course from '../models/Course.js';
import { getIO } from '../services/socketService.js';

// ─── POST /api/courses/:courseId/live-classes ─────────────────────────────────
export async function createLiveClass(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, scheduledAt, meetingLink, teacherId } = req.body;

    if (!title || !scheduledAt || !teacherId)
      return res.status(400).json({ error: 'title, scheduledAt, and teacherId are required.' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the course teacher can schedule live classes.' });

    const liveClass = await LiveClass.create({
      title,
      description,
      course: courseId,
      teacher: teacherId,
      scheduledAt: new Date(scheduledAt),
      meetingLink: meetingLink || '',
    });

    // Notify enrolled students via socket
    try {
      const io = getIO();
      course.enrolledStudents.forEach((studentId) => {
        io.to(`user:${studentId}`).emit('live-class-scheduled', {
          liveClassId: liveClass._id,
          title: liveClass.title,
          courseId,
          scheduledAt: liveClass.scheduledAt,
        });
      });
    } catch (_) {
      // socket not critical
    }

    res.status(201).json(formatLiveClass(liveClass));
  } catch (err) {
    console.error('createLiveClass error:', err);
    res.status(500).json({ error: 'Failed to schedule live class.' });
  }
}

// ─── GET /api/courses/:courseId/live-classes ──────────────────────────────────
export async function getCourseLiveClasses(req, res) {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const classes = await LiveClass.find({ course: courseId })
      .populate('teacher', 'name')
      .sort({ scheduledAt: -1 });

    res.json(classes.map(formatLiveClass));
  } catch (err) {
    console.error('getCourseLiveClasses error:', err);
    res.status(500).json({ error: 'Failed to fetch live classes.' });
  }
}

// ─── GET /api/live-classes/:id ────────────────────────────────────────────────
export async function getLiveClass(req, res) {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('course', 'title');
    if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });
    res.json(formatLiveClass(liveClass));
  } catch (err) {
    console.error('getLiveClass error:', err);
    res.status(500).json({ error: 'Failed to fetch live class.' });
  }
}

// ─── PATCH /api/live-classes/:id ──────────────────────────────────────────────
export async function updateLiveClass(req, res) {
  try {
    const { title, description, scheduledAt, meetingLink, recordingUrl, teacherId } = req.body;

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the class teacher can update it.' });

    if (title !== undefined) liveClass.title = title;
    if (description !== undefined) liveClass.description = description;
    if (scheduledAt !== undefined) liveClass.scheduledAt = new Date(scheduledAt);
    if (meetingLink !== undefined) liveClass.meetingLink = meetingLink;
    if (recordingUrl !== undefined) liveClass.recordingUrl = recordingUrl;
    await liveClass.save();

    res.json(formatLiveClass(liveClass));
  } catch (err) {
    console.error('updateLiveClass error:', err);
    res.status(500).json({ error: 'Failed to update live class.' });
  }
}

// ─── DELETE /api/live-classes/:id ─────────────────────────────────────────────
export async function deleteLiveClass(req, res) {
  try {
    const { teacherId } = req.body;

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the class teacher can delete it.' });

    await LiveClass.findByIdAndDelete(req.params.id);
    await Promise.all([
      ClassComment.deleteMany({ liveClass: req.params.id }),
      ClassQuestion.deleteMany({ liveClass: req.params.id }),
    ]);

    res.json({ message: 'Live class deleted.' });
  } catch (err) {
    console.error('deleteLiveClass error:', err);
    res.status(500).json({ error: 'Failed to delete live class.' });
  }
}

// ─── PATCH /api/live-classes/:id/status ──────────────────────────────────────
// Teacher starts or ends the live class
export async function updateLiveClassStatus(req, res) {
  try {
    const { status, teacherId } = req.body;

    if (!['scheduled', 'live', 'ended'].includes(status))
      return res.status(400).json({ error: 'status must be scheduled, live, or ended.' });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the class teacher can change its status.' });

    liveClass.status = status;
    await liveClass.save();

    // Broadcast status change to the course room
    try {
      const io = getIO();
      const course = await Course.findById(liveClass.course);
      course.enrolledStudents.forEach((studentId) => {
        io.to(`user:${studentId}`).emit('live-class-status', {
          liveClassId: liveClass._id,
          status,
        });
      });
    } catch (_) {}

    res.json(formatLiveClass(liveClass));
  } catch (err) {
    console.error('updateLiveClassStatus error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
}

// ─── POST /api/live-classes/:id/join ─────────────────────────────────────────
export async function joinLiveClass(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });

    const alreadyJoined = liveClass.attendees.some((a) => a.toString() === userId);
    if (!alreadyJoined) {
      liveClass.attendees.push(userId);
      await liveClass.save();
    }

    res.json({ message: 'Joined live class.', attendeeCount: liveClass.attendees.length });
  } catch (err) {
    console.error('joinLiveClass error:', err);
    res.status(500).json({ error: 'Failed to join live class.' });
  }
}

// ─── GET /api/live-classes/:id/comments ──────────────────────────────────────
export async function getComments(req, res) {
  try {
    const comments = await ClassComment.find({ liveClass: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(comments.map(formatComment));
  } catch (err) {
    console.error('getComments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
}

// ─── POST /api/live-classes/:id/comments ─────────────────────────────────────
export async function addComment(req, res) {
  try {
    const { userId, text } = req.body;
    if (!userId || !text)
      return res.status(400).json({ error: 'userId and text are required.' });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });

    const comment = await ClassComment.create({
      liveClass: req.params.id,
      user: userId,
      text,
    });

    await comment.populate('user', 'name avatar');

    // Broadcast to class participants via socket
    try {
      const io = getIO();
      io.to(`liveclass:${req.params.id}`).emit('new-comment', formatComment(comment));
    } catch (_) {}

    res.status(201).json(formatComment(comment));
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
}

// ─── GET /api/live-classes/:id/questions ─────────────────────────────────────
export async function getQuestions(req, res) {
  try {
    const questions = await ClassQuestion.find({ liveClass: req.params.id })
      .populate('student', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(questions.map(formatQuestion));
  } catch (err) {
    console.error('getQuestions error:', err);
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
}

// ─── POST /api/live-classes/:id/questions ────────────────────────────────────
export async function addQuestion(req, res) {
  try {
    const { studentId, question } = req.body;
    if (!studentId || !question)
      return res.status(400).json({ error: 'studentId and question are required.' });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });

    const classQuestion = await ClassQuestion.create({
      liveClass: req.params.id,
      student: studentId,
      question,
    });

    await classQuestion.populate('student', 'name avatar');

    try {
      const io = getIO();
      io.to(`liveclass:${req.params.id}`).emit('new-question', formatQuestion(classQuestion));
    } catch (_) {}

    res.status(201).json(formatQuestion(classQuestion));
  } catch (err) {
    console.error('addQuestion error:', err);
    res.status(500).json({ error: 'Failed to add question.' });
  }
}

// ─── PATCH /api/live-classes/:id/questions/:qId/answer ───────────────────────
export async function markAnswered(req, res) {
  try {
    const { qId } = req.params;
    const { teacherId } = req.body;

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the teacher can mark questions as answered.' });

    const classQuestion = await ClassQuestion.findByIdAndUpdate(
      qId,
      { isAnswered: true },
      { new: true }
    ).populate('student', 'name avatar');

    if (!classQuestion) return res.status(404).json({ error: 'Question not found.' });

    try {
      const io = getIO();
      io.to(`liveclass:${req.params.id}`).emit('question-answered', { questionId: qId });
    } catch (_) {}

    res.json(formatQuestion(classQuestion));
  } catch (err) {
    console.error('markAnswered error:', err);
    res.status(500).json({ error: 'Failed to mark question as answered.' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatLiveClass(lc) {
  return {
    id: lc._id,
    title: lc.title,
    description: lc.description,
    course: lc.course?._id || lc.course,
    teacher: lc.teacher
      ? { id: lc.teacher._id || lc.teacher, name: lc.teacher.name }
      : null,
    scheduledAt: lc.scheduledAt,
    status: lc.status,
    meetingLink: lc.meetingLink,
    recordingUrl: lc.recordingUrl,
    attendeeCount: lc.attendees?.length ?? 0,
    createdAt: lc.createdAt,
  };
}

function formatComment(c) {
  return {
    id: c._id,
    liveClass: c.liveClass,
    user: c.user
      ? { id: c.user._id || c.user, name: c.user.name, avatar: c.user.avatar }
      : null,
    text: c.text,
    createdAt: c.createdAt,
  };
}

function formatQuestion(q) {
  return {
    id: q._id,
    liveClass: q.liveClass,
    student: q.student
      ? { id: q.student._id || q.student, name: q.student.name, avatar: q.student.avatar }
      : null,
    question: q.question,
    isAnswered: q.isAnswered,
    createdAt: q.createdAt,
  };
}
