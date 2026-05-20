import type { ParsedNode } from "@smagicalsub/subscription";
import { nodeConfigKey } from "@smagicalsub/subscription";
import { deleteOrphanNodes, truncateNodeName } from "../nodes/node.repository";

type ExistingSourceNode = {
  id: string;
  owner_id: string | null;
  name: string;
  protocol: string;
  server: string | null;
  port: number | null;
  tags: string;
  config_json: string;
  enabled: number;
  manual: number;
};

type ParsedSourceNode = ParsedNode & {
  groups: string[];
};

export async function replaceSourceNodes(db: D1Database, sourceId: string, nodes: ParsedNode[], ownerId: string | null, sourceGroups: string[] = []) {
  // 刷新源节点时保留用户维护的名称、分组和启停状态，避免上游更新覆盖本地整理结果。
  const [previousNodes, ownerNodes] = await Promise.all([
    listExistingSourceNodes(db, sourceId),
    listOwnerNodes(db, ownerId)
  ]);
  const previousByKey = new Map(previousNodes.map((node) => [sourceNodeKey(node), node]));
  const ownerByKey = indexNodesByKey(ownerNodes);
  const previousIds = new Set(previousNodes.map((node) => node.id));
  const nextIds = new Set<string>();
  const statements: D1PreparedStatement[] = [];

  for (const node of dedupeNodes(nodes, sourceGroups)) {
    const key = parsedNodeKey(node);
    const previous = previousByKey.get(key);
    const existing = ownerByKey.get(key) ?? previous;
    const nodeId = existing?.id ?? crypto.randomUUID();
    const groups = uniqueGroups([...node.groups, ...(existing ? parseTags(existing.tags) : [])]);
    nextIds.add(nodeId);

    // __rawUri 只给 v2rayN/plain 输出使用，Clash/sing-box 渲染时会过滤内部字段。
    if (existing) {
      statements.push(
        db
          .prepare(
            `UPDATE nodes
             SET tags = ?1,
                 config_json = ?2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?3`
          )
          .bind(JSON.stringify(groups), JSON.stringify({ ...node.config, __rawUri: node.rawUri }), nodeId)
      );
    } else {
      statements.push(
        db
          .prepare(
            `INSERT INTO nodes (id, owner_id, source_id, manual, name, protocol, server, port, tags, config_json, enabled)
             VALUES (?1, ?2, NULL, 0, ?3, ?4, ?5, ?6, ?7, ?8, 1)`
          )
          .bind(
            nodeId,
            ownerId,
            truncateNodeName(node.name),
            node.protocol,
            node.server ?? null,
            node.port ?? null,
            JSON.stringify(groups),
            JSON.stringify({ ...node.config, __rawUri: node.rawUri })
          )
      );
      ownerByKey.set(key, {
        id: nodeId,
        owner_id: ownerId,
        name: truncateNodeName(node.name),
        protocol: node.protocol,
        server: node.server ?? null,
        port: node.port ?? null,
        tags: JSON.stringify(groups),
        config_json: JSON.stringify({ ...node.config, __rawUri: node.rawUri }),
        enabled: 1,
        manual: 0
      });
    }
  }

  const removedIds = Array.from(previousIds).filter((id) => !nextIds.has(id));
  statements.push(db.prepare(`DELETE FROM node_sources WHERE source_id = ?1`).bind(sourceId));

  for (const nodeId of nextIds) {
    statements.push(db.prepare(`INSERT OR IGNORE INTO node_sources (node_id, source_id) VALUES (?1, ?2)`).bind(nodeId, sourceId));
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  await deleteOrphanNodes(db, removedIds);
  return nextIds.size;
}

async function listExistingSourceNodes(db: D1Database, sourceId: string) {
  const result = await db
    .prepare(
      `SELECT nodes.id, nodes.owner_id, nodes.name, nodes.protocol, nodes.server, nodes.port, nodes.tags, nodes.config_json, nodes.enabled, nodes.manual
       FROM nodes
       INNER JOIN node_sources ON node_sources.node_id = nodes.id
       WHERE node_sources.source_id = ?1`
    )
    .bind(sourceId)
    .all<ExistingSourceNode>();

  return result.results ?? [];
}

async function listOwnerNodes(db: D1Database, ownerId: string | null) {
  const ownerCondition = ownerId ? "owner_id = ?1" : "owner_id IS NULL";
  const statement = db.prepare(
    `SELECT id, owner_id, name, protocol, server, port, tags, config_json, enabled, manual
     FROM nodes
     WHERE ${ownerCondition}`
  );
  const result = await (ownerId ? statement.bind(ownerId) : statement).all<ExistingSourceNode>();

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

function indexNodesByKey(nodes: ExistingSourceNode[]) {
  const indexed = new Map<string, ExistingSourceNode>();

  for (const node of nodes) {
    const key = sourceNodeKey(node);
    const current = indexed.get(key);

    if (!current || (node.manual && !current.manual)) {
      indexed.set(key, node);
    }
  }

  return indexed;
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
