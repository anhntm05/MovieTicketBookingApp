import express from 'express';
import NotificationController from '../controllers/NotificationController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/me', authenticate, NotificationController.getUserNotifications);
router.patch('/read-all', authenticate, NotificationController.markAllAsRead);
router.patch('/:id/read', authenticate, NotificationController.markAsRead);

export default router;
