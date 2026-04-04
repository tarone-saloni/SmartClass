import LiveClass from "../models/LiveClass.js";
import ClassComment from "../models/ClassComment.js";
import ClassQuestion from "../models/ClassQuestion.js";
import Course from "../models/Course.js";
import { getIO } from "../services/socketService.js";
import { pushNotification } from "../services/notificationService.js";

// ─── POST /api/courses/:courseId/live-classes ─────────────────────────────────
export async function createLiveClass(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, scheduledAt, meetingLink, teacherId, type } = req.body;

    if (!title || !scheduledAt || !teacherId)
      return res.status(400).json({ error: "title, scheduledAt, and teacherId are required." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can schedule live classes." });

    const classType = type === "platform" ? "platform" : "meetLink";

    const liveClass = await LiveClass.create({
      title,
      description,
      course: courseId,
      teacher: teacherId,
      scheduledAt: new Date(scheduledAt),
      type: classType,
      // meetingLink only relevant when type === 'meetLink'
      meetingLink: classType === "meetLink" ? meetingLink || "" : "",
    });

    // Notify enrolled students via socket + persist notification
    try {
      const io = getIO();
      course.enrolledStudents.forEach((studentId) => {
        // Keep live-class-scheduled for StudentDashboard reload
        io.to(`user:${studentId}`).emit("live-class-scheduled", {
          liveClassId: liveClass._id,
          title: liveClass.title,
          courseId,
          scheduledAt: liveClass.scheduledAt,
          type: liveClass.type,
        });
        // Persist + push notification:new
        pushNotification(
          studentId.toString(),
          `📹 Live class scheduled: "${liveClass.title}"`,
          "course"
        );
      });
    } catch {
      /* non-critical */
    }

    res.status(201).json(formatLiveClass(liveClass));
  } catch (err) {
    console.error("createLiveClass error:", err);
    res.status(500).json({ error: "Failed to schedule live class." });
  }
}

// ─── GET /api/courses/:courseId/live-classes ──────────────────────────────────
export async function getCourseLiveClasses(req, res) {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    const classes = await LiveClass.find({ course: courseId })
      .populate("teacher", "name")
      .sort({ scheduledAt: -1 });

    res.json(classes.map(formatLiveClass));
  } catch (err) {
    console.error("getCourseLiveClasses error:", err);
    res.status(500).json({ error: "Failed to fetch live classes." });
  }
}

// ─── GET /api/live-classes/:id ────────────────────────────────────────────────
export async function getLiveClass(req, res) {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate("teacher", "name email")
      .populate("course", "title");
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });
    res.json(formatLiveClass(liveClass));
  } catch (err) {
    console.error("getLiveClass error:", err);
    res.status(500).json({ error: "Failed to fetch live class." });
  }
}

// ─── PATCH /api/live-classes/:id ──────────────────────────────────────────────
export async function updateLiveClass(req, res) {
  try {
    const { title, description, scheduledAt, meetingLink, recordingUrl, teacherId, type } =
      req.body;

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the class teacher can update it." });

    if (title !== undefined) liveClass.title = title;
    if (description !== undefined) liveClass.description = description;
    if (scheduledAt !== undefined) liveClass.scheduledAt = new Date(scheduledAt);
    if (type !== undefined) liveClass.type = type;
    if (meetingLink !== undefined) liveClass.meetingLink = meetingLink;
    if (recordingUrl !== undefined) liveClass.recordingUrl = recordingUrl;
    await liveClass.save();

    res.json(formatLiveClass(liveClass));
  } catch (err) {
    console.error("updateLiveClass error:", err);
    res.status(500).json({ error: "Failed to update live class." });
  }
}

// ─── DELETE /api/live-classes/:id ─────────────────────────────────────────────
export async function deleteLiveClass(req, res) {
  try {
    const { teacherId } = req.body;

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the class teacher can delete it." });

    await LiveClass.findByIdAndDelete(req.params.id);
    await Promise.all([
      ClassComment.deleteMany({ liveClass: req.params.id }),
      ClassQuestion.deleteMany({ liveClass: req.params.id }),
    ]);

    res.json({ message: "Live class deleted." });
  } catch (err) {
    console.error("deleteLiveClass error:", err);
    res.status(500).json({ error: "Failed to delete live class." });
  }
}

// ─── PATCH /api/live-classes/:id/status ──────────────────────────────────────
// Teacher starts or ends the live class
export async function updateLiveClassStatus(req, res) {
  try {
    const { status, teacherId } = req.body;

    if (!["scheduled", "live", "ended"].includes(status))
      return res.status(400).json({ error: "status must be scheduled, live, or ended." });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the class teacher can change its status." });

    liveClass.status = status;
    await liveClass.save();

    // Broadcast status change to course students and the live class room
    try {
      const io = getIO();
      const course = await Course.findById(liveClass.course);

      // Notify all enrolled students (in their personal room)
      course.enrolledStudents.forEach((studentId) => {
        io.to(`user:${studentId}`).emit("live-class-status", {
          liveClassId: liveClass._id,
          title: liveClass.title,
          status,
          type: liveClass.type,
        });
        // Persist notification when class goes live
        if (status === "live") {
          pushNotification(
            studentId.toString(),
            `🔴 Live class started: "${liveClass.title}"`,
            "course"
          );
        }
      });

      // Also broadcast inside the live class room (for participants currently in it)
      io.to(`liveclass:${liveClass._id}`).emit("live-class-status", {
        liveClassId: liveClass._id,
        title: liveClass.title,
        status,
        type: liveClass.type,
      });
    } catch {
      /* non-critical */
    }

    res.json(formatLiveClass(liveClass));
  } catch (err) {
    console.error("updateLiveClassStatus error:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
}

// ─── POST /api/live-classes/:id/join ─────────────────────────────────────────
export async function joinLiveClass(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required." });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });

    const alreadyJoined = liveClass.attendees.some((a) => a.toString() === userId);
    if (!alreadyJoined) {
      liveClass.attendees.push(userId);
      await liveClass.save();

      // Let everyone in the class room know a new participant joined
      try {
        const io = getIO();
        io.to(`liveclass:${liveClass._id}`).emit("participant-joined", {
          liveClassId: liveClass._id,
          attendeeCount: liveClass.attendees.length,
        });
      } catch {
        /* non-critical */
      }
    }

    res.json({
      message: "Joined live class.",
      attendeeCount: liveClass.attendees.length,
      // For platform type, return the Jitsi room name the frontend should embed
      jitsiRoom: liveClass.type === "platform" ? `smartclass-${liveClass._id}` : null,
    });
  } catch (err) {
    console.error("joinLiveClass error:", err);
    res.status(500).json({ error: "Failed to join live class." });
  }
}

// ─── GET /api/live-classes/:id/comments ──────────────────────────────────────
// Returns ALL comments (top-level + replies) flat, sorted oldest→newest.
// Frontend can nest them using parentComment field.
export async function getComments(req, res) {
  try {
    const comments = await ClassComment.find({ liveClass: req.params.id })
      .populate("user", "name avatar")
      .sort({ createdAt: 1 });
    res.json(comments.map(formatComment));
  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ error: "Failed to fetch comments." });
  }
}

// ─── POST /api/live-classes/:id/comments ─────────────────────────────────────
// Also handles replies: pass parentComment (comment _id) in body.
export async function addComment(req, res) {
  try {
    const { userId, text, parentComment } = req.body;
    if (!userId || !text) return res.status(400).json({ error: "userId and text are required." });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });

    // Validate parent comment belongs to this live class
    if (parentComment) {
      const parent = await ClassComment.findById(parentComment);
      if (!parent || parent.liveClass.toString() !== req.params.id)
        return res.status(400).json({ error: "Invalid parent comment." });
    }

    const isTeacherReply = liveClass.teacher.toString() === userId;

    const comment = await ClassComment.create({
      liveClass: req.params.id,
      user: userId,
      text,
      parentComment: parentComment || null,
      isTeacherReply,
    });

    await comment.populate("user", "name avatar");

    const formatted = formatComment(comment);

    try {
      const io = getIO();

      if (parentComment) {
        // Reply: broadcast to the room
        io.to(`liveclass:${req.params.id}`).emit("new-reply", formatted);

        // If teacher replied, send a personal notification to the original commenter
        if (isTeacherReply) {
          const parentDoc = await ClassComment.findById(parentComment);
          if (parentDoc) {
            io.to(`user:${parentDoc.user}`).emit("teacher-replied", {
              reply: formatted,
              liveClassId: req.params.id,
              liveClassTitle: liveClass.title,
            });
          }
        }
      } else {
        // Top-level comment: broadcast to the room
        io.to(`liveclass:${req.params.id}`).emit("new-comment", formatted);

        // If a student commented, notify the teacher in real-time
        if (!isTeacherReply) {
          io.to(`user:${liveClass.teacher}`).emit("student-commented", {
            comment: formatted,
            liveClassId: req.params.id,
            liveClassTitle: liveClass.title,
          });
        }
      }
    } catch {
      /* non-critical */
    }

    res.status(201).json(formatted);
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ error: "Failed to add comment." });
  }
}

// ─── GET /api/live-classes/:id/questions ─────────────────────────────────────
export async function getQuestions(req, res) {
  try {
    const questions = await ClassQuestion.find({ liveClass: req.params.id })
      .populate("student", "name avatar")
      .sort({ createdAt: 1 });
    res.json(questions.map(formatQuestion));
  } catch (err) {
    console.error("getQuestions error:", err);
    res.status(500).json({ error: "Failed to fetch questions." });
  }
}

// ─── POST /api/live-classes/:id/questions ────────────────────────────────────
export async function addQuestion(req, res) {
  try {
    const { studentId, question } = req.body;
    if (!studentId || !question)
      return res.status(400).json({ error: "studentId and question are required." });

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });

    const classQuestion = await ClassQuestion.create({
      liveClass: req.params.id,
      student: studentId,
      question,
    });

    await classQuestion.populate("student", "name avatar");

    try {
      const io = getIO();
      // Broadcast to everyone in the class room
      io.to(`liveclass:${req.params.id}`).emit("new-question", formatQuestion(classQuestion));
      // Personally notify teacher
      io.to(`user:${liveClass.teacher}`).emit("student-question", {
        question: formatQuestion(classQuestion),
        liveClassId: req.params.id,
        liveClassTitle: liveClass.title,
      });
    } catch {
      /* non-critical */
    }

    res.status(201).json(formatQuestion(classQuestion));
  } catch (err) {
    console.error("addQuestion error:", err);
    res.status(500).json({ error: "Failed to add question." });
  }
}

// ─── PATCH /api/live-classes/:id/questions/:qId/answer ───────────────────────
export async function markAnswered(req, res) {
  try {
    const { qId } = req.params;
    const { teacherId } = req.body;

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the teacher can mark questions as answered." });

    const classQuestion = await ClassQuestion.findByIdAndUpdate(
      qId,
      { isAnswered: true },
      { new: true }
    ).populate("student", "name avatar");

    if (!classQuestion) return res.status(404).json({ error: "Question not found." });

    try {
      const io = getIO();
      io.to(`liveclass:${req.params.id}`).emit("question-answered", { questionId: qId });
      // Notify the student whose question was answered
      io.to(`user:${classQuestion.student._id}`).emit("your-question-answered", {
        questionId: qId,
        liveClassTitle: liveClass.title,
      });
    } catch {
      /* non-critical */
    }

    res.json(formatQuestion(classQuestion));
  } catch (err) {
    console.error("markAnswered error:", err);
    res.status(500).json({ error: "Failed to mark question as answered." });
  }
}

// ─── POST /api/live-classes/:id/recording ────────────────────────────────────
// Teacher uploads the recorded video blob (sent as multipart/form-data).
// The route handler attaches multer BEFORE calling this controller.
export async function uploadRecording(req, res) {
  try {
    const { teacherId } = req.body;

    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ error: "Live class not found." });

    if (liveClass.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the class teacher can upload a recording." });

    if (!req.file) return res.status(400).json({ error: "No recording file received." });

    // Build a publicly accessible URL (served via /uploads static route)
    const recordingUrl = `/uploads/recordings/${req.file.filename}`;
    liveClass.recordingUrl = recordingUrl;
    await liveClass.save();

    // Notify everyone in the class room that the recording is available
    try {
      const io = getIO();
      io.to(`liveclass:${liveClass._id}`).emit("recording-available", {
        liveClassId: liveClass._id,
        recordingUrl,
      });

      // Also notify each enrolled student personally
      const course = await Course.findById(liveClass.course);
      if (course) {
        course.enrolledStudents.forEach((studentId) => {
          io.to(`user:${studentId}`).emit("recording-available", {
            liveClassId: liveClass._id,
            title: liveClass.title,
            recordingUrl,
          });
        });
      }
    } catch {
      /* non-critical */
    }

    res.json({ message: "Recording uploaded.", recordingUrl });
  } catch (err) {
    console.error("uploadRecording error:", err);
    res.status(500).json({ error: "Failed to save recording." });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatLiveClass(lc) {
  return {
    id: lc._id,
    title: lc.title,
    description: lc.description,
    course: lc.course?._id || lc.course,
    teacher: lc.teacher ? { id: lc.teacher._id || lc.teacher, name: lc.teacher.name } : null,
    scheduledAt: lc.scheduledAt,
    status: lc.status,
    type: lc.type,
    meetingLink: lc.meetingLink,
    // For platform-type classes the frontend embeds Jitsi using this room name
    jitsiRoom: lc.type === "platform" ? `smartclass-${lc._id}` : null,
    recordingUrl: lc.recordingUrl,
    attendeeCount: lc.attendees?.length ?? 0,
    createdAt: lc.createdAt,
  };
}

function formatComment(c) {
  return {
    id: c._id,
    liveClass: c.liveClass,
    user: c.user ? { id: c.user._id || c.user, name: c.user.name, avatar: c.user.avatar } : null,
    text: c.text,
    parentComment: c.parentComment || null,
    isTeacherReply: c.isTeacherReply,
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
