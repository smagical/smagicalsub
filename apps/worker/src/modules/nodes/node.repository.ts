import { parseNodeUri } from "@smagicalsub/clash";
import type { CreateNodeInput, UpdateNodeInput } from "@smagicalsub/shared";
import { toNodeDto, toRenderableNode } from "./node.mapper";
import type { NodeRow, RenderableNodeRow } from "./node.types";

export async function listNodes(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, source_id, name, protocol, server, port, tags, enabled, updated_at
       FROM nodes
       ORDER BY updated_at DESC, name ASC`
    )
    .all<NodeRow>();

  return (result.results ?? []).map(toNodeDto);
}

export async function listNodeGroups(db: D1Database) {
  const nodes = await listNodes(db);
  const groups = new Set<string>();

  // 当前阶段分组复用 nodes.tags JSON 字段，列表页从节点聚合出可选分组。
  for (const node of nodes) {
    for (const group of node.groups) {
      groups.add(group);
    }
  }

  return Array.from(groups).sort((a, b) => a.localeCompare(b));
}

export async function findNodeById(db: D1Database, id: string) {
  const row = await db
    .prepare(
      `SELECT id, source_id, name, protocol, server, port, tags, enabled, updated_at
       FROM nodes
       WHERE id = ?1`
    )
    .bind(id)
    .first<NodeRow>();

  return row ? toNodeDto(row) : null;
}

export async function createManualNode(db: D1Database, input: CreateNodeInput) {
  const parsed = parseNodeUri(input.uri);

  if (!parsed) {
    return null;
  }

  const id = crypto.randomUUID();
  const name = input.name ?? parsed.name;

  // 手动节点和订阅源节点共用 nodes 表，source_id=NULL 表示用户手动维护。
  await db
    .prepare(
      `INSERT INTO nodes (id, source_id, name, protocol, server, port, tags, config_json, enabled)
       VALUES (?1, NULL, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    )
    .bind(
      id,
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

export async function updateNode(db: D1Database, id: string, input: UpdateNodeInput) {
  const current = await findNodeById(db, id);

  if (!current) {
    return null;
  }

  await db
    .prepare(
      `UPDATE nodes
       SET name = ?1,
           tags = ?2,
           enabled = ?3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?4`
    )
    .bind(
      input.name ?? current.name,
      JSON.stringify(input.groups ?? current.groups),
      input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0,
      id
    )
    .run();

  return findNodeById(db, id);
}

export async function deleteNode(db: D1Database, id: string) {
  const result = await db.prepare(`DELETE FROM nodes WHERE id = ?1`).bind(id).run();
  return result.meta.changes > 0;
}

export async function listEnabledRenderableNodes(db: D1Database) {
  // 订阅渲染只读取最小字段，降低 Worker 生成订阅时的 D1 查询和反序列化成本。
  const result = await db
    .prepare(
      `SELECT nodes.id, nodes.name, nodes.protocol, nodes.config_json, nodes.tags
       FROM nodes
       LEFT JOIN subscription_sources ON subscription_sources.id = nodes.source_id
       WHERE nodes.enabled = 1
         AND (nodes.source_id IS NULL OR subscription_sources.enabled = 1)
       ORDER BY nodes.name ASC`
    )
    .all<RenderableNodeRow>();

  return (result.results ?? []).map(toRenderableNode);
}
