ALTER TABLE users ADD COLUMN protected INTEGER NOT NULL DEFAULT 0;
UPDATE users
SET protected = 1, updated_at = CURRENT_TIMESTAMP
WHERE id = (
  SELECT id FROM users
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM users
  WHERE role = 'admin' AND protected = 1
);
