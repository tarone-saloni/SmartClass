import { Router } from "express";
import {
  addMaterial,
  getCourseMaterials,
  updateMaterial,
  deleteMaterial,
  markComplete,
  unmarkComplete,
  getMaterialProgress,
  uploadMaterialFile,
} from "../controllers/materialController.js";
import materialUpload from "../middleware/materialUpload.js";

const router = Router({ mergeParams: true }); // inherits :courseId from parent

router.post("/upload", materialUpload.single("file"), uploadMaterialFile);
router.post("/", addMaterial);
router.get("/", getCourseMaterials);
router.get("/progress", getMaterialProgress); // ?studentId=
router.patch("/:materialId", updateMaterial);
router.delete("/:materialId", deleteMaterial);
router.post("/:materialId/complete", markComplete);
router.delete("/:materialId/complete", unmarkComplete);

export default router;
