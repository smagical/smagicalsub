import type { CreateProfileRuleInput, UpdateProfileRuleInput } from "@smagicalsub/shared";
import type { ProfileRuleRow } from "./profile-rule.types";

export async function listProfileRules(db: D1Database, profileId: string) {
  const result = await db
    .prepare(
      `SELECT id, profile_id, position, rule, enabled
       FROM profile_rules
       WHERE profile_id = ?1
       ORDER BY position ASC, rule ASC`
    )
    .bind(profileId)
    .all<ProfileRuleRow>();

  return result.results ?? [];
}

export async function listEnabledProfileRuleText(db: D1Database, profileId: string) {
  const rules = await listProfileRules(db, profileId);
  return rules.filter((rule) => rule.enabled === 1).map((rule) => rule.rule);
}

export async function createProfileRule(db: D1Database, profileId: string, input: CreateProfileRuleInput) {
  const id = crypto.randomUUID();
  const position = input.position ?? (await nextRulePosition(db, profileId));

  await db
    .prepare(
      `INSERT INTO profile_rules (id, profile_id, position, rule, enabled)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .bind(id, profileId, position, input.rule, input.enabled ? 1 : 0)
    .run();

  return findProfileRuleById(db, profileId, id);
}

export async function updateProfileRule(db: D1Database, profileId: string, ruleId: string, input: UpdateProfileRuleInput) {
  const current = await findProfileRuleById(db, profileId, ruleId);

  if (!current) {
    return null;
  }

  await db
    .prepare(
      `UPDATE profile_rules
       SET position = ?1,
           rule = ?2,
           enabled = ?3
       WHERE id = ?4
         AND profile_id = ?5`
    )
    .bind(
      input.position ?? current.position,
      input.rule ?? current.rule,
      input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0,
      ruleId,
      profileId
    )
    .run();

  return findProfileRuleById(db, profileId, ruleId);
}

export async function deleteProfileRule(db: D1Database, profileId: string, ruleId: string) {
  const result = await db
    .prepare(`DELETE FROM profile_rules WHERE id = ?1 AND profile_id = ?2`)
    .bind(ruleId, profileId)
    .run();

  return result.meta.changes > 0;
}

async function findProfileRuleById(db: D1Database, profileId: string, ruleId: string) {
  return db
    .prepare(
      `SELECT id, profile_id, position, rule, enabled
       FROM profile_rules
       WHERE id = ?1
         AND profile_id = ?2`
    )
    .bind(ruleId, profileId)
    .first<ProfileRuleRow>();
}

async function nextRulePosition(db: D1Database, profileId: string) {
  const row = await db
    .prepare(`SELECT COALESCE(MAX(position), -10) + 10 AS next_position FROM profile_rules WHERE profile_id = ?1`)
    .bind(profileId)
    .first<{ next_position: number }>();

  return row?.next_position ?? 0;
}
