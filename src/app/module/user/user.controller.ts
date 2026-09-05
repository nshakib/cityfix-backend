import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new AppError(httpStatus.BAD_REQUEST, "No File Provided.");
	}

	const userId = req.user?.userId;

	const result = await UserServices.uploadProfileImage(
		req.file?.buffer,
		userId!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: result,
	});
});

const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const payload = req.body;

	const result = await UserServices.updateUserProfile(payload, userId!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile updated successfully",
		data: result,
	});
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const payload = req.body;

	const result = await UserServices.changePassword(userId!, payload);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Password changed successfully",
		data: result,
	});
});

export const UserController = {
	uploadProfileImage,
	updateUserProfile,
	changePassword,
};
