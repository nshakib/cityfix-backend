import { z } from "zod";
import {
	ComplaintPriority,
	ComplaintStatus,
} from "../../../generated/prisma/enums";

export const createComplaintSchema = z
	.object({
		title: z
			.string()
			.min(5, { message: "Title must be at least 5 characters" })
			.max(100, { message: "Title cannot exceed 100 characters" })
			.trim(),

		description: z
			.string()
			.min(20, { message: "Description must be at least 20 characters" })
			.max(2000, { message: "Description is too long" }),

		location: z
			.string()
			.min(5, { message: "Please provide a more specific location" })
			.max(255),

		categoryId: z.string().uuid({ message: "Invalid category ID format" }),
		

		photos: z
			.array(z.string().url({ message: "Each photo must be a valid URL" }))
			.optional()
			.default([]),
	})
	.strict();
export const getMyComplaintsSchema = z.object({
	status: z
		.enum(Object.values(ComplaintStatus) as [string, ...string[]])
		.optional(),

	priority: z
		.enum(Object.values(ComplaintPriority) as [string, ...string[]])
		.optional(),

	page: z
		.string()
		.regex(/^\d+$/, { message: "Page must be a number" })
		.optional(),
	limit: z
		.string()
		.regex(/^\d+$/, { message: "Limit must be a number" })
		.optional(),
});

export const resolveComplaintSchema = z.object({
	resolutionProof: z
		.string()
		.url({ message: "Resolution proof must be a valid URL" })
		.optional(),
});

export const confirmComplaintSchema = z.object({
	id: z.string().uuid({ message: "Invalid complaint ID format" }),
});

export const getDepartmentComplaintsSchema = z.object({
	// Filter by specific status (e.g., only show "IN_PROGRESS")
	status: z
		.enum(Object.values(ComplaintStatus) as [string, ...string[]])
		.optional(),

	// Filter by urgency
	priority: z
		.enum(Object.values(ComplaintPriority) as [string, ...string[]])
		.optional(),

	// Pagination
	page: z
		.string()
		.regex(/^\d+$/, { message: "Page must be a number" })
		.optional(),
	limit: z
		.string()
		.regex(/^\d+$/, { message: "Limit must be a number" })
		.optional(),

	// Optional: Search by keyword in title/description
	search: z.string().trim().optional(),
});

export const getSingleComplaintSchema = z.object({
	id: z.string().uuid({ message: "Invalid complaint ID format" }),
});

export const updateStatusSchema = z
	.object({
		status: z.enum(Object.values(ComplaintStatus) as [string, ...string[]], {
			message: "Invalid status value",
		}),
		note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
	})
	.strict();

export const updatePrioritySchema = z
	.object({
		priority: z.enum(
			Object.values(ComplaintPriority) as [string, ...string[]],
			{
				message: "Invalid priority value",
			},
		),
	})
	.strict();

export const rerouteComplaintSchema = z.object({
	categoryId: z.string().uuid({ message: "Invalid category ID" }),
});

export const assignComplaintSchema = z.object({
	staffId: z.string().uuid({ message: "Invalid staff ID" }),
});
