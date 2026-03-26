import { Router } from 'express';
import {
  createQuiz,
  getCourseQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getQuizResults,
  getMyResult,
} from '../controllers/quizController.js';

// Course-scoped quiz routes (mergeParams inherits :courseId)
export const courseQuizRouter = Router({ mergeParams: true });
courseQuizRouter.post('/', createQuiz);
courseQuizRouter.get('/', getCourseQuizzes);

// Standalone quiz routes
const router = Router();
router.get('/:id', getQuiz);
router.patch('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);
router.post('/:id/submit', submitQuiz);
router.get('/:id/results', getQuizResults);
router.get('/:id/my-result', getMyResult);

export default router;
