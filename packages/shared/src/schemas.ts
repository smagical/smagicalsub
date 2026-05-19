import { z } from "zod";

export const nodeGroupSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[^,\r\n]+$/, "Group cannot contain comma or newline");

export const createSubscriptionSourceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  url: z.string().trim().url(),
  groups: z.array(nodeGroupSchema).default([]),
  refresh_interval_minutes: z.number().int().min(0).max(10080).default(0),
  enabled: z.boolean().default(true)
});

export type CreateSubscriptionSourceInput = z.infer<typeof createSubscriptionSourceSchema>;

export const updateSubscriptionSourceSchema = createSubscriptionSourceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided"
);

export type UpdateSubscriptionSourceInput = z.infer<typeof updateSubscriptionSourceSchema>;

export const strategyNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[^,\r\n]+$/, "Strategy cannot contain comma or newline");

export const createNodeSchema = z.object({
  uri: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  groups: z.array(nodeGroupSchema).default([]),
  enabled: z.boolean().default(true)
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;

export const importNodesSchema = z.object({
  items: z
    .array(
      z.object({
        line: z.number().int().min(1).max(100000),
        uri: z.string().trim().min(1)
      })
    )
    .min(1)
    .max(500),
  groups: z.array(nodeGroupSchema).default([]),
  enabled: z.boolean().default(true)
});

export type ImportNodesInput = z.infer<typeof importNodesSchema>;

export const updateNodeSchema = z
  .object({
    uri: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    groups: z.array(nodeGroupSchema).optional(),
    enabled: z.boolean().optional(),
    config: z.record(z.unknown()).optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;

export const nodeBatchActionSchema = z
  .object({
    ids: z.array(z.string().trim().min(1)).min(1).max(200),
    action: z.enum(["enable", "disable", "delete", "set-groups", "append-groups"]),
    groups: z.array(nodeGroupSchema).optional()
  })
  .refine(
    (value) => (value.action === "set-groups" ? value.groups !== undefined : value.action !== "append-groups" || Boolean(value.groups?.length)),
    "Groups must be provided for group batch actions, and append-groups requires at least one group"
  );

export type NodeBatchActionInput = z.infer<typeof nodeBatchActionSchema>;

export const createProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).nullable().optional(),
  default_strategy: strategyNameSchema.default("Proxy"),
  enabled: z.boolean().default(true)
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(240).nullable().optional(),
    default_strategy: strategyNameSchema.optional(),
    enabled: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const profileRuleFormatSchema = z.enum(["common", "clash", "sing-box", "xray"]);
const jsonObjectSchema = z.record(z.unknown());

export const createProfileRuleSchema = z.object({
  format: profileRuleFormatSchema.default("common"),
  rule: z.string().trim().min(1).max(4000),
  content: jsonObjectSchema.default({}),
  position: z.number().int().min(0).max(9999).optional(),
  enabled: z.boolean().default(true)
});

export type CreateProfileRuleInput = z.infer<typeof createProfileRuleSchema>;

export const fetchRemoteProfileConfigSchema = z.object({
  url: z.string().trim().url().max(1000)
});

export type FetchRemoteProfileConfigInput = z.infer<typeof fetchRemoteProfileConfigSchema>;

export const updateProfileRuleSchema = z
  .object({
    format: profileRuleFormatSchema.optional(),
    rule: z.string().trim().min(1).max(4000).optional(),
    content: jsonObjectSchema.optional(),
    position: z.number().int().min(0).max(9999).optional(),
    enabled: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export type UpdateProfileRuleInput = z.infer<typeof updateProfileRuleSchema>;

export const profileModuleFormatSchema = profileRuleFormatSchema;
export const profileModuleTypeSchema = z.enum([
  "advanced-override",
  "dns",
  "inbound",
  "tun",
  "policy-group",
  "rule-provider",
  "proxy-provider",
  "observatory"
]);

export const createProfileModuleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  profile_id: z.string().trim().min(1).nullable().optional(),
  format: profileModuleFormatSchema,
  type: profileModuleTypeSchema.default("advanced-override"),
  content: jsonObjectSchema.default({}),
  enabled: z.boolean().default(true),
  is_default: z.boolean().default(false)
});

export type CreateProfileModuleInput = z.infer<typeof createProfileModuleSchema>;

export const updateProfileModuleSchema = createProfileModuleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided"
);

export type UpdateProfileModuleInput = z.infer<typeof updateProfileModuleSchema>;

export const tokenModuleBindingSchema = z.object({
  format: profileModuleFormatSchema,
  type: profileModuleTypeSchema.default("advanced-override"),
  module_id: z.string().trim().min(1)
});

export type TokenModuleBindingInput = z.infer<typeof tokenModuleBindingSchema>;

export const createSubscribeTokenSchema = z.object({
  name: z.string().trim().min(1).max(80),
  profile_id: z.string().trim().min(1).nullable().optional(),
  custom_path: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9_-]+$/).nullable().optional(),
  node_ids: z.array(z.string().trim().min(1)).max(500).default([]),
  module_bindings: z.array(tokenModuleBindingSchema).max(24).default([]),
  enabled: z.boolean().default(true),
  expires_at: z.string().trim().max(32).nullable().optional()
});

export type CreateSubscribeTokenInput = z.infer<typeof createSubscribeTokenSchema>;

export const updateSubscribeTokenSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    profile_id: z.string().trim().min(1).nullable().optional(),
    custom_path: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9_-]+$/).nullable().optional(),
    node_ids: z.array(z.string().trim().min(1)).max(500).optional(),
    module_bindings: z.array(tokenModuleBindingSchema).max(24).optional(),
    enabled: z.boolean().optional(),
    expires_at: z.string().trim().max(32).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export type UpdateSubscribeTokenInput = z.infer<typeof updateSubscribeTokenSchema>;

const titleImageUrlSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().url().max(500).nullable()
);

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(48),
  siteSubtitle: z.string().trim().min(1).max(80),
  titleImageUrl: titleImageUrlSchema,
  loginTitle: z.string().trim().min(1).max(80),
  loginDescription: z.string().trim().min(1).max(180)
});

export const updateSiteSettingsSchema = siteSettingsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided"
);

export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;

export const subscribeTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
  enabled: z.boolean()
});

export type SubscribeToken = z.infer<typeof subscribeTokenSchema>;
