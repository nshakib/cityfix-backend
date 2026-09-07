import httpStatus from "http-status";
import { PaymentStatus, PaymentGateway } from "../../../generated/prisma/enums";
import config from "../../config";
import {
	createBkashPayment,
	executeBkashPayment,
} from "../../services/bkash.service";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

const createPayment = async (fineId: string, userId: string) => {
	// 1. Verify Fine is Payable
	const fine = await prisma.fine.findUnique({ where: { id: fineId } });

	if (!fine) throw new AppError(httpStatus.NOT_FOUND, "Fine not found");
	if (fine.recipientId !== userId)
		throw new AppError(httpStatus.FORBIDDEN, "Unauthorized");
	if (fine.status !== "ISSUED" && fine.status !== "UPHELD") {
		throw new AppError(httpStatus.BAD_REQUEST, "Fine is not currently payable");
	}

	// 2. Create Pending Payment Record
	const payment = await prisma.payment.create({
		data: {
			fineId,
			amount: fine.amount,
			gateway: PaymentGateway.BKASH,
			status: PaymentStatus.PENDING,
		},
	});

	// 3. Initialize bKash Session
	// We use our internal payment.id as the reference so we can match it later
	const callbackUrl = `${config.frontend_url}/payment/success?ref=${payment.id}`;

	try {
		const bkashResponse = await createBkashPayment(
			Number(fine.amount),
			payment.id,
			callbackUrl,
		);

		// Update payment with the bKash PaymentID (transactionRef)
		await prisma.payment.update({
			where: { id: payment.id },
			data: { transactionRef: bkashResponse.paymentID },
		});

		return {
			paymentId: payment.id,
			bkashURL: bkashResponse.bkashURL,
		};
	} catch (error) {
		// If bKash fails, delete the pending payment to keep DB clean
		await prisma.payment.delete({ where: { id: payment.id } });
		throw error;
	}
};

const handleWebhook = async (payload: any) => {
	// bKash sends its own paymentID in the response
	const { paymentID, status } = payload;

	if (!paymentID)
		throw new AppError(httpStatus.BAD_REQUEST, "Missing payment ID");

	// 1. Find Payment by bKash's Transaction Ref (stored in transactionRef column)
	const payment = await prisma.payment.findFirst({
		where: { transactionRef: paymentID },
		include: { fine: true },
	});

	if (!payment)
		throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");

	// 2. Execute Payment to verify final status with bKash servers
	// Explicitly type as PaymentStatus to satisfy TypeScript
	let finalStatus: PaymentStatus = PaymentStatus.FAILED;

	try {
		const executionData = await executeBkashPayment(paymentID);

		// bKash returns "Completed" for success
		if (executionData.transactionStatus === "Completed") {
			finalStatus = PaymentStatus.SUCCESS;
		}
	} catch (error) {
		console.error("Webhook Execution Error:", error);
		// finalStatus remains FAILED
	}

	// 3. Update Payment & Fine in Transaction
	return await prisma.$transaction(async (tx) => {
		const updatedPayment = await tx.payment.update({
			where: { id: payment.id },
			data: {
				status: finalStatus,
				timestamp: new Date(),
			},
		});

		if (finalStatus === PaymentStatus.SUCCESS) {
			await tx.fine.update({
				where: { id: payment.fineId },
				data: {
					status: "PAID",
					paidAt: new Date(),
					paymentReference: paymentID, // Store bKash's ID for reference
				},
			});
		}

		return updatedPayment;
	});
};

const getPaymentById = async (
	paymentId: string,
	userId: string,
	userRole: string,
) => {
	const payment = await prisma.payment.findUnique({
		where: { id: paymentId },
		include: {
			fine: { select: { reason: true, amount: true, recipientId: true } },
		},
	});

	if (!payment) throw new AppError(httpStatus.NOT_FOUND, "Payment not found");

	// Security Check
	if (userRole === "CITIZEN" && payment.fine.recipientId !== userId) {
		throw new AppError(httpStatus.FORBIDDEN, "Unauthorized access");
	}

	return payment;
};

export const PaymentServices = {
	createPayment,
	handleWebhook,
	getPaymentById,
};
