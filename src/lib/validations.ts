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
  password: z.string().min(8),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export const updateUrlSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.iso.datetime().nullable().optional(),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
