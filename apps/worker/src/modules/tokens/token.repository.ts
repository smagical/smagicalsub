import type { CreateSubscribeTokenInput, UpdateSubscribeTokenInput } from "@smagicalsub/shared";
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

export async function findSubscribeTokenById(db: D1Database, id: string) {
  return db
    .prepare(
      `SELECT id, owner_id, profile_id, token, name, enabled, expires_at, last_used_at, created_at
       FROM subscribe_tokens
       WHERE id = ?1`
    )
    .bind(id)
    .first<SubscribeTokenRow>();
}

export async function createSubscribeToken(db: D1Database, input: CreateSubscribeTokenInput) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO subscribe_tokens (id, owner_id, profile_id, token, name, enabled, expires_at)
       VALUES (?1, NULL, NULL, ?2, ?3, ?4, ?5)`
    )
    .bind(id, generateSubscribeToken(), input.name, input.enabled ? 1 : 0, normalizeExpiresAt(input.expires_at))
    .run();

  return findSubscribeTokenById(db, id);
}

export async function updateSubscribeToken(db: D1Database, id: string, input: UpdateSubscribeTokenInput) {
  const current = await findSubscribeTokenById(db, id);

  if (!current) {
    return null;
  }

  await db
    .prepare(
      `UPDATE subscribe_tokens
       SET name = ?1,
           enabled = ?2,
           expires_at = ?3
       WHERE id = ?4`
    )
    .bind(
      input.name ?? current.name,
      input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0,
      input.expires_at === undefined ? current.expires_at : normalizeExpiresAt(input.expires_at),
      id
    )
    .run();

  return findSubscribeTokenById(db, id);
}

export async function resetSubscribeToken(db: D1Database, id: string) {
  const current = await findSubscribeTokenById(db, id);

  if (!current) {
    return null;
  }

  await db
    .prepare(
      `UPDATE subscribe_tokens
       SET token = ?1,
           last_used_at = NULL
       WHERE id = ?2`
    )
    .bind(generateSubscribeToken(), id)
    .run();

  return {
    oldToken: current.token,
    token: await findSubscribeTokenById(db, id)
  };
}

export async function deleteSubscribeToken(db: D1Database, id: string) {
  const current = await findSubscribeTokenById(db, id);

  if (!current) {
    return null;
  }

  await db.prepare(`DELETE FROM subscribe_tokens WHERE id = ?1`).bind(id).run();
  return current;
}

export function markSubscribeTokenUsed(db: D1Database, id: string) {
  return db.prepare(`UPDATE subscribe_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?1`).bind(id).run();
}

function generateSubscribeToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return `sub_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
}

function normalizeExpiresAt(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  // datetime-local 输入不带秒和时区，D1 用 CURRENT_TIMESTAMP 文本比较时补齐到秒。
  const normalized = value.trim().replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}
