import type { ProfileModuleDto } from "@smagicalsub/shared";
import type { ProfileModuleRow } from "./profile-module.types";

export function hydrateProfileModule(row: ProfileModuleRow): ProfileModuleDto {
  return {
    id: row.id,
    owner_id: row.owner_id,
    profile_id: row.profile_id,
    profile_name: row.profile_name,
    name: row.name,
    format: row.format,
    type: row.type,
    content: parseContent(row.content_json),
    enabled: row.enabled,
    is_default: row.is_default,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function parseContent(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}
