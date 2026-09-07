import type { Request, Response } from "express";
import httpStatus from "http-status";

import { FineServices } from "./find.service";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";

const createFine = catchAsync(async (req: Request, res: Response) => {
	const staffId = req.user?.userId;
	const departmentId = req.params.departmentId as string;

	if (!staffId || !departmentId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Staff must be assigned to a department",
		);
	}

	const result = await FineServices.createFine(req.body, staffId, departmentId);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Fine issued successfully",
		data: result,
	});
});

const getAllFines = catchAsync(async (req: Request, res: Response) => {
	const result = await FineServices.getAllFines(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Fines retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const getMyFines = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

	const result = await FineServices.getMyFines(userId, req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My fines retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const getSingleFine = catchAsync(async (req: Request, res: Response) => {
	const fineId = req.params.id as string;
	const userId = req.user?.userId;
	const userRole = req.user?.role as string;

	if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

	const result = await FineServices.getSingleFineById(fineId, userId, userRole);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Fine retrieved successfully",
		data: result,
	});
});

const disputeFine = catchAsync(async (req: Request, res: Response) => {
	const fineId = req.params.id as string;
	const userId = req.user?.userId;
	if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

	const result = await FineServices.disputeFine(fineId, userId, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Fine disputed successfully",
		data: result,
	});
});

const upholdDispute = catchAsync(async (req: Request, res: Response) => {
	const fineId = req.params.id as string;
	const adminId = req.user?.userId;
	if (!adminId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

	const result = await FineServices.upholdDispute(
		fineId,
		adminId,
		req.body.note,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Dispute upheld. Fine remains active.",
		data: result,
	});
});

const waiveFine = catchAsync(async (req: Request, res: Response) => {
	const fineId = req.params.id as string;
	const adminId = req.user?.userId;
	if (!adminId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

	const result = await FineServices.waiveFine(fineId, adminId, req.body.note);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Fine waived successfully",
		data: result,
	});
});

const voidFine = catchAsync(async (req: Request, res: Response) => {
	const fineId = req.params.id as string;
	const adminId = req.user?.userId;
	if (!adminId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

	const result = await FineServices.voidFine(fineId, adminId, req.body.note);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Fine voided successfully",
		data: result,
	});
});

export const FineController = {
	createFine,
	getAllFines,
	getMyFines,
	getSingleFine,
	disputeFine,
	upholdDispute,
	waiveFine,
	voidFine,
};
