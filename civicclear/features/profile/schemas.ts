import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(80),
  phone: z.string().regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number"),
});

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
