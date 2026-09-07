import { z } from "zod";
import { FineStatus } from "../../../generated/prisma/enums";

export const createFineSchema = z.object({
	citizenId: z.string().uuid({ message: "Invalid citizen ID" }),
	complaintId: z.string().uuid({ message: "Invalid complaint ID" }).optional(),
	amount: z.number().positive({ message: "Amount must be greater than zero" }),
	reason: z.string().min(10, "Reason must be at least 10 characters"),
	category: z.string().min(3, "Category is required"),
});

export const getFinesSchema = z.object({
	status: z.enum(Object.values(FineStatus) as [string, ...string[]]).optional(),
	page: z.string().regex(/^\d+$/).optional(),
	limit: z.string().regex(/^\d+$/).optional(),
	search: z.string().trim().optional(),
});

export const getSingleFineSchema = z.object({
	id: z.string().uuid({ message: "Invalid fine ID format" }),
});

export const disputeFineSchema = z.object({
	reason: z.string().min(20, "Dispute reason must be at least 20 characters"),
	evidence: z
		.string()
		.url({ message: "Evidence must be a valid URL" })
		.optional(),
});
