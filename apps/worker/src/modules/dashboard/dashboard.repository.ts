import type { DashboardDto } from "@smagicalsub/shared";
import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import { countTable, type CountRow } from "../../lib/sql";

const dashboardTables = {
  sources: "subscription_sources",
  nodes: "nodes",
  profiles: "profiles",
  tokens: "subscribe_tokens"
} as const;

export async function getDashboardTotals(db: D1Database, scope?: OwnerScope) {
  const [sources, nodes, profiles, tokens] = await Promise.all([
    countOwnedTable(db, dashboardTables.sources, scope),
    countOwnedTable(db, dashboardTables.nodes, scope),
    countOwnedTable(db, dashboardTables.profiles, scope),
    countOwnedTable(db, dashboardTables.tokens, scope)
  ]);

  return {
    sources,
    nodes,
    profiles,
    tokens
  };
}

type RequestStats = NonNullable<DashboardDto["requestStats"]>;
type MetricTotalRow = { blocked: number | null; cached: number | null; success: number | null; total: number | null };
type MetricTrendRow = { bucket: string; value: number | null };

export async function getRequestStats(db: D1Database, scope?: OwnerScope): Promise<RequestStats> {
  const filter = metricOwnerFilter(scope);
  const totalRow = await db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) AS total,
              COALESCE(SUM(success), 0) AS success,
              COALESCE(SUM(cached), 0) AS cached,
              COALESCE(SUM(blocked), 0) AS blocked
       FROM subscription_metrics
       WHERE bucket >= strftime('%Y-%m-%d %H:00:00', 'now', '-6 hours')${filter.sql}`
    )
    .bind(...filter.params)
    .first<MetricTotalRow>();
  const trendRows = await db
    .prepare(
      `SELECT bucket, COALESCE(SUM(total), 0) AS value
       FROM subscription_metrics
       WHERE bucket >= strftime('%Y-%m-%d %H:00:00', 'now', '-6 hours')${filter.sql}
       GROUP BY bucket
       ORDER BY bucket ASC`
    )
    .bind(...filter.params)
    .all<MetricTrendRow>();
  const trendValues = new Map((trendRows.results ?? []).map((row) => [row.bucket, row.value ?? 0]));

  return {
    blocked: totalRow?.blocked ?? 0,
    cached: totalRow?.cached ?? 0,
    success: totalRow?.success ?? 0,
    total: totalRow?.total ?? 0,
    trend: recentMetricBuckets().map((bucket) => ({
      label: bucket.slice(11, 13),
      value: trendValues.get(bucket) ?? 0
    }))
  };
}

type DashboardEvent = DashboardDto["recentEvents"][number];
type RefreshEventRow = { id: string; source_name: string | null; status: string; time: string };
type AccessEventRow = { id: string; token_name: string | null; path: string; time: string };
type NamedEventRow = { id: string; name: string; time: string };

export async function getRecentDashboardEvents(db: D1Database, scope?: OwnerScope): Promise<DashboardEvent[]> {
  const [refreshes, accesses, sources, tokens] = await Promise.all([
    listRefreshEvents(db, scope),
    listAccessEvents(db, scope),
    listSourceEvents(db, scope),
    listTokenEvents(db, scope)
  ]);

  // 多表事件统一在 Worker 侧排序，避免把 Dashboard 绑定到复杂 UNION SQL。
  return [...refreshes, ...accesses, ...sources, ...tokens]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 8);
}

async function listRefreshEvents(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "subscription_sources.owner_id") : emptyFilter();
  const result = await db
    .prepare(
      `SELECT refresh_jobs.id,
              subscription_sources.name AS source_name,
              refresh_jobs.status,
              COALESCE(refresh_jobs.finished_at, refresh_jobs.started_at) AS time
       FROM refresh_jobs
       LEFT JOIN subscription_sources ON subscription_sources.id = refresh_jobs.source_id
       WHERE 1 = 1${filter.sql}
       ORDER BY time DESC
       LIMIT 8`
    )
    .bind(...filter.params)
    .all<RefreshEventRow>();

  return (result.results ?? []).map((row) => ({
    id: `refresh:${row.id}`,
    title: `订阅源「${row.source_name ?? "已删除"}」刷新${refreshStatusLabel(row.status)}`,
    status: refreshEventStatus(row.status),
    time: row.time
  }));
}

async function listAccessEvents(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "subscribe_tokens.owner_id") : emptyFilter();
  const result = await db
    .prepare(
      `SELECT access_logs.id,
              subscribe_tokens.name AS token_name,
              access_logs.path,
              access_logs.created_at AS time
       FROM access_logs
       LEFT JOIN subscribe_tokens ON subscribe_tokens.id = access_logs.token_id
       WHERE 1 = 1${filter.sql}
       ORDER BY access_logs.created_at DESC
       LIMIT 8`
    )
    .bind(...filter.params)
    .all<AccessEventRow>();

  return (result.results ?? []).map((row) => ({
    id: `access:${row.id}`,
    title: `订阅访问：${row.token_name ?? row.path}`,
    status: "success" as const,
    time: row.time
  }));
}

async function listSourceEvents(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : emptyFilter();
  const result = await db
    .prepare(`SELECT id, name, created_at AS time FROM subscription_sources WHERE 1 = 1${filter.sql} ORDER BY created_at DESC LIMIT 4`)
    .bind(...filter.params)
    .all<NamedEventRow>();

  return (result.results ?? []).map((row) => namedEvent("source", row, "创建订阅源", "warning"));
}

async function listTokenEvents(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : emptyFilter();
  const result = await db
    .prepare(`SELECT id, name, created_at AS time FROM subscribe_tokens WHERE 1 = 1${filter.sql} ORDER BY created_at DESC LIMIT 4`)
    .bind(...filter.params)
    .all<NamedEventRow>();

  return (result.results ?? []).map((row) => namedEvent("token", row, "创建订阅令牌", "warning"));
}

function namedEvent(prefix: string, row: NamedEventRow, action: string, status: DashboardEvent["status"]) {
  return {
    id: `${prefix}:${row.id}`,
    title: `${action}「${row.name}」`,
    status,
    time: row.time
  };
}

function refreshStatusLabel(status: string) {
  if (status === "success") {
    return "成功";
  }

  return status === "failed" ? "失败" : "进行中";
}

function refreshEventStatus(status: string): DashboardEvent["status"] {
  if (status === "success") {
    return "success";
  }

  return status === "failed" ? "error" : "warning";
}

async function countOwnedTable(db: D1Database, table: string, scope?: OwnerScope) {
  if (!scope || scope.isAdmin) {
    return countTable(db, table);
  }

  const row = await db.prepare(`SELECT COUNT(*) AS value FROM ${table} WHERE owner_id = ?`).bind(scope.ownerId ?? "").first<CountRow>();
  return row?.value ?? 0;
}

function emptyFilter() {
  return { params: [] as string[], sql: "" };
}

function metricOwnerFilter(scope?: OwnerScope) {
  if (!scope || scope.isAdmin) {
    return emptyFilter();
  }

  return { params: [scope.ownerId ?? ""], sql: " AND owner_id = ?" };
}

function recentMetricBuckets() {
  const buckets: string[] = [];
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);

  for (let index = 6; index >= 0; index -= 1) {
    buckets.push(sqliteHourBucket(new Date(now.getTime() - index * 60 * 60 * 1000)));
  }

  return buckets;
}

function sqliteHourBucket(value: Date) {
  return value.toISOString().slice(0, 13).replace("T", " ") + ":00:00";
}
