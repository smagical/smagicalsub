import type { RenderableNode } from "@smagicalsub/subscription";
import type { NodeDto } from "@smagicalsub/shared";
import type { NodeRow, RenderableNodeRow } from "./node.types";

export function toNodeDto(row: NodeRow): NodeDto {
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

export function toRenderableNode(row: RenderableNodeRow): RenderableNode {
  return {
    id: row.id,
    name: row.name,
    protocol: row.protocol,
    config_json: row.config_json,
    groups: parseGroups(row.tags)
  };
}

// D1 stores node groups as JSON in nodes.tags until a dedicated groups table is needed.
export function parseGroups(tags: string) {
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
