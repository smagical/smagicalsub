import { nodeConfigKey, parseNodeUri } from "@smagicalsub/subscription";
import type { CreateNodeInput, UpdateNodeInput } from "@smagicalsub/shared";
import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import { normalizeGroups, parseGroups, toNodeDto, toRenderableNode } from "./node.mapper";
import type { NodeRow, RenderableNodeRow } from "./node.types";

const maxNodeNameLength = 120;
type ManualNodeResult = { deduped: boolean; node: NonNullable<Awaited<ReturnType<typeof findNodeById>>> };

export async function listNodes(db: D1Database, scope?: OwnerScope) {
  const filter = scope ? ownerWhere(scope) : { params: [] as string[], sql: "" };
  const result = await db
    .prepare(
      `SELECT nodes.id,
              nodes.owner_id,
              nodes.source_id,
              COALESCE((SELECT group_concat(node_sources.source_id) FROM node_sources WHERE node_sources.node_id = nodes.id), '') AS source_ids,
              nodes.manual,
              nodes.name,
              nodes.protocol,
              nodes.server,
              nodes.port,
              nodes.tags,
              nodes.config_json,
              nodes.enabled,
              nodes.updated_at
       FROM nodes
       WHERE 1 = 1${filter.sql}
       ORDER BY nodes.updated_at DESC, nodes.name ASC`
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
      `SELECT nodes.id,
              nodes.owner_id,
              nodes.source_id,
              COALESCE((SELECT group_concat(node_sources.source_id) FROM node_sources WHERE node_sources.node_id = nodes.id), '') AS source_ids,
              nodes.manual,
              nodes.name,
              nodes.protocol,
              nodes.server,
              nodes.port,
              nodes.tags,
              nodes.config_json,
              nodes.enabled,
              nodes.updated_at
       FROM nodes
       WHERE nodes.id = ?${filter.sql}`
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

export async function createManualNode(db: D1Database, input: CreateNodeInput, ownerId: string | null = null): Promise<ManualNodeResult | null> {
  const parsed = parseNodeUri(input.uri);

  if (!parsed) {
    return null;
  }

  const existing = await findExistingNodeByKey(db, nodeConfigKey(parsed.config, parsed.protocol, parsed.name), ownerId);
  const name = truncateNodeName(input.name ?? parsed.name);
  const groups = normalizeGroups(input.groups);

  if (existing) {
    const nextGroups = normalizeGroups([...parseGroups(existing.tags), ...groups]);
    const nextName = input.name ? name : existing.name;

    await db
      .prepare(
        `UPDATE nodes
         SET manual = 1,
             name = ?1,
             tags = ?2,
             enabled = ?3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?4`
      )
      .bind(nextName, JSON.stringify(nextGroups), input.enabled ? 1 : 0, existing.id)
      .run();

    const node = await findNodeById(db, existing.id);
    return node ? { deduped: true, node } : null;
  }

  const id = crypto.randomUUID();

  // manual=1 表示节点带有用户手动维护来源；订阅源来源写入 node_sources 关系表。
  await db
    .prepare(
      `INSERT INTO nodes (id, owner_id, source_id, manual, name, protocol, server, port, tags, config_json, enabled)
       VALUES (?1, ?2, NULL, 1, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(
      id,
      ownerId,
      name,
      parsed.protocol,
      parsed.server ?? null,
      parsed.port ?? null,
      JSON.stringify(groups),
      // 保留原始 URI，保证 v2rayN base64 和明文订阅可以无损输出。
      JSON.stringify({ ...parsed.config, __rawUri: parsed.rawUri }),
      input.enabled ? 1 : 0
    )
    .run();

  const node = await findNodeById(db, id);
  return node ? { deduped: false, node } : null;
}

export async function importManualNodes(
  db: D1Database,
  inputs: Array<CreateNodeInput & { line: number }>,
  ownerId: string | null = null
) {
  const created = [];
  const deduped = [];
  const failed: Array<{ line: number; message: string; value: string }> = [];

  for (const input of inputs) {
    const result = await createManualNode(db, input, ownerId);

    if (result) {
      if (result.deduped) {
        deduped.push(result.node);
      } else {
        created.push(result.node);
      }
    } else {
      failed.push({
        line: input.line,
        message: "节点链接解析失败",
        value: input.uri.slice(0, 160)
      });
    }
  }

  return { created, deduped, failed };
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
  const nextGroups = input.groups === undefined ? current.groups : normalizeGroups(input.groups);
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
      truncateNodeName(input.name ?? parsed?.name ?? current.name),
      parsed?.protocol ?? current.protocol,
      parsed?.server ?? current.server,
      parsed?.port ?? current.port,
      JSON.stringify(nextGroups),
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
    return { status: "not-found" as const };
  }

  if (!current.manual && current.source_ids.length > 0) {
    return { status: "source-owned" as const };
  }

  if (current.source_ids.length > 0) {
    await db.prepare(`UPDATE nodes SET manual = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?1`).bind(id).run();
    return { status: "manual-detached" as const };
  }

  const result = await db.prepare(`DELETE FROM nodes WHERE id = ?1`).bind(id).run();
  return { status: result.meta.changes > 0 ? "deleted" as const : "not-found" as const };
}

export async function listEnabledRenderableNodes(db: D1Database, ownerId?: string | null) {
  return listEnabledRenderableNodesByIds(db, ownerId, []);
}

export async function listEnabledRenderableNodesByIds(db: D1Database, ownerId: string | null | undefined, nodeIds: string[] = []) {
  const ownerSql = ownerId === undefined ? "" : ownerId === null ? " AND nodes.owner_id IS NULL" : " AND nodes.owner_id = ?";
  const nodeSql = nodeIds.length > 0 ? ` AND nodes.id IN (${nodeIds.map(() => "?").join(", ")})` : "";
  const statement = db.prepare(
    `SELECT nodes.id, nodes.name, nodes.protocol, nodes.config_json, nodes.tags
     FROM nodes
     WHERE nodes.enabled = 1
       AND (
         nodes.manual = 1
         OR EXISTS (
           SELECT 1
           FROM node_sources
           INNER JOIN subscription_sources ON subscription_sources.id = node_sources.source_id
           WHERE node_sources.node_id = nodes.id
             AND subscription_sources.enabled = 1
         )
       )${ownerSql}${nodeSql}
     ORDER BY nodes.name ASC`
  );
  // 订阅渲染只读取最小字段，降低 Worker 生成订阅时的 D1 查询和反序列化成本。
  const params = [...(typeof ownerId === "string" ? [ownerId] : []), ...nodeIds];
  const result = await (params.length > 0 ? statement.bind(...params) : statement).all<RenderableNodeRow>();

  return (result.results ?? []).map(toRenderableNode);
}

export function truncateNodeName(value: string) {
  const normalized = value.trim();

  return normalized.length > maxNodeNameLength ? normalized.slice(0, maxNodeNameLength) : normalized;
}

export async function deleteOrphanNodes(db: D1Database, nodeIds: string[]) {
  const ids = Array.from(new Set(nodeIds)).filter(Boolean);

  if (ids.length === 0) {
    return 0;
  }

  const result = await db
    .prepare(
      `DELETE FROM nodes
       WHERE id IN (${ids.map(() => "?").join(", ")})
         AND manual = 0
         AND NOT EXISTS (
           SELECT 1
           FROM node_sources
           WHERE node_sources.node_id = nodes.id
         )`
    )
    .bind(...ids)
    .run();

  return result.meta.changes;
}

async function findExistingNodeByKey(db: D1Database, key: string, ownerId: string | null) {
  const ownerCondition = ownerId ? "owner_id = ?1" : "owner_id IS NULL";
  const result = await db
    .prepare(
      `SELECT id, owner_id, source_id, '' AS source_ids, manual, name, protocol, server, port, tags, config_json, enabled, updated_at
       FROM nodes
       WHERE ${ownerCondition}
       ORDER BY updated_at DESC`
    )
    .bind(...(ownerId ? [ownerId] : []))
    .all<NodeRow>();

  return (result.results ?? []).find((node) => nodeRowKey(node) === key) ?? null;
}

function nodeRowKey(node: Pick<NodeRow, "config_json" | "name" | "protocol">) {
  try {
    const config = JSON.parse(node.config_json) as Record<string, unknown>;
    return nodeConfigKey(config, node.protocol, node.name);
  } catch {
    return `${node.protocol}:${node.name}`;
  }
}
