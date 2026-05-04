import type { CreateSubscribeTokenInput, UpdateSubscribeTokenInput } from "@smagicalsub/shared";
import type { OwnerScope } from "../../lib/auth-scope";
import { findSubscribeTokenById } from "./token-reader.repository";

export {
  findActiveSubscribeToken,
  findSubscribeTokenById,
  findSubscribeTokenPathConflict,
  listSubscribeTokens,
  listSubscribeTokenValues,
  listSubscribeTokenValuesByProfileId
} from "./token-reader.repository";

export async function createSubscribeToken(db: D1Database, input: CreateSubscribeTokenInput, ownerId: string | null = null) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO subscribe_tokens (id, owner_id, profile_id, token, custom_path, node_ids_json, name, enabled, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(
      id,
      ownerId,
      normalizeProfileId(input.profile_id),
      generateSubscribeToken(),
      normalizeCustomPath(input.custom_path),
      normalizeNodeIds(input.node_ids),
      input.name,
      input.enabled ? 1 : 0,
      normalizeExpiresAt(input.expires_at)
    )
    .run();

  return findSubscribeTokenById(db, id);
}

export async function updateSubscribeToken(db: D1Database, id: string, input: UpdateSubscribeTokenInput, scope?: OwnerScope) {
  const current = await findSubscribeTokenById(db, id, scope);

  if (!current) {
    return null;
  }

  await db
    .prepare(
      `UPDATE subscribe_tokens
       SET name = ?1,
           profile_id = ?2,
           custom_path = ?3,
           node_ids_json = ?4,
           enabled = ?5,
           expires_at = ?6
       WHERE id = ?7`
    )
    .bind(
      input.name ?? current.name,
      input.profile_id === undefined ? current.profile_id : normalizeProfileId(input.profile_id),
      input.custom_path === undefined ? current.custom_path : normalizeCustomPath(input.custom_path),
      input.node_ids === undefined ? current.node_ids_json : normalizeNodeIds(input.node_ids),
      input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0,
      input.expires_at === undefined ? current.expires_at : normalizeExpiresAt(input.expires_at),
      id
    )
    .run();

  return findSubscribeTokenById(db, id, scope);
}

function normalizeCustomPath(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  return value.trim();
}

function normalizeNodeIds(value: string[] | undefined) {
  return JSON.stringify(Array.from(new Set(value ?? [])));
}

export async function resetSubscribeToken(db: D1Database, id: string, scope?: OwnerScope) {
  const current = await findSubscribeTokenById(db, id, scope);

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
    oldCustomPath: current.custom_path,
    token: await findSubscribeTokenById(db, id, scope)
  };
}

export async function deleteSubscribeToken(db: D1Database, id: string, scope?: OwnerScope) {
  const current = await findSubscribeTokenById(db, id, scope);

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

function normalizeProfileId(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  return value.trim();
}

function normalizeExpiresAt(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  // datetime-local 输入不带秒和时区，D1 用 CURRENT_TIMESTAMP 文本比较时补齐到秒。
  const normalized = value.trim().replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}
