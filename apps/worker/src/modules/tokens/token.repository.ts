import type { ActiveSubscribeTokenRow, SubscribeTokenRow } from "./token.types";

export async function listSubscribeTokens(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, owner_id, profile_id, token, name, enabled, expires_at, last_used_at, created_at
       FROM subscribe_tokens
       ORDER BY created_at DESC`
    )
    .all<SubscribeTokenRow>();

  return result.results ?? [];
}

export async function findActiveSubscribeToken(db: D1Database, token: string) {
  return db
    .prepare(
      `SELECT id, token, name, profile_id
       FROM subscribe_tokens
       WHERE token = ?1
         AND enabled = 1
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`
    )
    .bind(token)
    .first<ActiveSubscribeTokenRow>();
}

