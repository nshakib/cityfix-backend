import express from 'express';
import { validateRequest } from '../../middleware/validateRequest';
import { auth } from '../../middleware/checkAuth';
import { notificationIdSchema } from './notification.validation';
import { NotificationController } from './notification.controller';
import { Role } from '../../../generated/prisma/enums';



const router = express.Router();

// List notifications for the current user
router.get(
  '/',
  auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
  NotificationController.getNotifications
);

// Mark a single notification as read
router.patch(
  '/:id/read',
  auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
  validateRequest(notificationIdSchema),
  NotificationController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/read-all',
  auth(Role.CITIZEN, Role.STAFF, Role.ADMIN),
  NotificationController.markAllAsRead
);

export const NotificationRoutes = router;