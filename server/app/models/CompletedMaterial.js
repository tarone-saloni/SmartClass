import mongoose from 'mongoose';

const completedMaterialSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One record per student per material
completedMaterialSchema.index({ student: 1, material: 1 }, { unique: true });

export default mongoose.model('CompletedMaterial', completedMaterialSchema);
