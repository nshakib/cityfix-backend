import {
	ComplaintPriority,
	ComplaintStatus,
	Role,
} from "../../../generated/prisma/enums";
import { ComplaintWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	STATUS_TIMESTAMP_FIELD,
	STATUS_TRANSITIONS,
} from "./complaint.constants";
import type {
	ICreateComplaint,
	IResolveComplaint,
} from "./complaint.interface";
import httpStatus from "http-status";

const createComplaint = async (payload: ICreateComplaint, userId: string) => {
	const { title, description, location, photos, categoryId, priority } = payload;

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
			priority: priority as ComplaintPriority,
		},
	});

	return result;
};

// const acknowledgeComplaint = async (complaintId: string, user:Role, note?: string, userId?: string) => {
//   // 1. Permission Check
//   if (user !== Role.ADMIN && user !== Role.SUPER_ADMIN) {
//     throw new AppError(httpStatus.FORBIDDEN, "Only Admins can acknowledge complaints");
//   }

//   // 2. Find Complaint
//   const complaint = await prisma.complaint.findUnique({
//     where: { id: complaintId },
//   });

//   if (!complaint) {
//     throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
//   }

//   // 3. State Transition Check (§8)
//   if (complaint.status !== ComplaintStatus.SUBMITTED) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Complaint can only be acknowledged from SUBMITTED status");
//   }

//   // 4. Update Status & Timestamp
//   const updatedComplaint = await prisma.$transaction(async (tx) => {
//     // Update Complaint
//     const updated = await tx.complaint.update({
//       where: { id: complaintId },
//       data: {
//         status: ComplaintStatus.ACKNOWLEDGED,
//         acknowledgedAt: new Date(),
//       },
//     });

//     // Create Audit Log
//     await tx.complaintStatusLog.create({
//       data: {
//         complaintId: complaintId,
//         fromStatus: ComplaintStatus.SUBMITTED,
//         toStatus: ComplaintStatus.ACKNOWLEDGED,
//         changedBy:userId,
//         note: note || "Complaint acknowledged by Admin",
//       },
//     });

//     return updated;
//   });

//   return updatedComplaint;
// };

const acknowledgeComplaint = async (complaintId: string, user: Role, note?: string, userId?: string) => {
  // 1. Permission Check (§2.1 & §6 API Endpoints)
  if (user !== Role.ADMIN && user !== Role.SUPER_ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, "Only Admins can acknowledge complaints");
  }

  // 2. Use the centralized transition handler
  // This handles: Finding the complaint, checking allowed transitions, 
  // updating timestamps, and creating the audit log.
  return transitionStatus(
    complaintId,
    ComplaintStatus.ACKNOWLEDGED,
    userId as string, // Pass the userId for the audit log
    note || "Complaint acknowledged by Admin"
  );
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

const getAllComplaints = async (query: IQuery, departmentId: string) => {
	const { 
		status, 
		priority, 
		searchTerm, 
		page = 1, 
		limit = 10, 
		sortBy = "submittedAt", 
		sortOrder = "desc" 
	} = query;
	const pageNum = Number(page);
	const limitNum = Number(limit);
	const skip = (pageNum - 1) * limitNum;

	const andConditions: ComplaintWhereInput[] = [];

	const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

	if (status) andConditions.push({ status });
	if (priority) andConditions.push({ priority });
	
	if (query.departmentId) {
		andConditions.push({ departmentId: query.departmentId });
	}
	if (searchTerm) {
		andConditions.push({
			OR: [
				{ description: { contains: searchTerm, mode: "insensitive" } },
				{ location: { contains: searchTerm, mode: "insensitive" } }, // If location is stored as text
				{ category: { name: { contains: searchTerm, mode: "insensitive" } } },
			],
		});
	}

	const [complaints, total] = await prisma.$transaction([
		prisma.complaint.findMany({
			where: whereCondition,
			skip,
			take: limitNum,
			orderBy: { 
				[sortBy]: sortOrder,
			},

			include: {
				category: { select: { name: true } },
				department: { select: { name: true } },
				assignedStaff: { select: { name: true, phone: true } },
				citizen: { select: { name: true, phone: true } }, // Admins need to contact citizens
			},
		}),
		prisma.complaint.count({ where: whereCondition }),
	]);

	return {
		data: complaints,
		meta: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limitNum),
			
		},
	};
};

const resolveComplaint = async (
	complaintId: string,
	user:any, // Pass the full user object from req.user
	payload: IResolveComplaint,
) => {
	// 1. Permission Check (§7.2 & §6 API Endpoints)
	if (user.role !== Role.STAFF) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only Staff can resolve complaints"
        );
    }

	// if (complaint.assignedStaffId !== user.userId) {
	// 	throw new AppError(httpStatus.FORBIDDEN, "Only Staff can resolve complaints");
	// }

	// 2. Verify Assignment (§9 Assignment)
	// Ensure the staff member is actually assigned to this specific complaint
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
		select: { assignedStaffId: true, status: true },
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	if (complaint.assignedStaffId !== user.userId) {
		throw new AppError(httpStatus.FORBIDDEN, "You are not assigned to this complaint");
	}

	if (complaint.status !== ComplaintStatus.IN_PROGRESS) {
    throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot resolve a complaint with status ${complaint.status}`
    );
}

	// 3. Convert Object to String for Prisma (§11 Data Models: resolutionProof is String)
	const resolutionProofString = payload.resolutionProof 
		? JSON.stringify(payload.resolutionProof) 
		: null;

	const note = payload.resolutionProof?.note || "Marked as resolved by Staff";

	// 4. Use Centralized Transition Helper (Enforces §8 Lifecycle & Audit Trail)
	return transitionStatus(
		complaintId,
		ComplaintStatus.RESOLVED,
		user.userId, // Pass userId for the audit log
		note,
		{ resolutionProof: resolutionProofString } // Extra data to update in Prisma
	);
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
			status: ComplaintStatus.CLOSED,
			closedAt: new Date(),
		},
	});
};

// staff
const getAssignedComplaints = async (user:Role, query: IQuery, userId: string, departmentId: string) => {
	const { 
		status, 
		priority, 
		searchTerm, 
		page = 1, 
		limit = 10, 
		sortBy = "submittedAt", 
		sortOrder = "desc" 
	} = query;

	const pageNum = Number(page);
	const limitNum = Number(limit);
	const skip = (pageNum - 1) * limitNum;

	const andConditions: ComplaintWhereInput[] = [];

	// 1. Role-Based Visibility Logic (§7.2)
	if (user === Role.STAFF) {
		// Staff can see:
		// A. Complaints assigned to them
		// B. Unassigned complaints in their own department
		andConditions.push({
			OR: [
				{ assignedStaffId: userId }, // Complaints assigned to this staff
				{ 
					AND: [
						{ assignedStaffId: null },
						{ departmentId:departmentId } // Assuming user object has staffProfile
					]
				}
			]
		});
	} else if (user === Role.CITIZEN) {
		// Citizens only see their own complaints
		andConditions.push({ citizenId: userId });
	}
	// Admin/SuperAdmin see all, so no extra filter needed here unless we want to restrict by dept

	// 2. Filtering
	if (status) {
		andConditions.push({ status: status });
	}

	if (priority) {
		andConditions.push({ priority: priority });
	}

	if (searchTerm) {
		andConditions.push({
			OR: [
				{ description: { contains: searchTerm, mode: "insensitive" } },
				{ location: { contains: searchTerm, mode: "insensitive" } }, // If location is stored as text
				{ category: { name: { contains: searchTerm, mode: "insensitive" } } },
			],
		});
	}

	// Optional: Filter by Department if provided in query (mostly for Admins)
	if (query.departmentId) {
		andConditions.push({ departmentId: query.departmentId });
	}

	// 3. Query Execution
	const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

	const [complaints, total] = await prisma.$transaction([
		prisma.complaint.findMany({
			where: whereCondition,
			skip,
			take: limitNum,
			orderBy: {
				[sortBy]: sortOrder,
			},
			include: {
				category: { select: { name: true } },
				department: { select: { name: true } },
				assignedStaff: { 
					select: { 
						name: true, 
						phone: true,
						email: true
					} 
				},
				citizen: { 
					select: { 
						name: true, 
						phone: true,
						email: true
					} 
				},
				// Include logs if needed for quick status check, otherwise keep it light
			},
		}),
		prisma.complaint.count({ where: whereCondition }),
	]);

	return {
		data: complaints,
		meta: {
			total,
			page: pageNum,
			limit: limitNum,
			totalPages: Math.ceil(total / limitNum),
		},
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
	if (complaint.status !== ComplaintStatus.ASSIGNED && complaint.status !== ComplaintStatus.DISPUTED) {
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
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	const BLOCKED_STATUSES: ComplaintStatus[] = [
		ComplaintStatus.RESOLVED,
		ComplaintStatus.CLOSED,
	];

	if (BLOCKED_STATUSES.includes(complaint.status)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Cannot assign: complaint is currently '${complaint.status}'`,
		);
	}

	const staff = await prisma.user.findUnique({ where: { id: staffId } });

	if (!staff || staff.role !== Role.STAFF) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid staff member");
	}

	if (staff.status !== "ACTIVE") {
		throw new AppError(httpStatus.BAD_REQUEST, "Staff member is not active");
	}

	if (staff.departmentId !== complaint.departmentId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Staff member does not belong to this complaint's department",
		);
	}

	const oldStatus = complaint.status; // capture BEFORE update

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
				oldStatus,
				newStatus: ComplaintStatus.ASSIGNED,
				performedBy: adminId,
				note: `Assigned to ${staff.name}`,
			},
		});

		return updated;
	});
};

// complaint.service.ts
const transitionStatus = async (
	complaintId: string,
	toStatus: ComplaintStatus,
	performedBy: string,
	note: string,
	extraData: Record<string, any> = {},
) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
	});
	if (!complaint)
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");

	const allowed = STATUS_TRANSITIONS[complaint.status] ?? [];
	if (!allowed.includes(toStatus)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Cannot move from '${complaint.status}' to '${toStatus}'`,
		);
	}

	const oldStatus = complaint.status; // captured correctly, once, in one place
	const timestampField = STATUS_TIMESTAMP_FIELD[toStatus];

	return prisma.$transaction(async (tx) => {
		const updated = await tx.complaint.update({
			where: { id: complaintId },
			data: {
				status: toStatus,
				...(timestampField ? { [timestampField]: new Date() } : {}),
				...extraData,
			},
		});

		await tx.complaintStatusLog.create({
			data: { complaintId, oldStatus, newStatus: toStatus, performedBy, note },
		});

		return updated;
	});
};

// DISPUTED → IN_PROGRESS, admin or the originally-assigned staff
const reopenDisputedComplaint = async (
	complaintId: string,
	performedBy: string,
	performerRole: Role,
) => {
	const complaint = await prisma.complaint.findUnique({
		where: {
			id: complaintId,
		},
	});

	if (!complaint)
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");

	const isAdmin =
		performerRole === Role.ADMIN || performerRole === Role.SUPER_ADMIN;
	const isAssignedStaff =
		performerRole === Role.STAFF && complaint.assignedStaffId === performedBy;
	if (!isAdmin && !isAssignedStaff) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only an admin or the assigned staff member can reopen this complaint",
		);
	}

	return transitionStatus(
		complaintId,
		ComplaintStatus.IN_PROGRESS,
		performedBy,
		"Dispute reopened, work resumed",
	);
};

// citizen: RESOLVED → DISPUTED, reason required per spec
const disputeComplaint = async (
	complaintId: string,
	userId: string,
	reason: string,
) => {
	const complaint = await prisma.complaint.findUnique({
		where: { id: complaintId },
		select: { citizenId: true },
	});
	if (!complaint)
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	if (complaint.citizenId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not authorized to dispute this complaint",
		);
	}

	return transitionStatus(
		complaintId,
		ComplaintStatus.DISPUTED,
		userId,
		`Disputed: ${reason}`,
	);
};

const rejectComplaint = async (complaintId: string, user: any, reason: string) => {
  // 1. Permission Check (§2.1 & §6)
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new AppError(httpStatus.FORBIDDEN, "Only Admins can reject complaints");
  }

  // 2. Find Complaint to check current status
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
  }

  // 3. State Transition Check (§8)
  // Rejection is only allowed from SUBMITTED or ACKNOWLEDGED
  if (complaint.status !== "SUBMITTED" && complaint.status !== "ACKNOWLEDGED") {
    throw new AppError(
      httpStatus.BAD_REQUEST, 
      `Cannot reject: Complaint is currently '${complaint.status}'. Rejection is only allowed from SUBMITTED or ACKNOWLEDGED.`
    );
  }

  // 4. Use Centralized Transition Helper
  // This handles: updating status, setting rejectedAt, and creating the audit log
  return transitionStatus(
    complaintId,
    ComplaintStatus.REJECTED,
    user.userId,
    `Rejected by Admin: ${reason}`
  );
};
export const ComplaintServices = {
	createComplaint,
	acknowledgeComplaint,
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
	disputeComplaint,
	reopenDisputedComplaint,
	transitionStatus,
	rejectComplaint
};
