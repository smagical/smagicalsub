ALTER TABLE nodes ADD COLUMN owner_id TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_nodes_owner_id ON nodes(owner_id);
