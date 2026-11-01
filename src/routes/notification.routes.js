import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', validate({ params: idParam }), markNotificationRead);
router.delete('/:id', validate({ params: idParam }), deleteNotification);

export default router;
