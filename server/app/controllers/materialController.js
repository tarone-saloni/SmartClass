import Material from "../models/Material.js";
import Course from "../models/Course.js";
import CompletedMaterial from "../models/CompletedMaterial.js";
import Enrollment from "../models/Enrollment.js";
import { uploadToCloudinary, getResourceType } from "../utils/cloudinary.js";
import { emitToCourse, emitToUser } from "../services/socketService.js";

// ─── POST /api/courses/:courseId/materials/upload ────────────────────────────
export async function uploadMaterialFile(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, type, teacherId } = req.body;

    if (!title || !teacherId)
      return res.status(400).json({ error: "title and teacherId are required." });

    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can add materials." });

    // Upload buffer to Cloudinary
    const resourceType = getResourceType(req.file.mimetype);
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: "smartclass/materials",
      resource_type: resourceType,
      use_filename: false,
    });

    const material = await Material.create({
      title,
      description,
      type: type || "other",
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      course: courseId,
      uploadedBy: teacherId,
    });

    const formatted = formatMaterial(material);
    emitToCourse(courseId, "material:new", formatted);
    res.status(201).json(formatted);
  } catch (err) {
    console.error("uploadMaterialFile error:", err);
    res.status(500).json({ error: "Failed to upload material." });
  }
}

// ─── POST /api/courses/:courseId/materials ────────────────────────────────────
export async function addMaterial(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, type, fileUrl, teacherId } = req.body;

    if (!title || !teacherId)
      return res.status(400).json({ error: "title and teacherId are required." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can add materials." });

    const material = await Material.create({
      title,
      description,
      type: type || "other",
      fileUrl: fileUrl || "",
      course: courseId,
      uploadedBy: teacherId,
    });

    const formatted = formatMaterial(material);
    emitToCourse(courseId, "material:new", formatted);
    res.status(201).json(formatted);
  } catch (err) {
    console.error("addMaterial error:", err);
    res.status(500).json({ error: "Failed to add material." });
  }
}

// ─── GET /api/courses/:courseId/materials ─────────────────────────────────────
export async function getCourseMaterials(req, res) {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    const materials = await Material.find({ course: courseId })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });

    res.json(materials.map(formatMaterial));
  } catch (err) {
    console.error("getCourseMaterials error:", err);
    res.status(500).json({ error: "Failed to fetch materials." });
  }
}

// ─── PATCH /api/courses/:courseId/materials/:materialId ───────────────────────
export async function updateMaterial(req, res) {
  try {
    const { courseId, materialId } = req.params;
    const { title, description, type, fileUrl, teacherId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can update materials." });

    const material = await Material.findOne({ _id: materialId, course: courseId });
    if (!material) return res.status(404).json({ error: "Material not found." });

    if (title !== undefined) material.title = title;
    if (description !== undefined) material.description = description;
    if (type !== undefined) material.type = type;
    if (fileUrl !== undefined) material.fileUrl = fileUrl;
    await material.save();

    const formatted = formatMaterial(material);
    emitToCourse(courseId, "material:updated", formatted);
    res.json(formatted);
  } catch (err) {
    console.error("updateMaterial error:", err);
    res.status(500).json({ error: "Failed to update material." });
  }
}

// ─── DELETE /api/courses/:courseId/materials/:materialId ──────────────────────
export async function deleteMaterial(req, res) {
  try {
    const { courseId, materialId } = req.params;
    const { teacherId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: "Only the course teacher can delete materials." });

    const material = await Material.findOneAndDelete({ _id: materialId, course: courseId });
    if (!material) return res.status(404).json({ error: "Material not found." });

    // Delete from Cloudinary if uploaded
    if (material.cloudinaryPublicId) {
      const { default: cloudinary } = await import("../utils/cloudinary.js");
      cloudinary.uploader
        .destroy(material.cloudinaryPublicId, { invalidate: true })
        .catch((err) => console.warn("Could not delete Cloudinary file:", err.message));
    }

    emitToCourse(courseId, "material:deleted", { id: materialId, courseId });
    res.json({ message: "Material deleted." });
  } catch (err) {
    console.error("deleteMaterial error:", err);
    res.status(500).json({ error: "Failed to delete material." });
  }
}

// ─── POST /api/courses/:courseId/materials/:materialId/complete ───────────────
export async function markComplete(req, res) {
  try {
    const { courseId, materialId } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId is required." });

    const material = await Material.findOne({ _id: materialId, course: courseId });
    if (!material) return res.status(404).json({ error: "Material not found." });

    await CompletedMaterial.findOneAndUpdate(
      { student: studentId, material: materialId },
      { student: studentId, material: materialId, course: courseId, completedAt: new Date() },
      { upsert: true }
    );

    // Recalculate and sync enrollment progress
    await syncProgress(studentId, courseId);

    res.json({ message: "Material marked as completed." });
  } catch (err) {
    console.error("markComplete error:", err);
    res.status(500).json({ error: "Failed to mark material as completed." });
  }
}

// ─── DELETE /api/courses/:courseId/materials/:materialId/complete ─────────────
export async function unmarkComplete(req, res) {
  try {
    const { courseId, materialId } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId is required." });

    await CompletedMaterial.findOneAndDelete({ student: studentId, material: materialId });
    await syncProgress(studentId, courseId);

    res.json({ message: "Material marked as incomplete." });
  } catch (err) {
    console.error("unmarkComplete error:", err);
    res.status(500).json({ error: "Failed to unmark material." });
  }
}

// ─── GET /api/courses/:courseId/materials/progress?studentId= ────────────────
// Returns all materials with completion status for a given student
export async function getMaterialProgress(req, res) {
  try {
    const { courseId } = req.params;
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ error: "studentId is required." });

    const [materials, completed] = await Promise.all([
      Material.find({ course: courseId }).sort({ order: 1, createdAt: 1 }),
      CompletedMaterial.find({ student: studentId, course: courseId }).select("material"),
    ]);

    const completedSet = new Set(completed.map((c) => c.material.toString()));

    res.json({
      courseId,
      studentId,
      total: materials.length,
      completedCount: completedSet.size,
      progress: materials.length > 0 ? Math.round((completedSet.size / materials.length) * 100) : 0,
      materials: materials.map((m) => ({
        ...formatMaterial(m),
        isCompleted: completedSet.has(m._id.toString()),
      })),
    });
  } catch (err) {
    console.error("getMaterialProgress error:", err);
    res.status(500).json({ error: "Failed to fetch progress." });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function syncProgress(studentId, courseId) {
  try {
    const [total, completed] = await Promise.all([
      Material.countDocuments({ course: courseId }),
      CompletedMaterial.countDocuments({ student: studentId, course: courseId }),
    ]);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const update = { progress };
    if (progress === 100) {
      update.status = "completed";
      update.completedAt = new Date();
    } else {
      update.status = "active";
      update.completedAt = null;
    }
    await Enrollment.findOneAndUpdate({ student: studentId, course: courseId }, update);

    // Push live progress update to the student
    emitToUser(studentId, "material:progress", {
      courseId: courseId.toString(),
      progress,
      completedCount: completed,
      total,
    });
  } catch {
    // non-critical — don't fail the request
  }
}

function formatMaterial(m) {
  return {
    id: m._id,
    title: m.title,
    description: m.description,
    type: m.type,
    fileUrl: m.fileUrl,
    course: m.course,
    uploadedBy: m.uploadedBy
      ? { id: m.uploadedBy._id || m.uploadedBy, name: m.uploadedBy.name }
      : null,
    createdAt: m.createdAt,
  };
}
