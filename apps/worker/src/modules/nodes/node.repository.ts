import { parseNodeUri } from "@smagicalsub/subscription";
import type { CreateNodeInput, UpdateNodeInput } from "@smagicalsub/shared";
import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import { toNodeDto, toRenderableNode } from "./node.mapper";
import type { NodeRow, RenderableNodeRow } from "./node.types";

export async function listNodes(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : { params: [] as string[], sql: "" };
  const result = await db
    .prepare(
      `SELECT id, owner_id, source_id, name, protocol, server, port, tags, config_json, enabled, updated_at
       FROM nodes
       WHERE 1 = 1${filter.sql}
       ORDER BY updated_at DESC, name ASC`
    )
    .bind(...filter.params)
    .all<NodeRow>();

  return (result.results ?? []).map(toNodeDto);
}

export async function listNodeGroups(db: D1Database, scope?: OwnerScope) {
  const nodes = await listNodes(db, scope);
  const groups = new Set<string>();

  // 当前阶段分组复用 nodes.tags JSON 字段，列表页从节点聚合出可选分组。
  for (const node of nodes) {
    for (const group of node.groups) {
      groups.add(group);
    }
  }

  return Array.from(groups).sort((a, b) => a.localeCompare(b));
}

export async function findNodeById(db: D1Database, id: string, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : { params: [] as string[], sql: "" };
  const row = await db
    .prepare(
      `SELECT id, owner_id, source_id, name, protocol, server, port, tags, config_json, enabled, updated_at
       FROM nodes
       WHERE id = ?${filter.sql}`
    )
    .bind(id, ...filter.params)
    .first<NodeRow>();

  return row ? toNodeDto(row) : null;
}

export async function countNodesByIds(db: D1Database, ids: string[], scope: OwnerScope) {
  if (ids.length === 0) {
    return 0;
  }

  const filter = ownerWhere(scope);
  const result = await db
    .prepare(`SELECT COUNT(*) AS count FROM nodes WHERE id IN (${ids.map(() => "?").join(", ")})${filter.sql}`)
    .bind(...ids, ...filter.params)
    .first<{ count: number }>();

  return result?.count ?? 0;
}

export async function createManualNode(db: D1Database, input: CreateNodeInput, ownerId: string | null = null) {
  const parsed = parseNodeUri(input.uri);

  if (!parsed) {
    return null;
  }

  const id = crypto.randomUUID();
  const name = input.name ?? parsed.name;

  // 手动节点和订阅源节点共用 nodes 表，source_id=NULL 表示用户手动维护。
  await db
    .prepare(
      `INSERT INTO nodes (id, owner_id, source_id, name, protocol, server, port, tags, config_json, enabled)
       VALUES (?1, ?2, NULL, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(
      id,
      ownerId,
      name,
      parsed.protocol,
      parsed.server ?? null,
      parsed.port ?? null,
      JSON.stringify(input.groups),
      // 保留原始 URI，保证 v2rayN base64 和明文订阅可以无损输出。
      JSON.stringify({ ...parsed.config, __rawUri: parsed.rawUri }),
      input.enabled ? 1 : 0
    )
    .run();

  return findNodeById(db, id);
}

export async function updateNode(db: D1Database, id: string, input: UpdateNodeInput, scope?: OwnerScope) {
  const current = await findNodeById(db, id, scope);

  if (!current) {
    return null;
  }

  const parsed = input.uri ? parseNodeUri(input.uri) : null;

  if (input.uri && !parsed) {
    return undefined;
  }

  const nextConfig = parsed?.config ?? input.config ?? current.config;
  const nextRawUri = input.uri ?? current.uri;

  await db
    .prepare(
      `UPDATE nodes
       SET name = ?1,
           protocol = ?2,
           server = ?3,
           port = ?4,
           tags = ?5,
           config_json = ?6,
           enabled = ?7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?8`
    )
    .bind(
      input.name ?? parsed?.name ?? current.name,
      parsed?.protocol ?? current.protocol,
      parsed?.server ?? current.server,
      parsed?.port ?? current.port,
      JSON.stringify(input.groups ?? current.groups),
      JSON.stringify({ ...nextConfig, ...(nextRawUri ? { __rawUri: nextRawUri } : {}) }),
      input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0,
      id
    )
    .run();

  return findNodeById(db, id, scope);
}

export async function deleteNode(db: D1Database, id: string, scope?: OwnerScope) {
  const current = await findNodeById(db, id, scope);

  if (!current) {
    return false;
  }

  const result = await db.prepare(`DELETE FROM nodes WHERE id = ?1`).bind(id).run();
  return result.meta.changes > 0;
}

export async function listEnabledRenderableNodes(db: D1Database, ownerId?: string | null) {
  return listEnabledRenderableNodesByIds(db, ownerId, []);
}

export async function listEnabledRenderableNodesByIds(db: D1Database, ownerId: string | null | undefined, nodeIds: string[] = []) {
  const ownerSql = typeof ownerId === "string" ? " AND nodes.owner_id = ?" : "";
  const nodeSql = nodeIds.length > 0 ? ` AND nodes.id IN (${nodeIds.map(() => "?").join(", ")})` : "";
  const statement = db.prepare(
    `SELECT nodes.id, nodes.name, nodes.protocol, nodes.config_json, nodes.tags
     FROM nodes
     LEFT JOIN subscription_sources ON subscription_sources.id = nodes.source_id
     WHERE nodes.enabled = 1
       AND (nodes.source_id IS NULL OR subscription_sources.enabled = 1)${ownerSql}${nodeSql}
     ORDER BY nodes.name ASC`
  );
  // 订阅渲染只读取最小字段，降低 Worker 生成订阅时的 D1 查询和反序列化成本。
  const params = [...(typeof ownerId === "string" ? [ownerId] : []), ...nodeIds];
  const result = await (params.length > 0 ? statement.bind(...params) : statement).all<RenderableNodeRow>();

  return (result.results ?? []).map(toRenderableNode);
}
