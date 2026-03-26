import { Router } from 'express';
import {
  addMaterial,
  getCourseMaterials,
  updateMaterial,
  deleteMaterial,
  markComplete,
  unmarkComplete,
  getMaterialProgress,
} from '../controllers/materialController.js';

const router = Router({ mergeParams: true }); // inherits :courseId from parent

router.post('/', addMaterial);
router.get('/', getCourseMaterials);
router.get('/progress', getMaterialProgress);             // ?studentId=
router.patch('/:materialId', updateMaterial);
router.delete('/:materialId', deleteMaterial);
router.post('/:materialId/complete', markComplete);
router.delete('/:materialId/complete', unmarkComplete);

export default router;
