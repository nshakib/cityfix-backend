import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { ComplaintServices } from "./complaint.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ComplaintStatus, type Role } from "../../../generated/prisma/enums";

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
	});
});

const acknowledgeComplaint = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role as Role;
  const complaintId = req.params.id as string;
  const note = req.body?.note;

  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

  const result = await ComplaintServices.acknowledgeComplaint(complaintId, role, note, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Complaint acknowledged successfully",
    data: result,
  });
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

	const result = await ComplaintServices.getSingleComplaintById(
		complaintId,
		userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Complaint retrieved successfully",
		data: result,
	});
});

const getAllComplaints = catchAsync(async (req: Request, res: Response) => {
	
	const filters = req.query;
	const departmentId = req.params.departmentId as string;


	const result = await ComplaintServices.getAllComplaints(filters, departmentId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Complaints retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const resolveComplaint = catchAsync(async (req: Request, res: Response) => {
    const complaintId = req.params.id as string;
    const user = req.user;

    if (!user) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Authentication required"
        );
    }

    const { resolutionProof } = req.body;

    const result = await ComplaintServices.resolveComplaint(
        complaintId,
        user,
        { resolutionProof }
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

const getAssignedComplaints = catchAsync( async (req: Request, res: Response) => {

		const query = req.query;
		const role = req.user?.role;
		const userId = req.user?.userId as string;
		const departmentId = req.params.departmentId as string;
		if (!role) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

		const result = await ComplaintServices.getAssignedComplaints(role, query, userId, departmentId);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Assigned complaints retrieved",
			meta: result.meta,
			data: result.data,
		});
	},
);

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

const getDepartmentComplaints = catchAsync(
	async (req: Request, res: Response) => {
		const filters = req.query;
		const departmentId = req.params.id as string;
		if (!departmentId)
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Admin must belong to a department",
			);

		const result = await ComplaintServices.getDepartmentComplaints(
			departmentId,
			filters,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Department complaints retrieved",
			meta: result.meta,
			data: result.data,
		});
	},
);

const updatePriority = catchAsync(async (req: Request, res: Response) => {
	const complaintId = req.params.id as string;
	const userId = req.user?.userId;
	if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");

	const result = await ComplaintServices.updatePriority(
		complaintId,
		userId,
		req.body.priority,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Priority updated successfully",
		data: result,
	});
});

const moveToReview = async (complaintId: string, adminId: string) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	if (complaint.status !== ComplaintStatus.SUBMITTED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Cannot acknowledge: complaint is currently '${complaint.status}', expected SUBMITTED`,
		);
	}

	const oldStatus = complaint.status;

	return await prisma.$transaction(async (tx) => {
		const updated = await tx.complaint.update({
			where: { id: complaintId },
			data: { status: ComplaintStatus.ACKNOWLEDGED },
		});

		await tx.complaintStatusLog.create({
			data: {
				complaintId,
				oldStatus,
				newStatus: ComplaintStatus.ACKNOWLEDGED,
				performedBy: adminId,
				note: "Complaint acknowledged by admin",
			},
		});
		return updated;
	});
};

const reopenDisputedComplaint = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId;
		const performerRole = req.user?.role as Role;
		const complaintId = req.params.id as string;

		if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");
		if (!complaintId)
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"A valid Complaint id is required",
			);

		const result = await ComplaintServices.reopenDisputedComplaint(
			complaintId,
			userId,
			performerRole,
		);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Dispute reopened",
			data: result,
		});
	},
);

const disputeComplaint = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const complaintId = req.params.id as string;
	const { reason } = req.body;
	if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");
	if (!complaintId)
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"A valid Complaint id is required",
		);
	const result = await ComplaintServices.disputeComplaint(
		complaintId,
		userId,
		reason,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Complaint disputed successfully",
		data: result,
	});
});

const assignComplaint = catchAsync(async (req: Request, res: Response) => {
	const assignComplaintId = req.params.id as string;
	const { staffId } = req.body;
	const adminId = req.user?.userId as string;

	const result = await ComplaintServices.assignComplaint(
		assignComplaintId,
		adminId,
		staffId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Complaint assigned successfully",
		data: result,
	});
});

const rejectComplaint = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Auth required");
  
  const rejectComplaintId = req.params.id as string;
  const { reason } = req.body;

  const result = await ComplaintServices.rejectComplaint(rejectComplaintId, req.user, reason);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Complaint rejected successfully",
    data: result,
  });
});
export const ComplaintController = {
	createComplaint,
	acknowledgeComplaint,
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
	assignComplaint,
	disputeComplaint,
	reopenDisputedComplaint,
  	rejectComplaint
};
