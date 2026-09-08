// payment.controller.ts
import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentServices } from "./payment.service";
import config from "../../config";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
	const fineId = req.params.fineId as string;
	const userId = req.user?.userId as string;

	const result = await PaymentServices.initiatePayment(fineId, userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Redirect to bKash to complete payment",
		data: result,
	});
});

// bKash redirects the citizen's browser here (GET, query params) after checkout
const bkashCallback = catchAsync(async (req: Request, res: Response) => {
	const { paymentID, status } = req.query;

	await PaymentServices.handleBkashCallback(
		paymentID as string,
		status as string,
	);

	res.redirect(
		`${config.frontend_url}/payment-result?status=${status}&paymentID=${paymentID}`,
	);
});

const refundFine = catchAsync(async (req: Request, res: Response) => {
	const fineId = req.params.id as string;
	const adminId = req.user?.userId as string;
	const { note } = req.body;

	const result = await PaymentServices.refundFinePayment(fineId, adminId, note);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Fine refunded successfully",
		data: result,
	});
});

export const PaymentController = { initiatePayment, bkashCallback, refundFine };
