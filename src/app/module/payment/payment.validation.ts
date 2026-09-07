import { z } from "zod";
import { PaymentGateway } from "../../../generated/prisma/enums";

export const createPaymentSchema = z.object({
	fineId: z.string().uuid({ message: "Invalid fine ID" }),
	gateway: z
		.enum(Object.values(PaymentGateway) as [string, ...string[]])
		.optional(),
});

export const webhookSchema = z.object({
	transactionRef: z.string(),
	status: z.string(),
	amount: z.number().optional(),
	// Add other gateway-specific fields like 'signature' for verification
});
