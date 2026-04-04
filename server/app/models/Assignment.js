import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    dueDate: { type: Date },
    maxScore: { type: Number, default: 100 },
    order: { type: Number, default: 0 }, // sequential order within a course (1-based)
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
