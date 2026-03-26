import mongoose from 'mongoose';

const classQuestionSchema = new mongoose.Schema(
  {
    liveClass: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true, trim: true },
    isAnswered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('ClassQuestion', classQuestionSchema);
