import { Router } from 'express';
import {
  createLiveClass,
  getCourseLiveClasses,
  getLiveClass,
  updateLiveClass,
  deleteLiveClass,
  updateLiveClassStatus,
  joinLiveClass,
  getComments,
  addComment,
  getQuestions,
  addQuestion,
  markAnswered,
} from '../controllers/liveClassController.js';

// Course-scoped live class routes (mergeParams inherits :courseId)
export const courseLiveClassRouter = Router({ mergeParams: true });
courseLiveClassRouter.post('/', createLiveClass);
courseLiveClassRouter.get('/', getCourseLiveClasses);

// Standalone live class routes
const router = Router();
router.get('/:id', getLiveClass);
router.patch('/:id', updateLiveClass);
router.delete('/:id', deleteLiveClass);
router.patch('/:id/status', updateLiveClassStatus);
router.post('/:id/join', joinLiveClass);
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.get('/:id/questions', getQuestions);
router.post('/:id/questions', addQuestion);
router.patch('/:id/questions/:qId/answer', markAnswered);

export default router;
