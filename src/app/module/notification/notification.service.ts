import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { INotificationInput } from "./notification.interface";
import type { IQuery } from "../../interfaces";

const createNotification = async (payload: INotificationInput) => {
	return await prisma.notification.create({
		data: payload,
	});
};

const getNotifications = async (userId: string, filters: IQuery) => {
	const { page = "1", limit = "10", isRead } = filters;
	const pageNum = Number(page);
	const limitNum = Number(limit);
	const skip = (pageNum - 1) * limitNum;

	const where: any = { userId };
	if (isRead !== undefined) where.isRead = isRead === "true";

	const [notifications, total] = await prisma.$transaction([
		prisma.notification.findMany({
			where,
			skip,
			take: limitNum,
			orderBy: { createdAt: "desc" },
		}),
		prisma.notification.count({ where }),
	]);

	return {
		data: notifications,
		meta: {
			total,
			page: pageNum,
			limit: limitNum,
			totalPages: Math.ceil(total / limitNum),
		},
	};
};

const markAsRead = async (notificationId: string, userId: string) => {
	const notification = await prisma.notification.findUnique({
		where: { id: notificationId },
	});

	if (!notification || notification.userId !== userId) {
		throw new AppError(httpStatus.FORBIDDEN, "Unauthorized or not found");
	}

	return await prisma.notification.update({
		where: { id: notificationId },
		data: { isRead: true },
	});
};

const markAllAsRead = async (userId: string) => {
	return await prisma.notification.updateMany({
		where: { userId, isRead: false },
		data: { isRead: true },
	});
};

export const NotificationServices = {
	createNotification,
	getNotifications,
	markAsRead,
	markAllAsRead,
};
