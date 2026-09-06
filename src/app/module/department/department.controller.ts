import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { DepartmentServices } from "./department.service";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const result = await DepartmentServices.createDepartment({...payload, userId});
    
    sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message:
			"Create department successfully",
		data: result,
	});

});

const getSingleDepartment = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const result = await DepartmentServices.getSingleDepartment(userId);
    
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Department retrieved successfully",
        data: result,
    });
});
const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const result = await DepartmentServices.getAllDepartments();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Departments retrieved successfully",
        data: result,
    });
});
const updateDepartment = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const result = await DepartmentServices.updateDepartment(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Department updated successfully",
        data: result,
    });
});
const updateDepartmentStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const result = await DepartmentServices.updateDepartmentStatus(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Department status updated successfully",
        data: result,
    });
});

export const departmentController = {
    createDepartment,
    getSingleDepartment,
    getAllDepartments,
    updateDepartment,
    updateDepartmentStatus,
};