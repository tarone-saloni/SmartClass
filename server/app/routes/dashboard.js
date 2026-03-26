import { Router } from 'express';
import { getTeacherDashboard, getStudentDashboard } from '../controllers/courseController.js';

const router = Router();

router.get('/teachers/:id/dashboard', getTeacherDashboard);
router.get('/students/:id/dashboard', getStudentDashboard);

export default router;
