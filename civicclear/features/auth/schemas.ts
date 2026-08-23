import { z } from "zod";
import { emptyToUndefined } from "@/features/auth/otp";

/** Universal email + password for students, coordinators, and admins. */
export const passwordLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** @deprecated Use passwordLoginSchema — kept for older call sites. */
export const citizenPasswordLoginSchema = passwordLoginSchema;

/** @deprecated Use passwordLoginSchema */
export const officialLoginSchema = passwordLoginSchema.extend({
  portal: z.string().optional(),
});

export const citizenEmailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const citizenOtpVerifySchema = z.object({
  email: z.string().email("Enter a valid email"),
  code: z
    .string()
    .transform((v) => v.replace(/\D/g, "").trim())
    .pipe(z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email")),
  name: z.preprocess(
    emptyToUndefined,
    z.string().min(2, "Enter your full name").max(80).optional(),
  ),
  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number")
      .optional(),
  ),
  password: z.preprocess(
    emptyToUndefined,
    z.string().min(8, "Password must be at least 8 characters").optional(),
  ),
});

/** Used by Auth.js after OTP was verified server-side. */
export const citizenOtpProofSchema = z.object({
  email: z.string().email("Enter a valid email"),
  proof: z.string().min(20, "Missing login proof"),
});

export const registerCitizenSchema = z
  .object({
    name: z.string().min(2, "Enter your full name").max(80),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createOfficialSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const staffSetupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    code: z
      .string()
      .transform((v) => v.replace(/\D/g, "").trim())
      .pipe(
        z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
      ),
    name: z.string().min(2, "Enter your full name").max(80),
    phone: z.string().regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createStudentSchema = z.object({
  name: z.string().min(2, "Enter the student’s full name").max(80),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const deleteManagedUserSchema = z.object({
  userId: z.string().min(1),
});

export function homePathForRole(role?: string | null) {
  if (role === "citizen") return "/dashboard";
  if (role === "official") return "/queue";
  if (role === "admin") return "/admin";
  return "/";
}
