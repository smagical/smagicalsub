type SubscriptionMetricOutcome = "blocked" | "cached" | "success";

export type SubscriptionMetricInput = {
  ownerId: string | null;
  path: string;
  request: {
    header: (name: string) => string | undefined;
  };
  tokenId: string;
  outcome: SubscriptionMetricOutcome;
};

const publicOwnerKey = "";
const logSampleWindowMinutes = 5;

export async function recordSubscriptionMetric(db: D1Database, input: SubscriptionMetricInput) {
  await Promise.all([
    incrementSubscriptionMetric(db, input),
    updateTokenLastUsedSample(db, input.tokenId),
    insertAccessLogSample(db, input)
  ]);
}

export async function cleanupSubscriptionTelemetry(db: D1Database) {
  await Promise.all([
    db.prepare(`DELETE FROM access_logs WHERE created_at < datetime('now', '-7 days')`).run(),
    db.prepare(`DELETE FROM subscription_metrics WHERE bucket < strftime('%Y-%m-%d %H:00:00', 'now', '-30 days')`).run()
  ]);
}

async function incrementSubscriptionMetric(db: D1Database, input: SubscriptionMetricInput) {
  const cached = input.outcome === "cached" ? 1 : 0;
  const blocked = input.outcome === "blocked" ? 1 : 0;
  const success = input.outcome === "blocked" ? 0 : 1;

  await db
    .prepare(
      `INSERT INTO subscription_metrics (bucket, owner_id, total, success, cached, blocked, updated_at)
       VALUES (strftime('%Y-%m-%d %H:00:00', 'now'), ?1, 1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
       ON CONFLICT(bucket, owner_id) DO UPDATE SET
         total = total + 1,
         success = success + excluded.success,
         cached = cached + excluded.cached,
         blocked = blocked + excluded.blocked,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(ownerMetricKey(input.ownerId), success, cached, blocked)
    .run();
}

async function updateTokenLastUsedSample(db: D1Database, tokenId: string) {
  await db
    .prepare(
      `UPDATE subscribe_tokens
       SET last_used_at = CURRENT_TIMESTAMP
       WHERE id = ?1
         AND (last_used_at IS NULL OR last_used_at < datetime('now', '-${logSampleWindowMinutes} minutes'))`
    )
    .bind(tokenId)
    .run();
}

async function insertAccessLogSample(db: D1Database, input: SubscriptionMetricInput) {
  const existing = await db
    .prepare(
      `SELECT id
       FROM access_logs
       WHERE token_id = ?1
         AND created_at >= datetime('now', '-${logSampleWindowMinutes} minutes')
       LIMIT 1`
    )
    .bind(input.tokenId)
    .first<{ id: string }>();

  if (existing) {
    return;
  }

  await db
    .prepare(
      `INSERT INTO access_logs (id, token_id, path, ip, user_agent)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .bind(
      crypto.randomUUID(),
      input.tokenId,
      input.path,
      input.request.header("CF-Connecting-IP") ?? null,
      input.request.header("User-Agent") ?? null
    )
    .run();
}

function ownerMetricKey(ownerId: string | null) {
  return ownerId ?? publicOwnerKey;
}
