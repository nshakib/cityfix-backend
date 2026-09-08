import { z } from "zod";

// 1. Citizen Registration
// Note: We expect a flat body from Postman, so we validate name/email/pass at root
// and phone/address inside a 'citizen' object if that's how your service expects it.
const CitizenRegistrationZodSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long.")
      .max(100, "Name cannot exceed 100 characters."),

    email: z.string().email("Invalid email address."), // ✅ Fixed: z.string().email()

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

    // If your service expects nested data:
    citizen: z
      .object({
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
      
    // If your service expects flat data, move these up:
    // phone: z.string().optional(),
    // address: z.string().optional(),
  }),
});

// 2. Email Verification
const CitizenEmailVerifyZodSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address."), // ✅ Fixed
    otp: z.string().length(6, "OTP must be exactly 6 characters."),
  }),
});

// 3. Login
export const LoginZodSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

// 4. Forgot Password
const ForgotPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address."), // ✅ Fixed
  }),
});

// 5. Reset Password
const ResetPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address."), // ✅ Fixed
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
  }),
});

export const UserValidation = {
  CitizenRegistrationZodSchema,
  CitizenEmailVerifyZodSchema,
  LoginZodSchema,
  ForgotPasswordZodSchema,
  ResetPasswordZodSchema,
};