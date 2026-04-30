import type { CreateSubscriptionSourceInput } from "@smagicalsub/shared";
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

