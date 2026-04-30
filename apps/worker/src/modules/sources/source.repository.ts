import type { CreateSubscriptionSourceInput, UpdateSubscriptionSourceInput } from "@smagicalsub/shared";
import type { SourceRow } from "./source.types";

export async function listSources(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, name, url, enabled, last_status, last_error, last_fetched_at, created_at, updated_at
       FROM subscription_sources
       ORDER BY created_at DESC`
    )
    .all<SourceRow>();

  return result.results ?? [];
}

export async function findSourceById(db: D1Database, id: string) {
  return db
    .prepare(
      `SELECT id, name, url, enabled, last_status, last_error, last_fetched_at, created_at, updated_at
       FROM subscription_sources
       WHERE id = ?1`
    )
    .bind(id)
    .first<SourceRow>();
}

export async function createSource(db: D1Database, input: CreateSubscriptionSourceInput) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO subscription_sources (id, name, url, enabled)
       VALUES (?1, ?2, ?3, ?4)`
    )
    .bind(id, input.name, input.url, input.enabled ? 1 : 0)
    .run();

  return {
    id,
    ...input
  };
}

export async function updateSource(db: D1Database, id: string, input: UpdateSubscriptionSourceInput) {
  const current = await findSourceById(db, id);

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

  return findSourceById(db, id);
}

export async function deleteSource(db: D1Database, id: string) {
  const result = await db.prepare(`DELETE FROM subscription_sources WHERE id = ?1`).bind(id).run();
  return result.meta.changes > 0;
}
