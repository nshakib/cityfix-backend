import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { FineStatus, PaymentStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import {
	createBkashPayment,
	executeBkashPayment,
	refundBkashPayment,
} from "../../services/bkash.service";
import Stripe from "stripe";

// 1. Citizen initiates payment for a fine
const initiatePayment = async (fineId: string, userId: string) => {
	const fine = await prisma.fine.findUnique({ where: { id: fineId } });

	if (!fine) throw new AppError(httpStatus.NOT_FOUND, "Fine not found");
	if (fine.recipientId !== userId) {
		throw new AppError(httpStatus.FORBIDDEN, "You cannot pay this fine");
	}
	if (fine.status === FineStatus.PAID) {
		throw new AppError(httpStatus.BAD_REQUEST, "Fine is already paid");
	}
	if (fine.status !== FineStatus.ISSUED && fine.status !== FineStatus.UPHELD) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Cannot pay a fine with status ${fine.status}`,
		);
	}

	const bkashResult = await createBkashPayment(
		Number(fine.amount),
		fine.id, // payerReference
		`${config.bkash_callback_url}`, // adjust to your actual config key
	);

	await prisma.payment.create({
		data: {
			fineId: fine.id,
			amount: fine.amount,
			gateway: "BKASH",
			paymentId: bkashResult.paymentID,
			status: PaymentStatus.PENDING,
		},
	});

	return { bkashURL: bkashResult.bkashURL, paymentID: bkashResult.paymentID };
};

// 2. bKash calls back after the citizen completes/cancels checkout
const handleBkashCallback = async (paymentID: string, status: string) => {
	const payment = await prisma.payment.findFirst({
		where: { paymentId: paymentID },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
	}

	if (status !== "success") {
		return prisma.payment.update({
			where: { id: payment.id },
			data: {
				status:
					status === "cancel" ? PaymentStatus.CANCELLED : PaymentStatus.FAILED,
			},
		});
	}

	const executeResult = await executeBkashPayment(paymentID);

	if (executeResult.transactionStatus !== "Completed") {
		return prisma.payment.update({
			where: { id: payment.id },
			data: { status: PaymentStatus.FAILED },
		});
	}

	return prisma.$transaction(async (tx) => {
		const updatedPayment = await tx.payment.update({
			where: { id: payment.id },
			data: {
				status: PaymentStatus.SUCCESS,
				transactionRef: executeResult.trxID,
			},
		});

		await tx.fine.update({
			where: { id: payment.fineId },
			data: {
				status: FineStatus.PAID,
				paidAt: new Date(),
				paymentReference: executeResult.trxID,
			},
		});

		return updatedPayment;
	});
};

// 3. Admin refunds a paid fine (e.g. approving a late dispute)
const refundFinePayment = async (
	fineId: string,
	adminId: string,
	note?: string,
) => {
	const fine = await prisma.fine.findUnique({
		where: { id: fineId },
		include: { payments: { where: { status: PaymentStatus.SUCCESS } } },
	});

	if (!fine) throw new AppError(httpStatus.NOT_FOUND, "Fine not found");
	if (fine.status !== FineStatus.PAID) {
		throw new AppError(httpStatus.BAD_REQUEST, "Fine is not in a paid state");
	}

	const successfulPayment = fine.payments[0];
	if (
		!successfulPayment ||
		!successfulPayment.paymentId ||
		!successfulPayment.transactionRef
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"No successful payment found to refund",
		);
	}

	const refundResult = await refundBkashPayment(
		successfulPayment.paymentId,
		Number(successfulPayment.amount),
		successfulPayment.transactionRef,
	);

	return prisma.$transaction(async (tx) => {
		await tx.payment.update({
			where: { id: successfulPayment.id },
			data: { status: PaymentStatus.REFUNDED },
		});

		return tx.fine.update({
			where: { id: fineId },
			data: {
				status: FineStatus.WAIVED,
				reviewedBy: adminId,
				reviewedAt: new Date(),
				reviewNote: note || "Refunded and waived",
			},
		});
	});
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const createStripeCheckout = async (fineId: string, userId?: string) => {
  const fine = await prisma.fine.findUnique({ where: { id: fineId } });
  if (!fine) throw new AppError(404, "Fine not found");
  if (fine.status === "PAID") throw new AppError(400, "Fine already paid");

  // Only the recipient can pay (registered users). Guests use the secure link flow.
  if (userId && fine.recipientUserId && fine.recipientUserId !== userId) {
    throw new AppError(403, "This fine is not yours");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(fine.amount) * 100),
          product_data: { name: `CityFix fine #${fine.id.slice(0, 8)}` },
        },
      },
    ],
    metadata: { fineId: fine.id },
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
  });

  await prisma.payment.create({
    data: {
      fineId: fine.id,
      amount: fine.amount,
      gateway: "STRIPE",
      paymentId: session.id,
      status: "PENDING",
    },
  });

  return { checkoutUrl: session.url };
};

const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const fineId = session.metadata?.fineId;
    if (!fineId) return;

    await prisma.$transaction([
      prisma.payment.update({
        where: { paymentId: session.id },
        data: {
          status: "PAID", // use your actual PaymentStatus value
          transactionRef: session.payment_intent as string,
        },
      }),
      prisma.fine.update({
        where: { id: fineId },
        data: { status: "PAID" },
      }),
    ]);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await prisma.payment.update({
      where: { paymentId: session.id },
      data: { status: "FAILED" },
    });
  }
};

const getPaymentBySession = async (sessionId: string) => {
  return prisma.payment.findUnique({
    where: { paymentId: sessionId },
    include: { fine: true },
  });
};


export const PaymentServices = {
	initiatePayment,
	handleBkashCallback,
	refundFinePayment,
	createStripeCheckout,
  	handleStripeWebhook,
  	getPaymentBySession,
};
