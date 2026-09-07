import {
	ComplaintPriority,
	ComplaintStatus,
	Role,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateComplaint, IResolveComplaint } from "./complaint.interface";
import httpStatus from "http-status";

const createComplaint = async (payload: ICreateComplaint, userId: string) => {
	const { title, description, location, photos, categoryId } = payload;

	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: { departmentId: true, name: true },
	});

	
	if (!category) {
		throw new AppError(httpStatus.NOT_FOUND, "Invalid category selected");
	}
	const result = await prisma.complaint.create({
		data: {
			title,
			description,
			location,
			photos: photos || [],
			categoryId,
			departmentId: category.departmentId,
			citizenId: userId,
			status: ComplaintStatus.SUBMITTED,
			priority: ComplaintPriority.MEDIUM,
		},
	});
	

	return result;
};

const getMyComplaints = async (userId: string) => {
	const complaints = await prisma.complaint.findMany({
		where: {
			citizenId: userId,
		},
		include: {
			category: { select: { name: true } },
			department: { select: { name: true } },
			assignedStaff: { select: { name: true, phone: true } },
		},
		orderBy: {
			submittedAt: "desc",
		},
	});

	return complaints;
};

const getSingleComplaintById = async (complaintId: string, userId: string) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
		include: {
			category: true,
			department: true,
			assignedStaff: { select: { name: true, phone: true } },
		},
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	if (complaint.citizenId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not authorized to view this complaint",
		);
	}

	return complaint;
};

const getAllComplaints = async (filters: {
	status?: string;
	priority?: string;
	departmentId?: string;
	page?: number;
	limit?: number;
}) => {
	const { status, priority, departmentId, page = 1, limit = 10 } = filters;
	const skip = (page - 1) * limit;

	const where: any = {};
	if (status) where.status = status;
	if (priority) where.priority = priority;
	if (departmentId) where.departmentId = departmentId;

	const [complaints, total] = await prisma.$transaction([
		prisma.complaint.findMany({
			where,
			skip,
			take: limit,
			orderBy: { submittedAt: "desc" },
			include: {
				category: { select: { name: true } },
				department: { select: { name: true } },
				assignedStaff: { select: { name: true, phone: true } },
				citizen: { select: { name: true, phone: true } }, // Admins need to contact citizens
			},
		}),
		prisma.complaint.count({ where }),
	]);

	return {
		data: complaints,
		meta: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const resolveComplaint = async (
	complaintId: string,
	staffId: string,
	payload: IResolveComplaint,
) => {
	const { resolutionProof } = payload;

	// 1. Check if complaint exists
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
		select: { status: true },
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	// 2. Use Enum for safety and include DISPUTED as a blocked state
	const BLOCKED_STATUSES: ComplaintStatus[] = [
		ComplaintStatus.RESOLVED,
		ComplaintStatus.CONFIRMED,
		ComplaintStatus.CLOSED,
		ComplaintStatus.DISPUTED,
	];

	if (BLOCKED_STATUSES.includes(complaint.status)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Cannot resolve: Complaint is currently '${complaint.status}'`,
		);
	}

	// 3. Transaction: Update Status + Create Audit Log
	const [updatedComplaint] = await prisma.$transaction([
		prisma.complaint.update({
			where: { id: complaintId },
			data: {
				status: ComplaintStatus.RESOLVED,
				resolutionProof: resolutionProof || null,
				resolvedAt: new Date(),
			},
		}),
		prisma.complaintStatusLog.create({
			data: {
				complaintId,
				oldStatus: complaint.status,
				newStatus: ComplaintStatus.RESOLVED,
				performedBy: staffId,
				note: resolutionProof
					? "Resolution proof uploaded"
					: "Marked as resolved",
			},
		}),
	]);

	return updatedComplaint;
};

const confirmComplaint = async (complaintId: string, userId: string) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
		select: { status: true, citizenId: true },
	});

	if (!complaint) throw new AppError(404, "Not found");

	// Security: Only the citizen who filed it can confirm
	if (complaint.citizenId !== userId) throw new AppError(403, "Unauthorized");

	// Logic: Can only confirm if it's currently RESOLVED
	if (complaint.status !== ComplaintStatus.RESOLVED) {
		throw new AppError(400, "Complaint must be in RESOLVED status to confirm");
	}

	return await prisma.complaint.update({
		where: { id: complaintId },
		data: {
			status: ComplaintStatus.CONFIRMED,
			confirmedAt: new Date(),
		},
	});
};

// staff
const getAssignedComplaints = async (
	userId: string,
	filters: {
		page?: number;
		limit?: number;
		status?: string;
	},
) => {
	const { page = 1, limit = 10, status } = filters;
	const skip = (page - 1) * limit;

	const where: any = { assignedStaffId: userId };
	if (status) where.status = status;

	const [complaints, total] = await prisma.$transaction([
		prisma.complaint.findMany({
			where,
			skip,
			take: limit,
			orderBy: { submittedAt: "desc" },
			include: {
				category: { select: { name: true } },
				citizen: { select: { name: true, phone: true } },
			},
		}),
		prisma.complaint.count({ where }),
	]);

	return {
		data: complaints,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const getDepartmentComplaints = async (
	departmentId: string,
	filters: {
		page?: number;
		limit?: number;
		status?: string;
		priority?: string;
	},
) => {
	const { page = 1, limit = 10, status, priority } = filters;
	const skip = (page - 1) * limit;

	const where: any = { departmentId };
	if (status) where.status = status;
	if (priority) where.priority = priority;

	const [complaints, total] = await prisma.$transaction([
		prisma.complaint.findMany({
			where,
			skip,
			take: limit,
			orderBy: { submittedAt: "desc" },
			include: {
				assignedStaff: { select: { name: true } },
				category: { select: { name: true } },
			},
		}),
		prisma.complaint.count({ where }),
	]);

	return {
		data: complaints,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const startComplaint = async (complaintId: string, staffId: string) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
		select: { status: true, assignedStaffId: true },
	});

	if (!complaint) throw new AppError(404, "Complaint not found");

	// Security: Only the assigned staff can start it
	if (complaint.assignedStaffId !== staffId) {
		throw new AppError(403, "You are not assigned to this complaint");
	}

	// Logic: Can only start if it's currently ASSIGNED
	if (complaint.status !== ComplaintStatus.ASSIGNED) {
		throw new AppError(400, `Cannot start: Status is '${complaint.status}'`);
	}

	return await prisma.$transaction(async (tx) => {
		const updated = await tx.complaint.update({
			where: { id: complaintId },
			data: { status: ComplaintStatus.IN_PROGRESS, inProgressAt: new Date() },
		});

		await tx.complaintStatusLog.create({
			data: {
				complaintId,
				oldStatus: ComplaintStatus.ASSIGNED,
				newStatus: ComplaintStatus.IN_PROGRESS,
				performedBy: staffId,
				note: "Work started on complaint",
			},
		});

		return updated;
	});
};

const updatePriority = async (
	complaintId: string,
	adminId: string,
	newPriority: ComplaintPriority,
) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
	});
	if (!complaint) throw new AppError(404, "Complaint not found");

	return await prisma.$transaction(async (tx) => {
		const updated = await tx.complaint.update({
			where: { id: complaintId },
			data: { priority: newPriority },
		});

		await tx.complaintStatusLog.create({
			data: {
				complaintId,
				oldStatus: complaint.status, // Priority isn't a status, but we log it anyway
				newStatus: complaint.status,
				performedBy: adminId,
				note: `Priority changed from ${complaint.priority} to ${newPriority}`,
			},
		});

		return updated;
	});
};

const moveToReview = async (complaintId: string, adminId: string) => {
	return await prisma.$transaction(async (tx) => {
		const updated = await tx.complaint.update({
			where: { id: complaintId },
			data: { status: ComplaintStatus.ACKNOWLEDGED }, // Or a specific 'IN_REVIEW' status if you add one
		});

		await tx.complaintStatusLog.create({
			data: {
				complaintId,
				oldStatus: updated.status, // Note: This will be the NEW status due to update order, fix by fetching old first if needed
				newStatus: ComplaintStatus.ACKNOWLEDGED,
				performedBy: adminId,
				note: "Moved to admin review",
			},
		});
		return updated;
	});
};

const assignComplaint = async (
	complaintId: string,
	adminId: string,
	staffId: string,
) => {
	const staff = await prisma.user.findUnique({ where: { id: staffId } });
	if (!staff || staff.role !== Role.STAFF) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid staff member");
	}

	return await prisma.$transaction(async (tx) => {
		const updated = await tx.complaint.update({
			where: { id: complaintId },
			data: {
				assignedStaffId: staffId,
				status: ComplaintStatus.ASSIGNED,
				assignedAt: new Date(),
			},
		});

		await tx.complaintStatusLog.create({
			data: {
				complaintId,
				oldStatus: updated.status,
				newStatus: ComplaintStatus.ASSIGNED,
				performedBy: adminId,
				note: `Assigned to ${staff.name}`,
			},
		});
		return updated;
	});
};

export const ComplaintServices = {
	createComplaint,
	getMyComplaints,
	getSingleComplaintById,
	getAllComplaints,
	resolveComplaint,
	confirmComplaint,
	getAssignedComplaints,
	getDepartmentComplaints,
	startComplaint,
	updatePriority,
	moveToReview,
	assignComplaint,
};
