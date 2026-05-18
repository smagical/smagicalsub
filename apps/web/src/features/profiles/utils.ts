import type { CreateProfileInput, ProfileDto, ProfileRuleDto, ProfileRuleFormat } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";
import type { ProfileFormState, ProfileRuleFormState } from "./types";

export const profileRuleKinds = [
  { label: "域名后缀", placeholder: "example.com", value: "DOMAIN-SUFFIX" },
  { label: "完整域名", placeholder: "example.com", value: "DOMAIN" },
  { label: "关键词", placeholder: "google", value: "DOMAIN-KEYWORD" },
  { label: "域名正则", placeholder: "^.+\\.example\\.com$", value: "DOMAIN-REGEX" },
  { label: "IP 段", placeholder: "8.8.8.8/32", value: "IP-CIDR" },
  { label: "IPv6 段", placeholder: "2001:db8::/32", value: "IP-CIDR6" },
  { label: "地理 IP", placeholder: "CN", value: "GEOIP" },
  { label: "源地理 IP", placeholder: "private", value: "SRC-GEOIP" },
  { label: "地理站点", placeholder: "google", value: "GEOSITE" },
  { label: "源 IP 段", placeholder: "192.168.1.0/24", value: "SRC-IP-CIDR" },
  { label: "源端口", placeholder: "443", value: "SRC-PORT" },
  { label: "目标端口", placeholder: "443", value: "DST-PORT" },
  { label: "入站端口", placeholder: "mixed-in", value: "IN-PORT" },
  { label: "入站标签", placeholder: "socks-in", value: "INBOUND-TAG" },
  { label: "进程名", placeholder: "Telegram.exe", value: "PROCESS-NAME" },
  { label: "进程路径", placeholder: "C:/Apps/Telegram/Telegram.exe", value: "PROCESS-PATH" },
  { label: "网络类型", placeholder: "tcp", value: "NETWORK" },
  { label: "协议嗅探", placeholder: "bittorrent", value: "PROTOCOL" },
  { label: "规则集", placeholder: "private", value: "RULE-SET" },
  { label: "兜底", placeholder: "", value: "MATCH" }
] as const;

export const profileRuleTemplates = [
  { label: "私有 IP", sample: "private", value: "GEOIP,private,DIRECT" },
  { label: "中国站点", sample: "cn", value: "GEOSITE,cn,DIRECT" },
  { label: "中国 IP", sample: "CN", value: "GEOIP,CN,DIRECT" },
  { label: "广告拦截", sample: "ads", value: "GEOSITE,category-ads-all,REJECT" },
  { label: "TCP", sample: "tcp", value: "NETWORK,tcp,Proxy" },
  { label: "UDP", sample: "udp", value: "NETWORK,udp,Proxy" },
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

export const profileRuleFormats: Array<{ description: string; label: string; value: ProfileRuleFormat }> = [
  { description: "一次配置，自动转换为 Clash、sing-box 和 Xray。", label: "智能规则", value: "common" },
  { description: "原样输出到 Clash/Mihomo 的 rules。", label: "Clash 原生", value: "clash" },
  { description: "写入 sing-box route.rules 的 JSON 对象。", label: "sing-box 原生", value: "sing-box" },
  { description: "写入 Xray routing.rules 的 JSON 对象。", label: "Xray 原生", value: "xray" }
];

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

export function toDuplicateProfileInput(profile: ProfileDto, profiles: ProfileDto[]): CreateProfileInput {
  return {
    name: buildDuplicateProfileName(profile, profiles),
    description: profile.description,
    default_strategy: profile.default_strategy,
    enabled: Boolean(profile.enabled)
  };
}

export function toCreateProfileRuleInput(form: ProfileRuleFormState) {
  const position = form.position.trim();
  const content = parseRuleContent(form.content);

  return {
    content,
    format: form.format,
    rule: form.rule.trim(),
    position: position ? Number(position) : undefined,
    enabled: form.enabled
  };
}

export function toProfileRuleEditForm(rule: ProfileRuleDto) {
  return {
    content: JSON.stringify(rule.content ?? {}, null, 2),
    format: rule.format ?? "common",
    rule: rule.rule,
    position: String(rule.position)
  };
}

export function parseRuleContent(value: string) {
  try {
    const parsed = JSON.parse(value || "{}") as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
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

function buildDuplicateProfileName(profile: ProfileDto, profiles: ProfileDto[]) {
  const existingNames = new Set(profiles.map((item) => item.name.trim()));
  const sourceName = profile.name.trim() || "配置档";

  for (let index = 1; index <= 999; index += 1) {
    const suffix = index === 1 ? " 副本" : ` 副本 ${index}`;
    const base = sourceName.slice(0, Math.max(1, 80 - suffix.length)).trimEnd();
    const candidate = `${base}${suffix}`;

    if (!existingNames.has(candidate)) {
      return candidate;
    }
  }

  return `${sourceName.slice(0, 66).trimEnd()} 副本 ${Date.now().toString().slice(-6)}`;
}
