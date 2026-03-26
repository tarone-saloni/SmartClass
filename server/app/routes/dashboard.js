import { Router } from 'express';
import { getTeacherDashboard, getStudentDashboard } from '../controllers/dashboardController.js';

const router = Router();

router.get('/teachers/:id/dashboard', getTeacherDashboard);
router.get('/students/:id/dashboard', getStudentDashboard);

export default router;
