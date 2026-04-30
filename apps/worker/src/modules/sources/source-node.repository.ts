import type { ParsedNode } from "@smagicalsub/clash";

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

export async function replaceSourceNodes(db: D1Database, sourceId: string, nodes: ParsedNode[]) {
  // 刷新源节点时保留用户维护的名称、分组和启停状态，避免上游更新覆盖本地整理结果。
  const previousNodes = await listExistingSourceNodes(db, sourceId);
  const previousByKey = new Map(previousNodes.map((node) => [sourceNodeKey(node), node]));
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM nodes WHERE source_id = ?1`).bind(sourceId)
  ];

  for (const node of dedupeNodes(nodes)) {
    const previous = previousByKey.get(parsedNodeKey(node));

    // __rawUri 只给 v2rayN/plain 输出使用，Clash/sing-box 渲染时会过滤内部字段。
    statements.push(
      db
        .prepare(
          `INSERT INTO nodes (id, source_id, name, protocol, server, port, tags, config_json, enabled)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        )
        .bind(
          previous?.id ?? crypto.randomUUID(),
          sourceId,
          previous?.name ?? node.name,
          node.protocol,
          node.server ?? null,
          node.port ?? null,
          previous?.tags ?? "[]",
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
function dedupeNodes(nodes: ParsedNode[]) {
  const seen = new Set<string>();
  const unique: ParsedNode[] = [];

  for (const node of nodes) {
    const key = parsedNodeKey(node);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(node);
    }
  }

  return unique;
}

function sourceNodeKey(node: ExistingSourceNode) {
  try {
    const parsed = JSON.parse(node.config_json) as { __rawUri?: unknown };

    if (typeof parsed.__rawUri === "string" && parsed.__rawUri.length > 0) {
      return parsed.__rawUri;
    }
  } catch {
    return `${node.protocol}:${node.server ?? ""}:${node.port ?? ""}:${node.name}`;
  }

  return `${node.protocol}:${node.server ?? ""}:${node.port ?? ""}:${node.name}`;
}

function parsedNodeKey(node: ParsedNode) {
  return node.rawUri || `${node.protocol}:${node.server ?? ""}:${node.port ?? ""}:${node.name}`;
}
