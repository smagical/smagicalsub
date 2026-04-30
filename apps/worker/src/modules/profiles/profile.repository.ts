import type { ProfileRow } from "./profile.types";

export async function listProfiles(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, owner_id, name, description, default_strategy, enabled, created_at, updated_at
       FROM profiles
       ORDER BY created_at DESC`
    )
    .all<ProfileRow>();

  return result.results ?? [];
}

