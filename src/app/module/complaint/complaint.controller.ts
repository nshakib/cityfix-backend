import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { ComplaintServices } from "./complaint.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createComplaint = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const userId = req.user?.userId;

    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const result = await ComplaintServices.createComplaint(payload, userId!);    

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Complaint created successfully",
        data: result,
    })
});

const getMyComplaints = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const result = await ComplaintServices.getMyComplaints(userId!);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Complaints retrieved successfully",
        data: result,
    });
});

const getSingleComplaint = catchAsync(async (req: Request, res: Response) => {
        const complaintId = req.params.id as string;
        
        const userId = req.user?.userId;
        if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

        const result = await ComplaintServices.getSingleComplaintById(complaintId,userId);
        
        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Complaint retrieved successfully",
            data: result,
        });
});
export const ComplaintController = {
    createComplaint,
    getMyComplaints,
    getSingleComplaint
};