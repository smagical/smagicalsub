import type { CreateProfileInput, UpdateProfileInput } from "@smagicalsub/shared";
import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import type { ProfileRow } from "./profile.types";

export async function listProfiles(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : { params: [] as string[], sql: "" };
  const result = await db
    .prepare(
      `SELECT id, owner_id, name, description, default_strategy, enabled, created_at, updated_at
       FROM profiles
       WHERE 1 = 1${filter.sql}
       ORDER BY created_at DESC`
    )
    .bind(...filter.params)
    .all<ProfileRow>();

  return result.results ?? [];
}

export async function findProfileById(db: D1Database, id: string, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : { params: [] as string[], sql: "" };
  return db
    .prepare(
      `SELECT id, owner_id, name, description, default_strategy, enabled, created_at, updated_at
       FROM profiles
       WHERE id = ?${filter.sql}`
    )
    .bind(id, ...filter.params)
    .first<ProfileRow>();
}

export async function createProfile(db: D1Database, input: CreateProfileInput, ownerId: string | null = null) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO profiles (id, owner_id, name, description, default_strategy, enabled)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(id, ownerId, input.name, normalizeNullableText(input.description), input.default_strategy, input.enabled ? 1 : 0)
    .run();

  return findProfileById(db, id);
}

export async function updateProfile(db: D1Database, id: string, input: UpdateProfileInput, scope?: OwnerScope) {
  const current = await findProfileById(db, id, scope);

  if (!current) {
    return null;
  }

  await db
    .prepare(
      `UPDATE profiles
       SET name = ?1,
           description = ?2,
           default_strategy = ?3,
           enabled = ?4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?5`
    )
    .bind(
      input.name ?? current.name,
      input.description === undefined ? current.description : normalizeNullableText(input.description),
      input.default_strategy ?? current.default_strategy,
      input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0,
      id
    )
    .run();

  return findProfileById(db, id, scope);
}

export async function deleteProfile(db: D1Database, id: string, scope?: OwnerScope) {
  const current = await findProfileById(db, id, scope);

  if (!current) {
    return false;
  }

  // D1/SQLite 外键约束在不同执行环境中可能配置不同，这里显式解绑令牌并清理规则。
  await db.batch([
    db.prepare(`DELETE FROM profile_rules WHERE profile_id = ?1`).bind(id),
    db.prepare(`UPDATE subscribe_tokens SET profile_id = NULL WHERE profile_id = ?1`).bind(id),
    db.prepare(`DELETE FROM profiles WHERE id = ?1`).bind(id)
  ]);

  return true;
}

function normalizeNullableText(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  return value.trim();
}
