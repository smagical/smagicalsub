ALTER TABLE subscribe_tokens ADD COLUMN custom_path TEXT;
ALTER TABLE subscribe_tokens ADD COLUMN node_ids_json TEXT NOT NULL DEFAULT '[]';

CREATE UNIQUE INDEX idx_subscribe_tokens_custom_path ON subscribe_tokens(custom_path);
