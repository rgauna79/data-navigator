import { z } from "zod";

export const registrationSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(3, { message: "Name must be at least 3 characters long" }),
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export const updateUserSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(3, { message: "Name must be at least 3 characters long" })
    .optional(),
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email address" })
    .optional(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters long" })
    .optional(),
});
