import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

const passwordSchema = z.string().min(8).max(128);

export const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(128)
});

export type LoginInput = z.infer<typeof loginSchema>;

export const bootstrapAdminSchema = z.object({
  email: z.string().trim().email().max(160),
  name: z.string().trim().min(1).max(80),
  password: passwordSchema,
  bootstrapToken: z.string().trim().max(200).optional()
});

export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;

export const createUserSchema = z.object({
  email: z.string().trim().email().max(160),
  name: z.string().trim().min(1).max(80),
  password: passwordSchema,
  role: userRoleSchema.default("user")
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    email: z.string().trim().email().max(160).optional(),
    name: z.string().trim().min(1).max(80).optional(),
    password: passwordSchema.optional(),
    role: userRoleSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
