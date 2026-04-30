export async function createRefreshJob(db: D1Database, sourceId: string) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO refresh_jobs (id, source_id, status)
       VALUES (?1, ?2, 'running')`
    )
    .bind(id, sourceId)
    .run();

  return id;
}

export async function markRefreshJobFinished(db: D1Database, id: string, status: "success" | "failed", message?: string) {
  await db
    .prepare(
      `UPDATE refresh_jobs
       SET status = ?1, message = ?2, finished_at = CURRENT_TIMESTAMP
       WHERE id = ?3`
    )
    .bind(status, message ?? null, id)
    .run();
}

export async function markSourceRefreshStatus(
  db: D1Database,
  id: string,
  status: "success" | "failed",
  error?: string
) {
  await db
    .prepare(
      `UPDATE subscription_sources
       SET last_status = ?1,
           last_error = ?2,
           last_fetched_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?3`
    )
    .bind(status, error ?? null, id)
    .run();
}

