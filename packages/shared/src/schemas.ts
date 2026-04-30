import { z } from "zod";

export const createSubscriptionSourceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  url: z.string().trim().url(),
  enabled: z.boolean().default(true)
});

export type CreateSubscriptionSourceInput = z.infer<typeof createSubscriptionSourceSchema>;

export const updateSubscriptionSourceSchema = createSubscriptionSourceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided"
);

export type UpdateSubscriptionSourceInput = z.infer<typeof updateSubscriptionSourceSchema>;

export const nodeGroupSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[^,\r\n]+$/, "Group cannot contain comma or newline");

export const createNodeSchema = z.object({
  uri: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  groups: z.array(nodeGroupSchema).default([]),
  enabled: z.boolean().default(true)
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;

export const updateNodeSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    groups: z.array(nodeGroupSchema).optional(),
    enabled: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;

export const subscribeTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
  enabled: z.boolean()
});

export type SubscribeToken = z.infer<typeof subscribeTokenSchema>;
