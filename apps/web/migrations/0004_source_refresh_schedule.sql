ALTER TABLE subscription_sources ADD COLUMN refresh_interval_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscription_sources ADD COLUMN next_refresh_at TEXT;
