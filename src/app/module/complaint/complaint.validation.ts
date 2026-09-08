import { z } from "zod";
import {
	ComplaintPriority,
	ComplaintStatus,
} from "../../../generated/prisma/enums";

export const createComplaintSchema = z.object({
	body: z
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
			priority: z
				.enum(Object.values(ComplaintPriority) as [string, ...string[]])
				.optional()
				.default(ComplaintPriority.MEDIUM),
		})
		.strict(),
});

// ASSUMPTION: route is PATCH /complaints/:id/acknowledge — has an :id param
export const acknowledgeComplaintSchema = z.object({
	body: z
		.object({
			note: z.string().optional(),
		})
		.optional(),
	params: z.object({
		id: z.string().uuid({ message: "Invalid complaint ID format" }),
	}),
});

// ASSUMPTION: route is PATCH /complaints/:id/start — has an :id param
export const startComplaintSchema = z.object({
	body: z.object({}).optional(),
	params: z.object({
		id: z.string().uuid({ message: "Invalid complaint ID format" }),
	}),
});

// These are all list/filter fields — moved to query, not body
export const getMyComplaintsSchema = z.object({
	query: z.object({
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
	}),
});

export const resolveComplaintSchema = z.object({
	body: z.object({
		resolutionProof: z
			.object({
				note: z.string().optional(),
			})
			.optional(),
	}),
	params: z.object({
		id: z.string(),
	}),
});

// "id" here was top-level — this is a route param (PATCH /complaints/:id/confirm)
export const confirmComplaintSchema = z.object({
	params: z.object({
		id: z.string().uuid({ message: "Invalid complaint ID format" }),
	}),
});

// Same pattern as getMyComplaintsSchema — all query/filter fields
export const getDepartmentComplaintsSchema = z.object({
	query: z.object({
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
		search: z.string().trim().optional(),
	}),
});

// "id" was top-level — route param (GET /complaints/:id)
export const getSingleComplaintSchema = z.object({
	params: z.object({
		id: z.string().uuid({ message: "Invalid complaint ID format" }),
	}),
});

// ASSUMPTION: PATCH /complaints/:id/status — body + :id param
export const updateStatusSchema = z.object({
	body: z
		.object({
			status: z.enum(Object.values(ComplaintStatus) as [string, ...string[]], {
				message: "Invalid status value",
			}),
			note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
		})
		.strict(),
	params: z.object({
		id: z.string().uuid({ message: "Invalid complaint ID format" }),
	}),
});

// ASSUMPTION: PATCH /complaints/:id/priority — body + :id param
export const updatePrioritySchema = z.object({
	body: z
		.object({
			priority: z.enum(
				Object.values(ComplaintPriority) as [string, ...string[]],
				{ message: "Invalid priority value" },
			),
		})
		.strict(),
	params: z.object({
		id: z.string().uuid({ message: "Invalid complaint ID format" }),
	}),
});

// ASSUMPTION: PATCH /complaints/:id/reroute — body + :id param
export const rerouteComplaintSchema = z.object({
	body: z.object({
		categoryId: z.string().uuid({ message: "Invalid category ID" }),
	}),
	params: z.object({
		id: z.string().uuid({ message: "Invalid complaint ID format" }),
	}),
});

// ASSUMPTION: PATCH /complaints/:id/assign — body + :id param
export const assignComplaintSchema = z.object({
	body: z.object({
		staffId: z.string().uuid({ message: "Invalid staff ID" }),
	}),
	params: z.object({
		id: z.string().uuid({ message: "Invalid complaint ID format" }),
	}),
});

export const disputeComplaintSchema = z.object({
	body: z.object({
		reason: z
			.string()
			.min(10, { message: "Reason must be at least 10 characters" })
			.max(500, { message: "Reason cannot exceed 500 characters" }),
	}),
	params: z.object({
		id: z.string(),
	}),
});

export const rejectComplaintSchema = z.object({
  body: z.object({
    reason: z.string().min(5, "Reason for rejection is required"),
  }),
});