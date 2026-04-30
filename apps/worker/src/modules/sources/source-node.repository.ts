import type { ParsedNode } from "@smagicalsub/clash";

export async function replaceSourceNodes(db: D1Database, sourceId: string, nodes: ParsedNode[]) {
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM nodes WHERE source_id = ?1`).bind(sourceId)
  ];

  for (const node of dedupeNodes(nodes)) {
    // __rawUri 只给 v2rayN/plain 输出使用，Clash/sing-box 渲染时会过滤内部字段。
    statements.push(
      db
        .prepare(
          `INSERT INTO nodes (id, source_id, name, protocol, server, port, tags, config_json, enabled)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)`
        )
        .bind(
          crypto.randomUUID(),
          sourceId,
          node.name,
          node.protocol,
          node.server ?? null,
          node.port ?? null,
          "[]",
          JSON.stringify({ ...node.config, __rawUri: node.rawUri })
        )
    );
  }

  await db.batch(statements);
  return statements.length - 1;
}

// 源刷新按完整快照替换，同一个源内的重复节点在入库前折叠掉。
function dedupeNodes(nodes: ParsedNode[]) {
  const seen = new Set<string>();
  const unique: ParsedNode[] = [];

  for (const node of nodes) {
    const key = `${node.protocol}:${node.server ?? ""}:${node.port ?? ""}:${node.name}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(node);
    }
  }

  return unique;
}
