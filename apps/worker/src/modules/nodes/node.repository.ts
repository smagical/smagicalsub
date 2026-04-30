import { parseNodeUri } from "@smagicalsub/clash";
import type { CreateNodeInput, NodeDto, UpdateNodeInput } from "@smagicalsub/shared";
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
      JSON.stringify(parsed.config),
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
  const result = await db
    .prepare(
      `SELECT id, name, protocol, config_json
       FROM nodes
       WHERE enabled = 1
       ORDER BY name ASC`
    )
    .all<RenderableNodeRow>();

  return result.results ?? [];
}

function toNodeDto(row: NodeRow): NodeDto {
  return {
    id: row.id,
    source_id: row.source_id,
    name: row.name,
    protocol: row.protocol,
    server: row.server,
    port: row.port,
    groups: parseGroups(row.tags),
    enabled: row.enabled,
    updated_at: row.updated_at
  };
}

function parseGroups(tags: string) {
  try {
    const parsed = JSON.parse(tags) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0);
    }
  } catch {
    return [];
  }

  return [];
}
