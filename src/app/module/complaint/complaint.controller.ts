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

const getAllComplaints = catchAsync(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await ComplaintServices.getAllComplaints(filters);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Complaints retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
})

const resolveComplaint = catchAsync(async (req: Request, res: Response) => {
    const complaintId = req.params.id as string;
    const userId = req.user?.userId;

   
    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const { resolutionProof } = req.body;

    const result = await ComplaintServices.resolveComplaint(
        complaintId,
        userId,
        resolutionProof
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Complaint resolved successfully",
        data: result,
    });
});

const confirmComplaint = catchAsync(async (req: Request, res: Response) => {
    const complaintId = req.params.id as string;
    const userId = req.user?.userId;

   
    if (!userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const result = await ComplaintServices.confirmComplaint(complaintId, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Complaint confirmed successfully",
        data: result,
    });
});

const getAssignedComplaints = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

  const result = await ComplaintServices.getAssignedComplaints(userId, req.query);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assigned complaints retrieved",
    meta: result.meta,
    data: result.data,
  });
});

const startComplaint = catchAsync(async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const userId = req.user?.userId;
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

  const result = await ComplaintServices.startComplaint(complaintId, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Work started on complaint",
    data: result,
  });
});

const getDepartmentComplaints = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query;
  const departmentId = req.params.id as string;
  if (!departmentId) throw new AppError(httpStatus.FORBIDDEN, "Admin must belong to a department");

  const result = await ComplaintServices.getDepartmentComplaints(departmentId, filters);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Department complaints retrieved",
    meta: result.meta,
    data: result.data,
  });
});

const updatePriority = catchAsync(async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const userId = req.user?.userId;
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

  const result = await ComplaintServices.updatePriority(complaintId, userId, req.body.priority);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Priority updated successfully",
    data: result,
  });
});

const moveToReview = catchAsync(async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const userId = req.user?.userId;
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

  const result = await ComplaintServices.moveToReview(complaintId, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Complaint moved to review",
    data: result,
  });
});

const assignComplaint = catchAsync(async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const userId = req.user?.userId;
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

  const result = await ComplaintServices.assignComplaint(complaintId, userId, req.body.staffId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Complaint assigned successfully",
    data: result,
  });
});
export const ComplaintController = {
    createComplaint,
    getMyComplaints,
    getSingleComplaint,
    getAllComplaints,
    resolveComplaint,
    confirmComplaint,
    getAssignedComplaints,
    startComplaint,
    getDepartmentComplaints,
    updatePriority,
    moveToReview,
    assignComplaint

};