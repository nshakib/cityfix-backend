import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { ZodObject } from "zod";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: ZodObject) => {
	return catchAsync((req: Request, _res: Response, next: NextFunction) => {
		const result = zodSchema.safeParse({
			body: req.body ?? {},
			query: req.query ?? {},
			params: req.params ?? {},
		});

		if (!result.success) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				result.error.issues[0].message,
			);
		}

		const data = result.data as {
			body?: unknown;
			query?: unknown;
			params?: unknown;
		};

		if (data.body !== undefined) req.body = data.body;
		if (data.params !== undefined) {
			req.params = data.params as typeof req.params;
		}
		if (data.query !== undefined) {
			// Express 5: req.query is a getter, so redefine it instead of assigning
			Object.defineProperty(req, "query", {
				value: data.query,
				writable: true,
				configurable: true,
				enumerable: true,
			});
		}

		next();
	});
};
