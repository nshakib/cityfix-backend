import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import config from "../config";
import { AppError } from "../utils/AppError";
import { ZodError } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export const globalErrorHandler = async (
	err: any,
	req: Request, // Changed from _req to req for logging context
	res: Response,
	_next: NextFunction,
) => {
	// 📝 ALWAYS log the full error server-side (even in production)
	console.error("UNHANDLED:", err);
	console.error("❌ Global Error Handler:", {
		message: err.message,
		name: err.name,
		stack: err.stack,
		path: req.path,
		method: req.method,
		query: req.query,
		body: req.body,
		user: req.user?.userId || "unauthenticated",
		timestamp: new Date().toISOString(),
	});

	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let errorMessage = err.message || "Internal Server Error";
	const errorName = err.name || "Internal Server Error";

	let message: string = err.message || "Internal Server Error";
	let errorSources: { path: string | number; message: string }[] = [];

	// 1. Handle Custom AppError FIRST
	if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		errorMessage = err.message;
		errorSources = [{ path: "", message: err.message }];
	}
	// 2. Handle Zod Validation Errors
	else if (err instanceof ZodError) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "Validation Error";
		errorMessage = "Validation Error";
		errorSources = err.issues.map((issue) => ({
			path:
				issue.path.length > 0 ? String(issue.path[issue.path.length - 1]) : "",
			message: issue.message,
		}));
	}
	// 3. Handle Prisma Errors
	else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorMessage = "Invalid data provided";
		message = errorMessage;
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			statusCode = httpStatus.BAD_REQUEST;
			errorMessage = "Duplicate entry";
		} else if (err.code === "P2003") {
			statusCode = httpStatus.BAD_REQUEST;
			errorMessage = "Invalid reference";
		} else if (err.code === "P2025") {
			statusCode = httpStatus.NOT_FOUND;
			errorMessage = "Record not found";
		}
		message = errorMessage;
	} else if (err instanceof Prisma.PrismaClientInitializationError) {
		statusCode = httpStatus.SERVICE_UNAVAILABLE;
		errorMessage = "Database connection failed";
		message = errorMessage;
	} else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		errorMessage = "Database query failed";
		message = errorMessage;
	} else if (err instanceof Error) {
		errorMessage = err.message;
		message = err.message;
	}

	// ✅ Send appropriate status code (not always 500)
	res.status(statusCode).json({
		success: false,
		statusCode: statusCode,
		message:
			config.node_env === "development"
				? errorMessage
				: "Something went wrong", // Generic message for production
		errorSources: config.node_env === "development" ? errorSources : undefined,
		// Never expose stack or error details in production
	});
};
