import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";
import { getBkashIdToken } from "../lib/bkash";

export const createBkashPayment = async (
	amount: number,
	reference: string,
	callbackUrl: string,
) => {
	// 1. Get Token
	const idToken = await getBkashIdToken();

	// 2. Safety Check: Ensure token is not null
	if (!idToken) {
		throw new AppError(
			httpStatus.SERVICE_UNAVAILABLE,
			"Failed to retrieve bKash authentication token",
		);
	}

	try {
		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/create`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					authorization: idToken, // ✅ Now strictly a string
					"x-app-key": config.bkash_app_key,
				},
				body: JSON.stringify({
					mode: "0011",
					payerReference: reference,
					callbackURL: callbackUrl,
					amount: amount.toString(),
					currency: "BDT",
					intent: "sale",
				}),
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				errorData.errorMessage || "bKash Create Failed",
			);
		}

		return await response.json();
	} catch (error: any) {
		if (error instanceof AppError) throw error;
		throw new AppError(httpStatus.BAD_GATEWAY, "bKash Service Error");
	}
};

export const executeBkashPayment = async (paymentID: string) => {
	try {
		const idToken = await getBkashIdToken();

		// ✅ Safety Check: Ensure token is valid before proceeding
		if (!idToken) {
			throw new AppError(
				httpStatus.SERVICE_UNAVAILABLE,
				"bKash authentication token missing",
			);
		}

		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/execute`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					authorization: idToken, // ✅ Now TypeScript knows this is strictly a string
					"x-app-key": config.bkash_app_key,
				},
				body: JSON.stringify({ paymentID }),
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				errorData.errorMessage || "Bkash Execute Failed",
			);
		}

		return await response.json();
	} catch (error: any) {
		if (error instanceof AppError) throw error;
		throw new AppError(httpStatus.BAD_GATEWAY, "Bkash Service Error");
	}
};

export const refundBkashPayment = async (
	paymentID: string,
	amount: number,
	trxID: string,
) => {
	try {
		const idToken = await getBkashIdToken();

		// ✅ Safety Check
		if (!idToken) {
			throw new AppError(
				httpStatus.SERVICE_UNAVAILABLE,
				"bKash authentication token missing",
			);
		}

		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/payment/refund`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					authorization: idToken, // ✅ Now strictly a string
					"x-app-key": config.bkash_app_key,
				},
				body: JSON.stringify({ paymentID, amount, trxID }),
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				errorData.errorMessage || "Bkash Refund Failed",
			);
		}

		return await response.json();
	} catch (error: any) {
		if (error instanceof AppError) throw error;
		throw new AppError(httpStatus.BAD_GATEWAY, "Bkash Service Error");
	}
};
