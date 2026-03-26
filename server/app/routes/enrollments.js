import { Router } from 'express';
import {
  enroll,
  unenroll,
  getMyEnrollments,
  getCourseEnrollments,
  getCourseProgress,
} from '../controllers/enrollmentController.js';

const router = Router();

router.post('/', enroll);
router.delete('/', unenroll);
router.get('/my-courses', getMyEnrollments);         // ?studentId=
router.get('/course/:courseId', getCourseEnrollments); // ?teacherId=
router.get('/progress', getCourseProgress);            // ?studentId=&courseId=

export default router;
