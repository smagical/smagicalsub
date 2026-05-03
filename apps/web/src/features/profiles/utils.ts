import type { CreateProfileInput, ProfileDto } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";
import type { ProfileFormState, ProfileRuleFormState } from "./types";

export const profileRuleKinds = [
  { label: "域名后缀", placeholder: "example.com", value: "DOMAIN-SUFFIX" },
  { label: "完整域名", placeholder: "example.com", value: "DOMAIN" },
  { label: "关键词", placeholder: "google", value: "DOMAIN-KEYWORD" },
  { label: "IP 段", placeholder: "8.8.8.8/32", value: "IP-CIDR" },
  { label: "兜底", placeholder: "", value: "MATCH" }
] as const;

export type ProfileRuleKind = (typeof profileRuleKinds)[number]["value"];

export type StructuredProfileRule = {
  kind: ProfileRuleKind;
  policy: string;
  target: string;
};

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

export function parseProfileRule(rule: string): StructuredProfileRule {
  const [rawKind = "DOMAIN-SUFFIX", rawTarget = "", rawPolicy = "Proxy"] = rule.split(",");
  const kind = profileRuleKinds.some((item) => item.value === rawKind) ? (rawKind as ProfileRuleKind) : "DOMAIN-SUFFIX";

  return {
    kind,
    policy: kind === "MATCH" ? rawTarget || "Proxy" : rawPolicy || "Proxy",
    target: kind === "MATCH" ? "" : rawTarget
  };
}

export function buildProfileRule({ kind, policy, target }: StructuredProfileRule) {
  const normalizedPolicy = policy.trim() || "Proxy";

  if (kind === "MATCH") {
    return `MATCH,${normalizedPolicy}`;
  }

  return `${kind},${target.trim()},${normalizedPolicy}`;
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
