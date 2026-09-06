import { ComplaintPriority, ComplaintStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateComplaint } from "./complaint.interface";
import httpStatus from "http-status";

const createComplaint = async (payload: ICreateComplaint, userId: string) => {
	const { title, description,location,photos,categoryId} = payload;

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
            priority:ComplaintPriority.MEDIUM,
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
      submittedAt: 'desc',
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
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to view this complaint");
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
      orderBy: { submittedAt: 'desc' },
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
export const ComplaintServices = {
	createComplaint,
    getMyComplaints,
    getSingleComplaintById,
    getAllComplaints
};
