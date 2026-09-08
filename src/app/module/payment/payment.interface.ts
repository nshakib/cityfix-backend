import type {
	PaymentGateway,
	PaymentStatus,
} from "../../../generated/prisma/enums";

export interface ICreatePayment {
	fineId: string;
	gateway?: PaymentGateway;
}

export interface IPaymentWebhookPayload {
	transactionRef: string;
	status: string;
	amount?: number;
	signature?: string;
	[key: string]: unknown;
}

export interface IPaymentFilters {
	status?: PaymentStatus;
	gateway?: PaymentGateway;
	page?: string;
	limit?: string;
}
