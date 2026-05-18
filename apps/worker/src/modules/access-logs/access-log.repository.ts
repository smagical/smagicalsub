import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import type { AccessLogRow } from "./access-log.types";

export async function listAccessLogs(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope, "subscribe_tokens.owner_id") : { params: [] as string[], sql: "" };
  // 日志页默认展示最近访问，左连接令牌名称，令牌删除后仍保留历史路径和来源。
  const result = await db
    .prepare(
      `SELECT access_logs.id,
              access_logs.token_id,
              subscribe_tokens.name AS token_name,
              access_logs.path,
              access_logs.ip,
              access_logs.user_agent,
              access_logs.created_at
       FROM access_logs
       LEFT JOIN subscribe_tokens ON subscribe_tokens.id = access_logs.token_id
       WHERE 1 = 1${filter.sql}
       ORDER BY access_logs.created_at DESC
       LIMIT 100`
    )
    .bind(...filter.params)
    .all<AccessLogRow>();

  return result.results ?? [];
}
