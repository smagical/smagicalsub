import type { ParsedNode } from "@smagicalsub/subscription";
import { nodeConfigKey } from "@smagicalsub/subscription";

type ExistingSourceNode = {
  id: string;
  name: string;
  protocol: string;
  server: string | null;
  port: number | null;
  tags: string;
  config_json: string;
  enabled: number;
};

type ParsedSourceNode = ParsedNode & {
  groups: string[];
};

export async function replaceSourceNodes(db: D1Database, sourceId: string, nodes: ParsedNode[], ownerId: string | null, sourceGroups: string[] = []) {
  // 刷新源节点时保留用户维护的名称、分组和启停状态，避免上游更新覆盖本地整理结果。
  const previousNodes = await listExistingSourceNodes(db, sourceId);
  const previousByKey = new Map(previousNodes.map((node) => [sourceNodeKey(node), node]));
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM nodes WHERE source_id = ?1`).bind(sourceId)
  ];

  for (const node of dedupeNodes(nodes, sourceGroups)) {
    const previous = previousByKey.get(parsedNodeKey(node));
    const groups = uniqueGroups([...node.groups, ...(previous ? parseTags(previous.tags) : [])]);

    // __rawUri 只给 v2rayN/plain 输出使用，Clash/sing-box 渲染时会过滤内部字段。
    statements.push(
      db
        .prepare(
          `INSERT INTO nodes (id, owner_id, source_id, name, protocol, server, port, tags, config_json, enabled)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
        )
        .bind(
          previous?.id ?? crypto.randomUUID(),
          ownerId,
          sourceId,
          previous?.name ?? node.name,
          node.protocol,
          node.server ?? null,
          node.port ?? null,
          JSON.stringify(groups),
          JSON.stringify({ ...node.config, __rawUri: node.rawUri }),
          previous?.enabled ?? 1
        )
    );
  }

  await db.batch(statements);
  return statements.length - 1;
}

async function listExistingSourceNodes(db: D1Database, sourceId: string) {
  const result = await db
    .prepare(
      `SELECT id, name, protocol, server, port, tags, config_json, enabled
       FROM nodes
       WHERE source_id = ?1`
    )
    .bind(sourceId)
    .all<ExistingSourceNode>();

  return result.results ?? [];
}

// 源刷新按完整快照替换，同一个源内的重复节点在入库前折叠掉。
function dedupeNodes(nodes: ParsedNode[], sourceGroups: string[]) {
  const unique = new Map<string, ParsedSourceNode>();
  const normalizedSourceGroups = uniqueGroups(sourceGroups);

  for (const node of nodes) {
    const key = parsedNodeKey(node);
    const current = unique.get(key);
    const groups = uniqueGroups([...(current?.groups ?? []), ...normalizedSourceGroups]);

    unique.set(key, { ...(current ?? node), groups });
  }

  return Array.from(unique.values());
}

function sourceNodeKey(node: ExistingSourceNode) {
  try {
    const parsed = JSON.parse(node.config_json) as Record<string, unknown>;
    return nodeConfigKey(parsed, node.protocol, node.name);
  } catch {
    return `${node.protocol}:${node.server ?? ""}:${node.port ?? ""}:${node.name}`;
  }
}

function parsedNodeKey(node: ParsedNode) {
  return nodeConfigKey(node.config, node.protocol, node.name);
}

function parseTags(value: string) {
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
  const normalizedGroups: string[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const segment of group.split(/[\r\n,，;；]+/g)) {
      const value = segment.trim();

      if (!value || seen.has(value)) {
        continue;
      }

      seen.add(value);
      normalizedGroups.push(value);
    }
  }

  return normalizedGroups;
}
