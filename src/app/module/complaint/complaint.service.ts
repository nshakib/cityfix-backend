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
export const ComplaintServices = {
	createComplaint,
    getMyComplaints
};
