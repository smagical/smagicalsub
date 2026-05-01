import type { CreateSubscriptionSourceInput, UpdateSubscriptionSourceInput } from "@smagicalsub/shared";
import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import type { SourceRow } from "./source.types";

export async function listSources(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : { params: [] as string[], sql: "" };
  const result = await db
    .prepare(
      `SELECT id, owner_id, name, url, enabled, last_status, last_error, last_fetched_at, created_at, updated_at
       FROM subscription_sources
       WHERE 1 = 1${filter.sql}
       ORDER BY created_at DESC`
    )
    .bind(...filter.params)
    .all<SourceRow>();

  return result.results ?? [];
}

export async function listEnabledSourceIds(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : { params: [] as string[], sql: "" };
  const result = await db
    .prepare(
      `SELECT id
       FROM subscription_sources
       WHERE enabled = 1${filter.sql}
       ORDER BY created_at DESC`
    )
    .bind(...filter.params)
    .all<{ id: string }>();

  return (result.results ?? []).map((row) => row.id);
}

export async function findSourceById(db: D1Database, id: string, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "owner_id") : { params: [] as string[], sql: "" };
  return db
    .prepare(
      `SELECT id, owner_id, name, url, enabled, last_status, last_error, last_fetched_at, created_at, updated_at
       FROM subscription_sources
       WHERE id = ?${filter.sql}`
    )
    .bind(id, ...filter.params)
    .first<SourceRow>();
}

export async function createSource(db: D1Database, input: CreateSubscriptionSourceInput, ownerId: string | null = null) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO subscription_sources (id, owner_id, name, url, enabled)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .bind(id, ownerId, input.name, input.url, input.enabled ? 1 : 0)
    .run();

  return findSourceById(db, id);
}

export async function updateSource(db: D1Database, id: string, input: UpdateSubscriptionSourceInput, scope?: OwnerScope) {
  const current = await findSourceById(db, id, scope);

  if (!current) {
    return null;
  }

  const next = {
    name: input.name ?? current.name,
    url: input.url ?? current.url,
    enabled: input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0
  };

  await db
    .prepare(
      `UPDATE subscription_sources
       SET name = ?1, url = ?2, enabled = ?3, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?4`
    )
    .bind(next.name, next.url, next.enabled, id)
    .run();

  return findSourceById(db, id, scope);
}

export async function deleteSource(db: D1Database, id: string, scope?: OwnerScope) {
  const current = await findSourceById(db, id, scope);

  if (!current) {
    return false;
  }

  // 显式删除源节点，避免外键级联在不同 D1/SQLite 执行环境中未启用时留下孤儿节点。
  await db.batch([
    db.prepare(`DELETE FROM nodes WHERE source_id = ?1`).bind(id),
    db.prepare(`DELETE FROM subscription_sources WHERE id = ?1`).bind(id)
  ]);

  return true;
}
