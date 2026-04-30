import type { NodeRow, RenderableNodeRow } from "./node.types";

export async function listNodes(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, source_id, name, protocol, server, port, tags, enabled, updated_at
       FROM nodes
       ORDER BY updated_at DESC, name ASC`
    )
    .all<NodeRow>();

  return result.results ?? [];
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

