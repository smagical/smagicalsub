import type { CreateProfileModuleInput, ProfileModuleDto, ProfileModuleFormat, ProfileModuleType, UpdateProfileModuleInput } from "@smagicalsub/shared";
import { ownerWhere, type OwnerScope } from "../../lib/auth-scope";
import { hydrateProfileModule, parseContent } from "./profile-module.mapper";
import type { ProfileModuleRow } from "./profile-module.types";

export async function listProfileModules(db: D1Database, scope: OwnerScope) {
  const filter = ownerWhere(scope, "profile_modules.owner_id");
  const result = await db
    .prepare(`${moduleSelectSql} WHERE 1 = 1${filter.sql} ORDER BY profile_modules.updated_at DESC, profile_modules.created_at DESC`)
    .bind(...filter.params)
    .all<ProfileModuleRow>();

  return (result.results ?? []).map(hydrateProfileModule);
}

export async function findProfileModuleById(db: D1Database, id: string, scope: OwnerScope) {
  const filter = ownerWhere(scope, "profile_modules.owner_id");
  const row = await db
    .prepare(`${moduleSelectSql} WHERE profile_modules.id = ?1${filter.sql}`)
    .bind(id, ...filter.params)
    .first<ProfileModuleRow>();

  return row ? hydrateProfileModule(row) : null;
}

export async function createProfileModule(db: D1Database, input: CreateProfileModuleInput, ownerId: string | null) {
  const id = crypto.randomUUID();
  const profileId = input.is_default ? null : normalizeProfileId(input.profile_id);

  if (input.is_default) {
    await unsetSiblingDefaultModules(db, id, ownerId, input.format, input.type);
  }

  await db
    .prepare(
      `INSERT INTO profile_modules (id, owner_id, profile_id, name, format, type, content_json, enabled, is_default)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(
      id,
      ownerId,
      profileId,
      input.name,
      input.format,
      input.type,
      JSON.stringify(input.content),
      input.enabled ? 1 : 0,
      input.is_default ? 1 : 0
    )
    .run();

  return findProfileModuleByIdWithoutScope(db, id);
}

export async function updateProfileModule(db: D1Database, id: string, input: UpdateProfileModuleInput, scope: OwnerScope) {
  const current = await findProfileModuleById(db, id, scope);

  if (!current) {
    return null;
  }

  const nextFormat = input.format ?? current.format;
  const nextType = input.type ?? current.type;
  const nextIsDefault = input.is_default === undefined ? Boolean(current.is_default) : input.is_default;
  const nextProfileId = nextIsDefault ? null : input.profile_id === undefined ? current.profile_id : normalizeProfileId(input.profile_id);

  if (nextIsDefault) {
    await unsetSiblingDefaultModules(db, id, scope.ownerId, nextFormat, nextType);
  }

  await db
    .prepare(
      `UPDATE profile_modules
       SET profile_id = ?1,
           name = ?2,
           format = ?3,
           type = ?4,
           content_json = ?5,
           enabled = ?6,
           is_default = ?7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?8`
    )
    .bind(
      nextProfileId,
      input.name ?? current.name,
      nextFormat,
      nextType,
      input.content === undefined ? JSON.stringify(current.content) : JSON.stringify(input.content),
      input.enabled === undefined ? current.enabled : input.enabled ? 1 : 0,
      nextIsDefault ? 1 : 0,
      id
    )
    .run();

  return findProfileModuleById(db, id, scope);
}

export async function deleteProfileModule(db: D1Database, id: string, scope: OwnerScope) {
  const current = await findProfileModuleById(db, id, scope);

  if (!current) {
    return null;
  }

  await db.prepare(`DELETE FROM profile_modules WHERE id = ?1`).bind(id).run();
  return current;
}

export async function countProfileModulesByIds(db: D1Database, moduleIds: string[], scope: OwnerScope) {
  if (moduleIds.length === 0) {
    return 0;
  }

  const filter = ownerWhere(scope, "owner_id");
  const placeholders = moduleIds.map((_, index) => `?${index + 1}`).join(", ");
  const row = await db
    .prepare(`SELECT COUNT(*) AS count FROM profile_modules WHERE id IN (${placeholders})${filter.sql}`)
    .bind(...moduleIds, ...filter.params)
    .first<{ count: number }>();

  return Number(row?.count ?? 0);
}

export async function listResolvedModulesForSubscription({
  db,
  format,
  moduleBindings,
  ownerId,
  profileId
}: {
  db: D1Database;
  format: ProfileModuleFormat;
  moduleBindings: Array<{ format: string; module_id: string; type: string }>;
  ownerId: string | null;
  profileId: string | null;
}) {
  const explicitBindings = orderedBindingsForFormat(moduleBindings, format);
  const explicitModules = new Map<string, ProfileModuleDto>();
  const rows: ProfileModuleDto[] = [];

  for (const binding of explicitBindings) {
    const module = await findActiveProfileModuleForSubscription(db, binding.module_id, ownerId);

    if (module) {
      explicitModules.set(moduleKey(module), module);
    }
  }

  for (const type of moduleTypes) {
    for (const fallbackFormat of moduleFormatOrder(format)) {
      const key = `${fallbackFormat}:${type}`;
      const module = explicitModules.get(key) ?? await findFallbackProfileModule(db, fallbackFormat, type, profileId, ownerId);

      if (module && !rows.some((row) => row.id === module.id)) {
        rows.push(module);
      }
    }
  }

  return rows;
}

async function findActiveProfileModuleForSubscription(db: D1Database, id: string, ownerId: string | null) {
  const row = await db
    .prepare(
      `${moduleSelectSql}
       WHERE profile_modules.id = ?1
         AND profile_modules.enabled = 1
         AND (profile_modules.owner_id = ?2 OR (?2 IS NULL AND profile_modules.owner_id IS NULL))`
    )
    .bind(id, ownerId)
    .first<ProfileModuleRow>();

  return row ? hydrateProfileModule(row) : null;
}

async function findFallbackProfileModule(
  db: D1Database,
  format: ProfileModuleFormat,
  type: ProfileModuleType,
  profileId: string | null,
  ownerId: string | null
) {
  if (profileId) {
    const profileModule = await db
      .prepare(
        `${moduleSelectSql}
         WHERE profile_modules.format = ?1
           AND profile_modules.type = ?2
           AND profile_modules.profile_id = ?3
           AND profile_modules.enabled = 1
           AND (profile_modules.owner_id = ?4 OR (?4 IS NULL AND profile_modules.owner_id IS NULL))
         ORDER BY profile_modules.updated_at DESC
         LIMIT 1`
      )
      .bind(format, type, profileId, ownerId)
      .first<ProfileModuleRow>();

    if (profileModule) {
      return hydrateProfileModule(profileModule);
    }
  }

  const defaultModule = await db
    .prepare(
      `${moduleSelectSql}
       WHERE profile_modules.format = ?1
         AND profile_modules.type = ?2
         AND profile_modules.profile_id IS NULL
         AND profile_modules.is_default = 1
         AND profile_modules.enabled = 1
         AND (profile_modules.owner_id = ?3 OR (?3 IS NULL AND profile_modules.owner_id IS NULL))
       ORDER BY profile_modules.updated_at DESC
       LIMIT 1`
    )
    .bind(format, type, ownerId)
    .first<ProfileModuleRow>();

  return defaultModule ? hydrateProfileModule(defaultModule) : null;
}

function moduleKey(module: ProfileModuleDto) {
  return `${module.format}:${module.type}`;
}

function orderedBindingsForFormat(bindings: Array<{ format: string; module_id: string; type: string }>, format: ProfileModuleFormat) {
  return [
    ...bindings.filter((binding) => binding.format === "common"),
    ...bindings.filter((binding) => binding.format === format)
  ];
}

function moduleFormatOrder(format: ProfileModuleFormat) {
  return format === "common" ? ["common"] as const : ["common", format] as const;
}

function normalizeProfileId(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  return value.trim();
}

async function unsetSiblingDefaultModules(
  db: D1Database,
  currentId: string,
  ownerId: string | null,
  format: ProfileModuleFormat,
  type: ProfileModuleType
) {
  await db
    .prepare(
      `UPDATE profile_modules
       SET is_default = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id != ?1
         AND format = ?2
         AND type = ?3
         AND is_default = 1
         AND (owner_id = ?4 OR (?4 IS NULL AND owner_id IS NULL))`
    )
    .bind(currentId, format, type, ownerId)
    .run();
}

async function findProfileModuleByIdWithoutScope(db: D1Database, id: string) {
  const row = await db.prepare(`${moduleSelectSql} WHERE profile_modules.id = ?1`).bind(id).first<ProfileModuleRow>();
  return row ? hydrateProfileModule(row) : null;
}

const moduleTypes: ProfileModuleType[] = ["advanced-override", "dns", "inbound", "tun", "policy-group", "rule-provider", "proxy-provider", "observatory"];

const moduleSelectSql = `SELECT profile_modules.id,
                                profile_modules.owner_id,
                                profile_modules.profile_id,
                                profiles.name AS profile_name,
                                profile_modules.name,
                                profile_modules.format,
                                profile_modules.type,
                                profile_modules.content_json,
                                profile_modules.enabled,
                                profile_modules.is_default,
                                profile_modules.created_at,
                                profile_modules.updated_at
                         FROM profile_modules
                         LEFT JOIN profiles ON profiles.id = profile_modules.profile_id`;

export function serializeModuleBindings(bindings: Array<{ format: ProfileModuleFormat; module_id: string; type: ProfileModuleType }>) {
  return JSON.stringify(bindings.map((binding) => ({ format: binding.format, module_id: binding.module_id, type: binding.type })));
}

export function parseModuleBindings(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
      .map((item) => ({
        format: String(item.format),
        module_id: String(item.module_id),
        type: String(item.type || "advanced-override")
      }))
      .filter((item) => item.format && item.module_id && item.type);
  } catch {
    return [];
  }
}

export { parseContent };
