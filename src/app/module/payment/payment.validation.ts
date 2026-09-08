import { z } from "zod";
import { PaymentGateway } from "../../../generated/prisma/enums";

// Route: POST /payments/fines/:fineId/pay — fineId comes from params, not body
export const createPaymentSchema = z.object({
	params: z.object({
		fineId: z.string().uuid({ message: "Invalid fine ID" }),
	}),
	body: z
		.object({
			gateway: z
				.enum(Object.values(PaymentGateway) as [string, ...string[]])
				.optional(),
		})
		.optional(),
});

// Route: GET /payments/bkash/callback — bKash sends paymentID + status as query params
export const bkashCallbackSchema = z.object({
	query: z.object({
		paymentID: z.string(),
		status: z.string(),
	}),
});