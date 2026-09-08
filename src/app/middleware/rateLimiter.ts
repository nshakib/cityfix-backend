// app/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
import httpStatus from "http-status";

export const authLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	limit: 5,
	standardHeaders: true, // adds RateLimit-* headers
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many requests, please try again after a minute.",
		errors: [],
	},
	handler: (req, res) => {
		res.status(httpStatus.TOO_MANY_REQUESTS).json({
			success: false,
			message: "Too many requests, please try again after a minute.",
			errors: [],
		});
	},
});

export const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 100,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		res.status(httpStatus.TOO_MANY_REQUESTS).json({
			success: false,
			message: "Too many requests, please try again after a minute.",
			errors: [],
		});
	},
});