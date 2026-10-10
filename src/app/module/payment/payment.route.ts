// payment.route.ts
import express from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { PaymentController } from "./payment.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createPaymentSchema, createStripeCheckoutSchema } from "./payment.validation";

const router = express.Router();

router.post(
	"/fines/:fineId/pay",
	auth(Role.CITIZEN),
	validateRequest(createPaymentSchema),
	PaymentController.initiatePayment,
);

// No auth — bKash's server calls this directly, not an authenticated user
router.get("/bkash/callback", PaymentController.bkashCallback);

router.post(
	"/fines/:fineId/refund",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	PaymentController.refundFine,
);

router.post(
  "/stripe/checkout",
  auth("CITIZEN"),
  validateRequest(createStripeCheckoutSchema),
  PaymentController.createStripeCheckout
);

router.get(
  "/stripe/status/:sessionId",
  auth("CITIZEN", "STAFF", "ADMIN", "SUPER_ADMIN"),
  PaymentController.getPaymentStatus
);

export const PaymentRoutes = router;
