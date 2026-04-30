import type { CreateSubscriptionSourceInput, UpdateSubscriptionSourceInput } from "@smagicalsub/shared";
import type { ParsedNode } from "@smagicalsub/clash";
import type { SourceRow } from "./source.types";

export type InsertNodeInput = ParsedNode & {
  sourceId: string;
};

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

export async function createRefreshJob(db: D1Database, sourceId: string) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO refresh_jobs (id, source_id, status)
       VALUES (?1, ?2, 'running')`
    )
    .bind(id, sourceId)
    .run();

  return id;
}

export async function markRefreshJobFinished(db: D1Database, id: string, status: "success" | "failed", message?: string) {
  await db
    .prepare(
      `UPDATE refresh_jobs
       SET status = ?1, message = ?2, finished_at = CURRENT_TIMESTAMP
       WHERE id = ?3`
    )
    .bind(status, message ?? null, id)
    .run();
}

export async function markSourceRefreshStatus(
  db: D1Database,
  id: string,
  status: "success" | "failed",
  error?: string
) {
  await db
    .prepare(
      `UPDATE subscription_sources
       SET last_status = ?1,
           last_error = ?2,
           last_fetched_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?3`
    )
    .bind(status, error ?? null, id)
    .run();
}

export async function replaceSourceNodes(db: D1Database, sourceId: string, nodes: ParsedNode[]) {
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM nodes WHERE source_id = ?1`).bind(sourceId)
  ];

  for (const node of dedupeNodes(nodes)) {
    statements.push(
      db
        .prepare(
          `INSERT INTO nodes (id, source_id, name, protocol, server, port, tags, config_json, enabled)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)`
        )
        .bind(
          crypto.randomUUID(),
          sourceId,
          node.name,
          node.protocol,
          node.server ?? null,
          node.port ?? null,
          "[]",
          JSON.stringify(node.config)
        )
    );
  }

  await db.batch(statements);
  return statements.length - 1;
}

function dedupeNodes(nodes: ParsedNode[]) {
  const seen = new Set<string>();
  const unique: ParsedNode[] = [];

  for (const node of nodes) {
    const key = `${node.protocol}:${node.server ?? ""}:${node.port ?? ""}:${node.name}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(node);
    }
  }

  return unique;
}
