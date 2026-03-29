import mongoose from 'mongoose';

const classCommentSchema = new mongoose.Schema(
  {
    liveClass: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    // null = top-level comment; ObjectId = reply to that comment
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassComment', default: null },
    // true when the teacher of the class wrote this comment/reply
    isTeacherReply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('ClassComment', classCommentSchema);
