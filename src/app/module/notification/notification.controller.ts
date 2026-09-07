import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { AppError } from '../../utils/AppError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { NotificationServices } from './notification.service';

const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');

  const result = await NotificationServices.getNotifications(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const notificationId = req.params.id as string;
  const userId = req.user?.userId;
  
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');

  await NotificationServices.markAsRead(notificationId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification marked as read',
    data: null,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');

  await NotificationServices.markAllAsRead(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All notifications marked as read',
    data: null,
  });
});

export const NotificationController = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};