import { z } from "zod";
import { FineStatus } from "../../../generated/prisma/enums";

export const createFineSchema = z.object({
	body: z
		.object({
			citizenId: z.string().uuid().optional(),
			guestName: z.string().min(2).optional(),
			guestContact: z.string().min(5).optional(),
			complaintId: z.string().uuid().optional(),
			amount: z.number().positive(),
			reason: z.string().min(10),
			category: z.string().min(3),
		})
		.refine((data) => data.citizenId || (data.guestName && data.guestContact), {
			message: "Either citizenId or guestName + guestContact is required",
		}),
});

// List/filter fields — query, not body
export const getFinesSchema = z.object({
	query: z.object({
		status: z
			.enum(Object.values(FineStatus) as [string, ...string[]])
			.optional(),
		page: z.string().regex(/^\d+$/).optional(),
		limit: z.string().regex(/^\d+$/).optional(),
		search: z.string().trim().optional(),
	}),
});

// "id" was top-level — route param (GET /fines/:id)
export const getSingleFineSchema = z.object({
	params: z.object({
		id: z.string().uuid({ message: "Invalid fine ID format" }),
	}),
});

// ASSUMPTION: PATCH /fines/:id/dispute — body + :id param
export const disputeFineSchema = z.object({
	body: z.object({
		reason: z.string().min(20, "Dispute reason must be at least 20 characters"),
		evidence: z
			.string()
			.url({ message: "Evidence must be a valid URL" })
			.optional(),
	}),
	params: z.object({
		id: z.string().uuid({ message: "Invalid fine ID format" }),
	}),
});