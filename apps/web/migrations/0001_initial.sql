CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  protected INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE subscription_sources (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  groups TEXT NOT NULL DEFAULT '[]',
  enabled INTEGER NOT NULL DEFAULT 1,
  refresh_interval_minutes INTEGER NOT NULL DEFAULT 0,
  next_refresh_at TEXT,
  last_status TEXT,
  last_error TEXT,
  last_fetched_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE nodes (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  source_id TEXT,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL,
  server TEXT,
  port INTEGER,
  tags TEXT NOT NULL DEFAULT '[]',
  config_json TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (source_id) REFERENCES subscription_sources(id) ON DELETE CASCADE
);

CREATE TABLE profiles (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  default_strategy TEXT NOT NULL DEFAULT 'Proxy',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE profile_rules (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  format TEXT NOT NULL DEFAULT 'common',
  rule TEXT NOT NULL,
  content_json TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE profile_modules (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  profile_id TEXT,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'advanced-override',
  content_json TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 1,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE subscribe_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  profile_id TEXT,
  token TEXT NOT NULL UNIQUE,
  custom_path TEXT,
  node_ids_json TEXT NOT NULL DEFAULT '[]',
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE subscribe_token_modules (
  token_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  format TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'advanced-override',
  PRIMARY KEY (token_id, format, type),
  FOREIGN KEY (token_id) REFERENCES subscribe_tokens(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES profile_modules(id) ON DELETE CASCADE
);

CREATE TABLE refresh_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  source_id TEXT,
  status TEXT NOT NULL,
  message TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  FOREIGN KEY (source_id) REFERENCES subscription_sources(id) ON DELETE SET NULL
);

CREATE TABLE access_logs (
  id TEXT PRIMARY KEY NOT NULL,
  token_id TEXT,
  path TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES subscribe_tokens(id) ON DELETE SET NULL
);

CREATE INDEX idx_subscription_sources_owner_id ON subscription_sources(owner_id);
CREATE INDEX idx_nodes_owner_id ON nodes(owner_id);
CREATE INDEX idx_nodes_source_id ON nodes(source_id);
CREATE INDEX idx_nodes_enabled ON nodes(enabled);
CREATE INDEX idx_profile_rules_profile_id ON profile_rules(profile_id);
CREATE INDEX idx_profile_modules_owner_id ON profile_modules(owner_id);
CREATE INDEX idx_profile_modules_profile_id ON profile_modules(profile_id);
CREATE INDEX idx_profile_modules_lookup ON profile_modules(format, type, enabled, is_default);
CREATE UNIQUE INDEX idx_profile_modules_default_user ON profile_modules(owner_id, format, type) WHERE is_default = 1 AND owner_id IS NOT NULL;
CREATE UNIQUE INDEX idx_profile_modules_default_admin ON profile_modules(format, type) WHERE is_default = 1 AND owner_id IS NULL;
CREATE INDEX idx_subscribe_tokens_token ON subscribe_tokens(token);
CREATE UNIQUE INDEX idx_subscribe_tokens_custom_path ON subscribe_tokens(custom_path);
CREATE INDEX idx_subscribe_token_modules_token_id ON subscribe_token_modules(token_id);
CREATE INDEX idx_access_logs_token_id ON access_logs(token_id);
