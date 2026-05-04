import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import type { ActiveSubscribeTokenRow, SubscribeTokenRow } from "./token.types";

export async function listSubscribeTokens(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "subscribe_tokens.owner_id") : emptyFilter();
  const result = await db
    .prepare(`${tokenWithProfileSql} WHERE 1 = 1${filter.sql} ORDER BY subscribe_tokens.created_at DESC`)
    .bind(...filter.params)
    .all<SubscribeTokenRow>();
  return (result.results ?? []).map(hydrateSubscribeTokenRow);
}

export async function findActiveSubscribeToken(db: D1Database, path: string) {
  const row = await db.prepare(activeTokenSql).bind(path, path).first<ActiveSubscribeTokenRow>();
  return row ? hydrateSubscribeTokenRow(row) : null;
}

export async function findSubscribeTokenById(db: D1Database, id: string, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "subscribe_tokens.owner_id") : emptyFilter();
  const row = await db
    .prepare(`${tokenWithProfileSql} WHERE subscribe_tokens.id = ?${filter.sql}`)
    .bind(id, ...filter.params)
    .first<SubscribeTokenRow>();
  return row ? hydrateSubscribeTokenRow(row) : null;
}

export async function findSubscribeTokenPathConflict(db: D1Database, path: string, excludingId?: string) {
  const excludeSql = excludingId ? " AND id <> ?2" : "";
  const statement = db.prepare(`SELECT id FROM subscribe_tokens WHERE (token = ?1 OR custom_path = ?1)${excludeSql} LIMIT 1`);
  const row = await (excludingId ? statement.bind(path, excludingId) : statement.bind(path)).first<{ id: string }>();

  return row?.id ?? null;
}

export async function listSubscribeTokenValuesByProfileId(db: D1Database, profileId: string, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "owner_id") : emptyFilter();
  const result = await db
    .prepare(`SELECT token, custom_path FROM subscribe_tokens WHERE profile_id = ?${filter.sql}`)
    .bind(profileId, ...filter.params)
    .all<{ custom_path: string | null; token: string }>();

  return flattenSubscriptionCacheKeys(result.results ?? []);
}

export async function listSubscribeTokenValues(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "owner_id") : emptyFilter();
  const result = await db
    .prepare(`SELECT token, custom_path FROM subscribe_tokens WHERE 1 = 1${filter.sql}`)
    .bind(...filter.params)
    .all<{ custom_path: string | null; token: string }>();
  return flattenSubscriptionCacheKeys(result.results ?? []);
}

const tokenWithProfileSql = `SELECT subscribe_tokens.id,
                                    subscribe_tokens.owner_id,
                                    subscribe_tokens.profile_id,
                                    profiles.name AS profile_name,
                                    subscribe_tokens.token,
                                    subscribe_tokens.custom_path,
                                    subscribe_tokens.node_ids_json,
                                    subscribe_tokens.name,
                                    subscribe_tokens.enabled,
                                    subscribe_tokens.expires_at,
                                    subscribe_tokens.last_used_at,
                                    subscribe_tokens.created_at
                             FROM subscribe_tokens
                             LEFT JOIN profiles ON profiles.id = subscribe_tokens.profile_id`;

const activeTokenSql = `SELECT subscribe_tokens.id,
                              subscribe_tokens.owner_id,
                              subscribe_tokens.token,
                              subscribe_tokens.custom_path,
                              subscribe_tokens.node_ids_json,
                              subscribe_tokens.name,
                              subscribe_tokens.profile_id,
                              profiles.name AS profile_name,
                              profiles.default_strategy AS profile_default_strategy,
                              profiles.enabled AS profile_enabled
                       FROM subscribe_tokens
                       LEFT JOIN profiles ON profiles.id = subscribe_tokens.profile_id
                       WHERE (subscribe_tokens.token = ?1 OR subscribe_tokens.custom_path = ?2)
                         AND subscribe_tokens.enabled = 1
                         AND (subscribe_tokens.expires_at IS NULL OR subscribe_tokens.expires_at > CURRENT_TIMESTAMP)`;

function emptyFilter() {
  return { params: [] as string[], sql: "" };
}

function hydrateSubscribeTokenRow<T extends { node_ids_json: string }>(row: T): T & { node_ids: string[] } {
  return { ...row, node_ids: parseNodeIds(row.node_ids_json) };
}

function parseNodeIds(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function flattenSubscriptionCacheKeys(rows: Array<{ custom_path: string | null; token: string }>) {
  return rows.flatMap((row) => (row.custom_path ? [row.token, row.custom_path] : [row.token]));
}
