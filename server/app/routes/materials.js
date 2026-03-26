import { Router } from 'express';
import {
  addMaterial,
  getCourseMaterials,
  updateMaterial,
  deleteMaterial,
} from '../controllers/materialController.js';

const router = Router({ mergeParams: true }); // inherits :courseId from parent

router.post('/', addMaterial);
router.get('/', getCourseMaterials);
router.patch('/:materialId', updateMaterial);
router.delete('/:materialId', deleteMaterial);

export default router;
