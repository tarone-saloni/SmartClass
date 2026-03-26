import Material from '../models/Material.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// ─── POST /api/courses/:courseId/materials ────────────────────────────────────
export async function addMaterial(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, type, fileUrl, teacherId } = req.body;

    if (!title || !teacherId)
      return res.status(400).json({ error: 'title and teacherId are required.' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the course teacher can add materials.' });

    const material = await Material.create({
      title,
      description,
      type: type || 'other',
      fileUrl: fileUrl || '',
      course: courseId,
      uploadedBy: teacherId,
    });

    res.status(201).json(formatMaterial(material));
  } catch (err) {
    console.error('addMaterial error:', err);
    res.status(500).json({ error: 'Failed to add material.' });
  }
}

// ─── GET /api/courses/:courseId/materials ─────────────────────────────────────
export async function getCourseMaterials(req, res) {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const materials = await Material.find({ course: courseId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(materials.map(formatMaterial));
  } catch (err) {
    console.error('getCourseMaterials error:', err);
    res.status(500).json({ error: 'Failed to fetch materials.' });
  }
}

// ─── PATCH /api/courses/:courseId/materials/:materialId ───────────────────────
export async function updateMaterial(req, res) {
  try {
    const { courseId, materialId } = req.params;
    const { title, description, type, fileUrl, teacherId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the course teacher can update materials.' });

    const material = await Material.findOne({ _id: materialId, course: courseId });
    if (!material) return res.status(404).json({ error: 'Material not found.' });

    if (title !== undefined) material.title = title;
    if (description !== undefined) material.description = description;
    if (type !== undefined) material.type = type;
    if (fileUrl !== undefined) material.fileUrl = fileUrl;
    await material.save();

    res.json(formatMaterial(material));
  } catch (err) {
    console.error('updateMaterial error:', err);
    res.status(500).json({ error: 'Failed to update material.' });
  }
}

// ─── DELETE /api/courses/:courseId/materials/:materialId ──────────────────────
export async function deleteMaterial(req, res) {
  try {
    const { courseId, materialId } = req.params;
    const { teacherId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    if (course.teacher.toString() !== teacherId)
      return res.status(403).json({ error: 'Only the course teacher can delete materials.' });

    const material = await Material.findOneAndDelete({ _id: materialId, course: courseId });
    if (!material) return res.status(404).json({ error: 'Material not found.' });

    res.json({ message: 'Material deleted.' });
  } catch (err) {
    console.error('deleteMaterial error:', err);
    res.status(500).json({ error: 'Failed to delete material.' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
