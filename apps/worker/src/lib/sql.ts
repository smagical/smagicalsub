export type CountRow = {
  value: number;
};

export async function countTable(db: D1Database, table: string) {
  const row = await db.prepare(`SELECT COUNT(*) AS value FROM ${table}`).first<CountRow>();
  return row?.value ?? 0;
}

