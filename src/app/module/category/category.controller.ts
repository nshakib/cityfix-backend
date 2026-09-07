import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CategoryServices } from "./category.service";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";

const createCategory = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const userId = req.user?.userId;

	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
	}

	const result = await CategoryServices.createCategory(payload, userId);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Create category successfully",
		data: result,
	});
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const result = await CategoryServices.getSingleCategory(userId!);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Category retrieved successfully",
		data: result,
	});
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
	const result = await CategoryServices.getAllCategories();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Categories retrieved successfully",
		data: result,
	});
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const userId = req.user?.userId;

	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
	}

	const result = await CategoryServices.updateCategory(payload, userId!);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Category updated successfully",
		data: result,
	});
});
const updateCategoryStatus = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const userId = req.user?.userId;

	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
	}

	const result = await CategoryServices.updateCategoryStatus(payload, userId!);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Category status updated successfully",
		data: result,
	});
});
export const CategoryController = {
	createCategory,
	getSingleCategory,
	getAllCategories,
	updateCategory,
	updateCategoryStatus,
};
