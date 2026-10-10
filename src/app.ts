import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import helmet from "helmet";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { apiLimiter, authLimiter } from "./app/middleware/rateLimiter";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { CategoryRoutes } from "./app/module/category/category.route";
import { ComplaintRoutes } from "./app/module/complaint/complaint.route";
import { DepartmentRoutes } from "./app/module/department/department.route";
import { FineRoutes } from "./app/module/fine/fine.route";
import { NotificationRoutes } from "./app/module/notification/notification.route";
import { PaymentController } from "./app/module/payment/payment.controller";
import { PaymentRoutes } from "./app/module/payment/payment.route";
import { UserRoutes } from "./app/module/user/user.route";

const app: Application = express();

const allowedOrigins = [config.frontend_url, "http://localhost:3000"].filter(
	Boolean,
);

// trust proxy so the rate limiter reads the real client IP on Vercel
app.set("trust proxy", 1);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	}),
);

// Stripe webhook: must come BEFORE express.json() so the body stays raw
// (needed for signature verification). Not rate-limited on purpose.
app.post(
	"/api/v1/payments/stripe/webhook",
	express.raw({ type: "application/json" }),
	PaymentController.stripeWebhook,
);

// Security headers and body/cookie parsers
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Stricter limiter on auth
app.use("/api/v1/auth", authLimiter, AuthRoutes);

app.use("/api/v1/user", apiLimiter, UserRoutes);
app.use("/api/v1/categories", apiLimiter, CategoryRoutes);
app.use("/api/v1/departments", apiLimiter, DepartmentRoutes);
app.use("/api/v1/complaints", apiLimiter, ComplaintRoutes);
app.use("/api/v1/fines", apiLimiter, FineRoutes);
app.use("/api/v1/payments", apiLimiter, PaymentRoutes);
app.use("/api/v1/notifications", apiLimiter, NotificationRoutes);

// Basic route
app.get("/", async (_req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "CityFix — City Complaint & Service Management Platform Backend",
	});
});

// 404 first, then the global error handler last
app.use(notFound);
app.use(globalErrorHandler);

export default app;