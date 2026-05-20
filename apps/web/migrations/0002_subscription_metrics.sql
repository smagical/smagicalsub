CREATE TABLE IF NOT EXISTS subscription_metrics (
  bucket TEXT NOT NULL,
  owner_id TEXT NOT NULL DEFAULT '',
  total INTEGER NOT NULL DEFAULT 0,
  success INTEGER NOT NULL DEFAULT 0,
  cached INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (bucket, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_metrics_bucket ON subscription_metrics(bucket);
