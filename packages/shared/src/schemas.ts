import { z } from "zod";

export const createSubscriptionSourceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  url: z.string().trim().url(),
  enabled: z.boolean().default(true)
});

export type CreateSubscriptionSourceInput = z.infer<typeof createSubscriptionSourceSchema>;

export const subscribeTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
  enabled: z.boolean()
});

export type SubscribeToken = z.infer<typeof subscribeTokenSchema>;

