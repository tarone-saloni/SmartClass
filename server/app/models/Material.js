import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["document", "video", "link", "image", "other"],
      default: "other",
    },
    fileUrl: { type: String, trim: true, default: "" },
    cloudinaryPublicId: { type: String, default: "" }, // set when uploaded via Cloudinary
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Number, default: 0 }, // for sequencing within a course
  },
  { timestamps: true }
);

export default mongoose.model("Material", materialSchema);
