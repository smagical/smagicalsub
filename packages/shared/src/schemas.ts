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

export const subscribeTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
  enabled: z.boolean()
});

export type SubscribeToken = z.infer<typeof subscribeTokenSchema>;
