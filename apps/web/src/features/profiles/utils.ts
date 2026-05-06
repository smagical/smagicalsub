import type { CreateProfileInput, ProfileDto } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";
import type { ProfileFormState, ProfileRuleFormState } from "./types";

export const profileRuleKinds = [
  { label: "域名后缀", placeholder: "example.com", value: "DOMAIN-SUFFIX" },
  { label: "完整域名", placeholder: "example.com", value: "DOMAIN" },
  { label: "关键词", placeholder: "google", value: "DOMAIN-KEYWORD" },
  { label: "IP 段", placeholder: "8.8.8.8/32", value: "IP-CIDR" },
  { label: "IPv6 段", placeholder: "2001:db8::/32", value: "IP-CIDR6" },
  { label: "地理 IP", placeholder: "CN", value: "GEOIP" },
  { label: "地理站点", placeholder: "google", value: "GEOSITE" },
  { label: "源 IP 段", placeholder: "192.168.1.0/24", value: "SRC-IP-CIDR" },
  { label: "源端口", placeholder: "443", value: "SRC-PORT" },
  { label: "目标端口", placeholder: "443", value: "DST-PORT" },
  { label: "进程名", placeholder: "Telegram.exe", value: "PROCESS-NAME" },
  { label: "规则集", placeholder: "private", value: "RULE-SET" },
  { label: "兜底", placeholder: "", value: "MATCH" }
] as const;

export const profileRuleTemplates = [
  { label: "私有 IP", sample: "private", value: "GEOIP,private,DIRECT" },
  { label: "中国站点", sample: "cn", value: "GEOSITE,cn,DIRECT" },
  { label: "中国 IP", sample: "CN", value: "GEOIP,CN,DIRECT" },
  { label: "广告拦截", sample: "ads", value: "GEOSITE,category-ads-all,REJECT" },
  { label: "域名后缀", sample: "example.com", value: "DOMAIN-SUFFIX,example.com,Proxy" },
  { label: "关键词", sample: "google", value: "DOMAIN-KEYWORD,google,Proxy" },
  { label: "Google", sample: "geosite", value: "GEOSITE,google,Proxy" },
  { label: "Telegram", sample: "geoip", value: "GEOIP,telegram,Proxy" },
  { label: "Netflix", sample: "geosite", value: "GEOSITE,netflix,Proxy" },
  { label: "兜底", sample: "MATCH", value: "MATCH,Proxy" }
] as const;

export const profileRulePresets = [
  {
    label: "默认分流",
    description: "私有地址和国内流量直连，广告拦截，其余走默认代理。",
    rules: [
      "GEOIP,private,DIRECT",
      "GEOSITE,private,DIRECT",
      "GEOSITE,category-ads-all,REJECT",
      "GEOSITE,cn,DIRECT",
      "GEOIP,CN,DIRECT",
      "MATCH,Proxy"
    ]
  },
  {
    label: "国内直连",
    description: "保留国内直连和最终代理，适合轻量规则配置。",
    rules: ["GEOIP,private,DIRECT", "GEOSITE,cn,DIRECT", "GEOIP,CN,DIRECT", "MATCH,Proxy"]
  },
  {
    label: "全局代理",
    description: "只保留私有地址直连，其余流量全部进入默认代理。",
    rules: ["GEOIP,private,DIRECT", "MATCH,Proxy"]
  }
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
