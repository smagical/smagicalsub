import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("user"),
  protected: integer("protected").notNull().default(0),
  passwordHash: text("password_hash"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const subscriptionSources = sqliteTable("subscription_sources", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  groups: text("groups").notNull().default("[]"),
  enabled: integer("enabled").notNull().default(1),
  refreshIntervalMinutes: integer("refresh_interval_minutes").notNull().default(0),
  nextRefreshAt: text("next_refresh_at"),
  lastStatus: text("last_status"),
  lastError: text("last_error"),
  lastFetchedAt: text("last_fetched_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  sourceId: text("source_id").references(() => subscriptionSources.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  protocol: text("protocol").notNull(),
  server: text("server"),
  port: integer("port"),
  tags: text("tags").notNull().default("[]"),
  configJson: text("config_json").notNull(),
  manual: integer("manual").notNull().default(0),
  enabled: integer("enabled").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const nodeSources = sqliteTable(
  "node_sources",
  {
    nodeId: text("node_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
    sourceId: text("source_id").notNull().references(() => subscriptionSources.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.nodeId, table.sourceId] })
  })
);

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  defaultStrategy: text("default_strategy").notNull().default("Proxy"),
  enabled: integer("enabled").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const profileRules = sqliteTable("profile_rules", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  format: text("format").notNull().default("common"),
  rule: text("rule").notNull(),
  contentJson: text("content_json").notNull().default("{}"),
  enabled: integer("enabled").notNull().default(1)
});

export const profileModules = sqliteTable("profile_modules", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
  profileId: text("profile_id").references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  format: text("format").notNull(),
  type: text("type").notNull().default("advanced-override"),
  contentJson: text("content_json").notNull().default("{}"),
  enabled: integer("enabled").notNull().default(1),
  isDefault: integer("is_default").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const subscribeTokens = sqliteTable("subscribe_tokens", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
  profileId: text("profile_id").references(() => profiles.id, { onDelete: "set null" }),
  token: text("token").notNull().unique(),
  customPath: text("custom_path").unique(),
  nodeIdsJson: text("node_ids_json").notNull().default("[]"),
  name: text("name").notNull(),
  enabled: integer("enabled").notNull().default(1),
  expiresAt: text("expires_at"),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const subscribeTokenModules = sqliteTable("subscribe_token_modules", {
  tokenId: text("token_id").notNull().references(() => subscribeTokens.id, { onDelete: "cascade" }),
  moduleId: text("module_id").notNull().references(() => profileModules.id, { onDelete: "cascade" }),
  format: text("format").notNull(),
  type: text("type").notNull().default("advanced-override")
});

export const refreshJobs = sqliteTable("refresh_jobs", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").references(() => subscriptionSources.id, { onDelete: "set null" }),
  status: text("status").notNull(),
  message: text("message"),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  finishedAt: text("finished_at")
});

export const accessLogs = sqliteTable("access_logs", {
  id: text("id").primaryKey(),
  tokenId: text("token_id").references(() => subscribeTokens.id, { onDelete: "set null" }),
  path: text("path").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
