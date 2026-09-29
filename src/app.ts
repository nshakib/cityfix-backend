import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { UserRoutes } from "./app/module/user/user.route";
import { CategoryRoutes } from "./app/module/category/category.route";
import { DepartmentRoutes } from "./app/module/department/department.route";
import { ComplaintRoutes } from "./app/module/complaint/complaint.route";
import { FineRoutes } from "./app/module/fine/fine.route";
import { PaymentRoutes } from "./app/module/payment/payment.route";
import helmet from "helmet";
import { apiLimiter, authLimiter } from "./app/middleware/rateLimiter";
import { NotificationRoutes } from "./app/module/notification/notification.route";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);




// ...existing middleware...
app.use(cookieParser());

// apply the stricter limiter to auth first...
app.use("/api/v1/auth", authLimiter, AuthRoutes);

app.use("/api/v1/user", apiLimiter, UserRoutes);
app.use("/api/v1/categories", apiLimiter, CategoryRoutes);
app.use("/api/v1/departments", apiLimiter, DepartmentRoutes);
app.use("/api/v1/complaints", apiLimiter, ComplaintRoutes);
app.use("/api/v1/fines", apiLimiter, FineRoutes);
app.use("/api/v1/payments", apiLimiter, PaymentRoutes);
app.use("/api/v1/notifications", apiLimiter, NotificationRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "CityFix — City Complaint & Service Management Platform Backend",
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
