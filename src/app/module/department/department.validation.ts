import z from "zod";
import { DepartmentStatus } from "../../../generated/prisma/enums";

const createDepartmentValidation = z.object({
	body: z.object({
		name: z.string().trim().min(2).max(100),

		description: z.string().trim().max(500).optional(),
	}),
});

const updateDepartmentValidation = z.object({
	body: z.object({
		name: z.string().trim().min(2).max(100).optional(),

		description: z.string().trim().max(500).optional(),
	}),
});

const updateDepartmentStatusValidation = z.object({
	body: z.object({
		status: z.enum(DepartmentStatus),
	}),
});

export const DepartmentValidation = {
	createDepartmentValidation,
	updateDepartmentValidation,
	updateDepartmentStatusValidation,
};
