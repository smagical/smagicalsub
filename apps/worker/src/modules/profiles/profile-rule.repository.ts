import type { CreateProfileRuleInput, ProfileRuleDto, UpdateProfileRuleInput } from "@smagicalsub/shared";
import type { ProfileRuleRow } from "./profile-rule.types";

export async function listProfileRules(db: D1Database, profileId: string) {
  const result = await db
    .prepare(
      `SELECT id, profile_id, position, format, rule, content_json, enabled
       FROM profile_rules
       WHERE profile_id = ?1
       ORDER BY position ASC, rule ASC`
    )
    .bind(profileId)
    .all<ProfileRuleRow>();

  return (result.results ?? []).map(hydrateProfileRule);
}

export async function listEnabledProfileRules(db: D1Database, profileId: string) {
  const rules = await listProfileRules(db, profileId);
  return rules.filter((rule) => rule.enabled === 1);
}

export async function createProfileRule(db: D1Database, profileId: string, input: CreateProfileRuleInput) {
  const id = crypto.randomUUID();
  const position = input.position ?? (await nextRulePosition(db, profileId));
  const format = input.format ?? "common";
  const content = input.content ?? {};

  await db
    .prepare(
      `INSERT INTO profile_rules (id, profile_id, position, format, rule, content_json, enabled)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
    .bind(id, profileId, position, format, input.rule, JSON.stringify(content), input.enabled ? 1 : 0)
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
           format = ?2,
           rule = ?3,
           content_json = ?4,
           enabled = ?5
       WHERE id = ?6
         AND profile_id = ?7`
    )
    .bind(
      input.position ?? current.position,
      input.format ?? current.format,
      input.rule ?? current.rule,
      input.content === undefined ? JSON.stringify(current.content) : JSON.stringify(input.content),
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
  const row = await db
    .prepare(
      `SELECT id, profile_id, position, format, rule, content_json, enabled
       FROM profile_rules
       WHERE id = ?1
         AND profile_id = ?2`
    )
    .bind(ruleId, profileId)
    .first<ProfileRuleRow>();

  return row ? hydrateProfileRule(row) : null;
}

async function nextRulePosition(db: D1Database, profileId: string) {
  const row = await db
    .prepare(`SELECT COALESCE(MAX(position), -10) + 10 AS next_position FROM profile_rules WHERE profile_id = ?1`)
    .bind(profileId)
    .first<{ next_position: number }>();

  return row?.next_position ?? 0;
}

function hydrateProfileRule(row: ProfileRuleRow): ProfileRuleDto {
  return {
    id: row.id,
    profile_id: row.profile_id,
    position: row.position,
    format: row.format ?? "common",
    rule: row.rule,
    content: parseRuleContent(row.content_json),
    enabled: row.enabled
  };
}

function parseRuleContent(value: string | null | undefined) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}
