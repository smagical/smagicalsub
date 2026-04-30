import type { ActiveSubscribeTokenRow, SubscribeTokenRow } from "./token.types";

export async function listSubscribeTokens(db: D1Database) {
  const result = await db.prepare(listTokensSql).all<SubscribeTokenRow>();
  return result.results ?? [];
}

export async function findActiveSubscribeToken(db: D1Database, token: string) {
  return db.prepare(activeTokenSql).bind(token).first<ActiveSubscribeTokenRow>();
}

export async function findSubscribeTokenById(db: D1Database, id: string) {
  return db.prepare(`${tokenWithProfileSql} WHERE subscribe_tokens.id = ?1`).bind(id).first<SubscribeTokenRow>();
}

export async function listSubscribeTokenValuesByProfileId(db: D1Database, profileId: string) {
  const result = await db
    .prepare(`SELECT token FROM subscribe_tokens WHERE profile_id = ?1`)
    .bind(profileId)
    .all<{ token: string }>();

  return (result.results ?? []).map((row) => row.token);
}

export async function listSubscribeTokenValues(db: D1Database) {
  const result = await db.prepare(`SELECT token FROM subscribe_tokens`).all<{ token: string }>();
  return (result.results ?? []).map((row) => row.token);
}

const tokenWithProfileSql = `SELECT subscribe_tokens.id,
                                    subscribe_tokens.owner_id,
                                    subscribe_tokens.profile_id,
                                    profiles.name AS profile_name,
                                    subscribe_tokens.token,
                                    subscribe_tokens.name,
                                    subscribe_tokens.enabled,
                                    subscribe_tokens.expires_at,
                                    subscribe_tokens.last_used_at,
                                    subscribe_tokens.created_at
                             FROM subscribe_tokens
                             LEFT JOIN profiles ON profiles.id = subscribe_tokens.profile_id`;

const listTokensSql = `${tokenWithProfileSql} ORDER BY subscribe_tokens.created_at DESC`;

const activeTokenSql = `SELECT subscribe_tokens.id,
                              subscribe_tokens.token,
                              subscribe_tokens.name,
                              subscribe_tokens.profile_id,
                              profiles.name AS profile_name,
                              profiles.default_strategy AS profile_default_strategy,
                              profiles.enabled AS profile_enabled
                       FROM subscribe_tokens
                       LEFT JOIN profiles ON profiles.id = subscribe_tokens.profile_id
                       WHERE subscribe_tokens.token = ?1
                         AND subscribe_tokens.enabled = 1
                         AND (subscribe_tokens.expires_at IS NULL OR subscribe_tokens.expires_at > CURRENT_TIMESTAMP)`;
