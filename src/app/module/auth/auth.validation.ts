import z from "zod";

const CitizenRegistrationZodSchema = z.object({
	name: z
		.string("Name must be a string.")
		.min(3, "Name must be at least 3 characters long.")
		.max(100, "Name cannot exceed 100 characters."),

	email: z.email("Invalid email address."),

	password: z
		.string()
		.min(8, "Password must be at least 8 characters long.")
		.regex(/[a-z]/, "Password must contain at least 1 lowercase letter.")
		.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter.")
		.regex(/[0-9]/, "Password must contain at least 1 number.")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least 1 special character.",
		),

	citizen: z
		.object({
			phone: z.string().optional(),
			address: z.string().optional(),
		})
		.optional(),
});

const CitizenEmailVerifyZodSchema = z.object({
	email: z.email("Invalid email address."),
	otp: z.string().length(6, "OTP must be exactly 6 characters."),
});

const LoginZodSchema = z.object({
	email: z.email("Invalid email address."),

	password: z
		.string()
		.min(8, "Password must be at least 8 characters long.")
		.regex(/[a-z]/, "Password must contain at least 1 lowercase letter.")
		.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter.")
		.regex(/[0-9]/, "Password must contain at least 1 number.")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least 1 special character.",
		),
});

const ForgotPasswordZodSchema = z.object({
	email: z.email("Invalid email address."),
});

const ResetPasswordZodSchema = z.object({
	email: z.email("Invalid email address."),

	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters long.")
		.regex(/[a-z]/, "Password must contain at least 1 lowercase letter.")
		.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter.")
		.regex(/[0-9]/, "Password must contain at least 1 number.")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least 1 special character.",
		),

	otp: z.string().length(6, "OTP must be exactly 6 characters."),
});

export const UserValidation = {
	CitizenRegistrationZodSchema,
	CitizenEmailVerifyZodSchema,
	LoginZodSchema,
	ForgotPasswordZodSchema,
	ResetPasswordZodSchema,
};
