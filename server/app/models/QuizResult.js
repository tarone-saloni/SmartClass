import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: Number, required: true },
});

const quizResultSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// one result per student per quiz
quizResultSchema.index({ quiz: 1, student: 1 }, { unique: true });

export default mongoose.model('QuizResult', quizResultSchema);
