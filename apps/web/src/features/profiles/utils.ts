import type { CreateProfileInput, ProfileDto } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";
import type { ProfileFormState, ProfileRuleFormState } from "./types";

export function toCreateProfileInput(form: ProfileFormState): CreateProfileInput {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    default_strategy: form.default_strategy.trim() || "Proxy",
    enabled: form.enabled
  };
}

export function toCreateProfileRuleInput(form: ProfileRuleFormState) {
  const position = form.position.trim();

  return {
    rule: form.rule.trim(),
    position: position ? Number(position) : undefined,
    enabled: form.enabled
  };
}

export function filterProfiles(profiles: ProfileDto[], searchQuery: string, statusFilter: string) {
  return profiles.filter((profile) => matchesProfileStatus(profile, statusFilter) && matchesProfileSearch(profile, searchQuery));
}

export function exportProfilesCsv(profiles: ProfileDto[]) {
  const rows = profiles.map((profile) => [
    profile.name,
    profile.default_strategy,
    profile.description ?? "",
    profile.enabled ? "启用" : "停用",
    profile.created_at,
    profile.updated_at
  ]);

  downloadCsv("profiles", [["名称", "默认策略", "描述", "状态", "创建时间", "更新时间"], ...rows]);
}

function matchesProfileStatus(profile: ProfileDto, statusFilter: string) {
  if (statusFilter === "enabled") {
    return profile.enabled === 1;
  }

  if (statusFilter === "disabled") {
    return profile.enabled !== 1;
  }

  return true;
}

function matchesProfileSearch(profile: ProfileDto, searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [profile.name, profile.default_strategy, profile.description ?? "", profile.updated_at].some((value) =>
    value.toLowerCase().includes(query)
  );
}
