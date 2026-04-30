import type { NodeRow } from "./node.types";

export async function deleteNodes(db: D1Database, ids: string[]) {
  const result = await db.prepare(`DELETE FROM nodes WHERE id IN (${placeholders(ids)})`).bind(...ids).run();
  return result.meta.changes;
}

export async function setNodesEnabled(db: D1Database, ids: string[], enabled: boolean) {
  const result = await db
    .prepare(`UPDATE nodes SET enabled = ?1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders(ids, 2)})`)
    .bind(enabled ? 1 : 0, ...ids)
    .run();
  return result.meta.changes;
}

export async function setNodesGroups(db: D1Database, ids: string[], groups: string[]) {
  const result = await db
    .prepare(`UPDATE nodes SET tags = ?1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders(ids, 2)})`)
    .bind(JSON.stringify(groups), ...ids)
    .run();
  return result.meta.changes;
}

export async function appendNodesGroups(db: D1Database, ids: string[], groups: string[]) {
  const result = await db.prepare(`SELECT id, tags FROM nodes WHERE id IN (${placeholders(ids)})`).bind(...ids).all<Pick<NodeRow, "id" | "tags">>();
  const rows = result.results ?? [];

  if (rows.length === 0) {
    return 0;
  }

  // 追加分组需要先读取现有 tags，避免覆盖用户已经手动整理的分组。
  await db.batch(
    rows.map((row) =>
      db
        .prepare(`UPDATE nodes SET tags = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2`)
        .bind(JSON.stringify(Array.from(new Set([...parseTags(row.tags), ...groups]))), row.id)
    )
  );

  return rows.length;
}

function placeholders(values: unknown[], offset = 1) {
  return values.map((_, index) => `?${index + offset}`).join(", ");
}

function parseTags(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
