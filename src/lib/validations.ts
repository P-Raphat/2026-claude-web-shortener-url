import { z } from "zod";

export const createUrlSchema = z.object({
  originalUrl: z.url("Must be a valid URL"),
  shortCode: z
    .string()
    .min(3, "Min 3 characters")
    .max(20, "Max 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens and underscores")
    .optional(),
  title: z.string().max(255).optional(),
  expiresAt: z.iso.datetime().optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
