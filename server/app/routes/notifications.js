import { Router } from 'express';
import { getNotifications, markAllRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/:userId', getNotifications);
router.patch('/read-all/:userId', markAllRead);

export default router;
