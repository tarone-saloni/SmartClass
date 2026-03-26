import { Router } from 'express';
import {
  createAssignment,
  getCourseAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  getMySubmission,
  gradeSubmission,
} from '../controllers/assignmentController.js';

// Course-scoped assignment routes (mergeParams inherits :courseId)
export const courseAssignmentRouter = Router({ mergeParams: true });
courseAssignmentRouter.post('/', createAssignment);
courseAssignmentRouter.get('/', getCourseAssignments);

// Standalone assignment routes
const router = Router();
router.get('/:id', getAssignment);
router.patch('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/submit', submitAssignment);
router.get('/:id/submissions', getSubmissions);
router.get('/:id/my-submission', getMySubmission);
router.patch('/submissions/:submissionId/grade', gradeSubmission);

export default router;
