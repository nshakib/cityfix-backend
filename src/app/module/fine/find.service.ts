import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { FineStatus, Role } from "../../../generated/prisma/enums";
import type {
	ICreateFine,
	IDisputeFine,
	IGetFinesFilters,
} from "./find.interface";

// 1. Issue a Fine (Staff Only)
const createFine = async (
	payload: ICreateFine,
	staffId: string,
	staffDepartmentId: string,
) => {
	const { citizenId, guestName, guestContact, complaintId, amount, reason, category } = payload;

	if (citizenId) {
		const citizen = await prisma.user.findUnique({ where: { id: citizenId } });
		if (!citizen || citizen.role !== Role.CITIZEN) {
			throw new AppError(httpStatus.BAD_REQUEST, "Invalid citizen ID");
		}
	}

	const categoryRecord = await prisma.category.findFirst({
		where: { name: category, departmentId: staffDepartmentId },
	});

	if (!categoryRecord) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only issue fines for your department categories",
		);
	}

	return await prisma.fine.create({
		data: {
			recipientId: citizenId || null,
			guestName: citizenId ? null : guestName,
			guestContact: citizenId ? null : guestContact,
			issuedBy: staffId,
			categoryId: categoryRecord.id,
			complaintId: complaintId || null,
			amount,
			reason,
			status: FineStatus.ISSUED,
			issuedAt: new Date(),
		},
		include: {
			recipient: { select: { name: true } },
			category: { select: { name: true } },
		},
	});
};

// 2. Get All Fines (Admin/Global View)
const getAllFines = async (filters: IGetFinesFilters) => {
	const { page = 1, limit = 10, status, search } = filters;
	const skip = (Number(page) - 1) * Number(limit);

	const where: any = {};
	if (status) where.status = status;
	if (search) {
		where.OR = [
			{ reason: { contains: search, mode: "insensitive" } },
			{ recipient: { name: { contains: search, mode: "insensitive" } } },
		];
	}

	const [fines, total] = await prisma.$transaction([
		prisma.fine.findMany({
			where,
			skip,
			take: Number(limit),
			orderBy: { createdAt: "desc" },
			include: {
				recipient: { select: { name: true, phone: true } },
				issuedByStaff: { select: { name: true } },
			},
		}),
		prisma.fine.count({ where }),
	]);

	return {
		data: fines,
		meta: {
			total,
			page: Number(page),
			limit: Number(limit),
			totalPages: Math.ceil(total / Number(limit)),
		},
	};
};

// 3. Get My Fines (Citizen View)
const getMyFines = async (userId: string, filters: IGetFinesFilters) => {
	const { page = 1, limit = 10, status } = filters;
	const skip = (Number(page) - 1) * Number(limit);

	const where: any = { recipientId: userId };
	if (status) where.status = status;

	const [fines, total] = await prisma.$transaction([
		prisma.fine.findMany({
			where,
			skip,
			take: Number(limit),
			orderBy: { createdAt: "desc" },
		}),
		prisma.fine.count({ where }),
	]);

	return {
		data: fines,
		meta: {
			total,
			page: Number(page),
			limit: Number(limit),
			totalPages: Math.ceil(total / Number(limit)),
		},
	};
};

// 4. Get Single Fine (With Ownership Check)
const getSingleFineById = async (
	fineId: string,
	userId: string,
	userRole: string,
) => {
	const fine = await prisma.fine.findUnique({
		where: { id: fineId },
		include: { disputes: true, payments: true },
	});

	if (!fine) throw new AppError(httpStatus.NOT_FOUND, "Fine not found");

	// Security: Citizens can only see their own fines
	if (userRole === Role.CITIZEN && fine.recipientId !== userId) {
		throw new AppError(httpStatus.FORBIDDEN, "Unauthorized access");
	}

	return fine;
};

// 5. Dispute a Fine (Citizen)
const disputeFine = async (
	fineId: string,
	userId: string,
	payload: IDisputeFine,
) => {
	const fine = await prisma.fine.findUnique({ where: { id: fineId } });

	if (!fine) throw new AppError(httpStatus.NOT_FOUND, "Fine not found");
	if (fine.recipientId !== userId)
		throw new AppError(httpStatus.FORBIDDEN, "Unauthorized");
	if (fine.status !== FineStatus.ISSUED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Cannot dispute: Status is ${fine.status}`,
		);
	}

	return await prisma.fine.update({
		where: { id: fineId },
		data: {
			status: FineStatus.DISPUTED,
			disputeReason: payload.reason,
			disputeEvidence: payload.evidence,
			disputedAt: new Date(),
		},
	});
};

// 6. Uphold Dispute (Admin) - Fine remains active
const upholdDispute = async (
	fineId: string,
	adminId: string,
	note?: string,
) => {
	const fine = await prisma.fine.findUnique({ where: { id: fineId } });

	if (!fine) throw new AppError(httpStatus.NOT_FOUND, "Fine not found");
	if (fine.status !== FineStatus.DISPUTED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Fine is not currently disputed",
		);
	}

	return await prisma.fine.update({
		where: { id: fineId },
		data: {
			status: FineStatus.UPHELD, // Fine is still active and must be paid
			reviewedBy: adminId,
			reviewedAt: new Date(),
			reviewNote: note || "Dispute rejected: Evidence insufficient",
		},
	});
};

// 7. Waive Fine (Admin) - Fine is cancelled due to valid dispute
const waiveFine = async (fineId: string, adminId: string, note?: string) => {
	const fine = await prisma.fine.findUnique({ where: { id: fineId } });

	if (!fine) throw new AppError(httpStatus.NOT_FOUND, "Fine not found");
	if (fine.status !== FineStatus.DISPUTED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Fine is not currently disputed",
		);
	}

	return await prisma.fine.update({
		where: { id: fineId },
		data: {
			status: FineStatus.WAIVED, // Fine is cancelled
			reviewedBy: adminId,
			reviewedAt: new Date(),
			reviewNote: note || "Dispute accepted: Fine waived",
		},
	});
};

// 8. Void Fine (Admin) - Cancel without dispute (e.g., error in issuance)
const voidFine = async (fineId: string, adminId: string, note?: string) => {
	const fine = await prisma.fine.findUnique({ where: { id: fineId } });
	if (!fine) throw new AppError(httpStatus.NOT_FOUND, "Fine not found");
	if (fine.status === FineStatus.PAID) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Cannot void a paid fine. Process a refund instead.",
		);
	}

	return await prisma.fine.update({
		where: { id: fineId },
		data: { status: FineStatus.VOIDED },
	});
};

export const FineServices = {
	createFine,
	getAllFines,
	getMyFines,
	getSingleFineById,
	disputeFine,
	upholdDispute,
	waiveFine,
	voidFine,
};
