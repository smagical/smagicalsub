import type { RenderableNode } from "@smagicalsub/subscription";
import type { NodeDto } from "@smagicalsub/shared";
import type { NodeRow, RenderableNodeRow } from "./node.types";

export function toNodeDto(row: NodeRow): NodeDto {
  const config = parseConfig(row.config_json);

  return {
    id: row.id,
    source_id: row.source_id,
    name: row.name,
    protocol: row.protocol,
    server: row.server,
    port: row.port,
    groups: parseGroups(row.tags),
    enabled: row.enabled,
    uri: typeof config.__rawUri === "string" ? config.__rawUri : null,
    config: stripInternalConfig(config),
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

function parseConfig(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function stripInternalConfig(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith("__")));
}
