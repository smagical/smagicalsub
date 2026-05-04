import type { CreateSubscriptionSourceInput, SourceDto, UpdateSubscriptionSourceInput } from "@smagicalsub/shared";
import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import type { SourceRow } from "./source.types";

export async function listSources(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : { params: [] as string[], sql: "" };
  const result = await db
    .prepare(
      `SELECT id, owner_id, name, url, groups, enabled, refresh_interval_minutes, next_refresh_at, last_status, last_error, last_fetched_at, created_at, updated_at
       FROM subscription_sources
       WHERE 1 = 1${filter.sql}
       ORDER BY created_at DESC`
    )
    .bind(...filter.params)
    .all<SourceRow>();

  return (result.results ?? []).map(toSourceDto);
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

export async function listDueSourceIds(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id
       FROM subscription_sources
       WHERE enabled = 1
         AND refresh_interval_minutes > 0
         AND (next_refresh_at IS NULL OR next_refresh_at <= CURRENT_TIMESTAMP)
       ORDER BY COALESCE(next_refresh_at, created_at) ASC`
    )
    .all<{ id: string }>();

  return (result.results ?? []).map((row) => row.id);
}

export async function findSourceById(db: D1Database, id: string, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "owner_id") : { params: [] as string[], sql: "" };
  const row = await db
    .prepare(
      `SELECT id, owner_id, name, url, groups, enabled, refresh_interval_minutes, next_refresh_at, last_status, last_error, last_fetched_at, created_at, updated_at
       FROM subscription_sources
       WHERE id = ?${filter.sql}`
    )
    .bind(id, ...filter.params)
    .first<SourceRow>();

  return row ? toSourceRecord(row) : null;
}

export async function createSource(db: D1Database, input: CreateSubscriptionSourceInput, ownerId: string | null = null) {
  const id = crypto.randomUUID();
  const refreshIntervalMinutes = input.refresh_interval_minutes ?? 0;

  await db
    .prepare(
      `INSERT INTO subscription_sources (id, owner_id, name, url, groups, enabled, refresh_interval_minutes, next_refresh_at)
       VALUES (
         ?1,
         ?2,
         ?3,
         ?4,
         ?5,
         ?6,
         ?7,
         CASE WHEN ?6 = 1 AND ?7 > 0 THEN datetime('now', '+' || ?7 || ' minutes') ELSE NULL END
       )`
    )
    .bind(id, ownerId, input.name, input.url, stringifyGroups(input.groups), input.enabled ? 1 : 0, refreshIntervalMinutes)
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
    groups: input.groups ?? current.groups,
    enabled: input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0,
    refreshIntervalMinutes: input.refresh_interval_minutes ?? current.refresh_interval_minutes
  };

  await db
    .prepare(
      `UPDATE subscription_sources
       SET name = ?1,
           url = ?2,
           groups = ?3,
           enabled = ?4,
           refresh_interval_minutes = ?5,
           next_refresh_at = CASE
             WHEN ?4 = 1 AND ?5 > 0
             THEN datetime('now', '+' || ?5 || ' minutes')
             ELSE NULL
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?6`
    )
    .bind(next.name, next.url, stringifyGroups(next.groups), next.enabled, next.refreshIntervalMinutes, id)
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

type SourceRecord = SourceDto & {
  owner_id: string | null;
};

function toSourceRecord(row: SourceRow): SourceRecord {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    url: row.url,
    groups: parseGroups(row.groups),
    enabled: row.enabled,
    refresh_interval_minutes: row.refresh_interval_minutes,
    next_refresh_at: row.next_refresh_at,
    last_status: row.last_status,
    last_error: row.last_error,
    last_fetched_at: row.last_fetched_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function toSourceDto(row: SourceRow): SourceDto {
  const { owner_id: _ownerId, ...source } = toSourceRecord(row);
  return source;
}

function stringifyGroups(groups: string[] | undefined) {
  return JSON.stringify(uniqueGroups(groups ?? []));
}

function parseGroups(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed)) {
      return uniqueGroups(parsed.filter((group): group is string => typeof group === "string"));
    }
  } catch {
    return [];
  }

  return [];
}

function uniqueGroups(groups: string[]) {
  return Array.from(new Set(groups.map((group) => group.trim()).filter(Boolean)));
}
