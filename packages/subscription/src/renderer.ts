import { renderClashConfig } from "./renderers/clash";
import { renderPlainSubscription, renderV2rayNSubscription } from "./renderers/plain";
import { renderSingBoxConfig } from "./renderers/sing-box";
import { renderXrayConfig } from "./renderers/xray";
import type { RenderConfigModule, RenderableNode, RenderProfileRule, RenderSubscriptionInput, SubscriptionFormat } from "./renderers/types";

export type { RenderableNode, RenderProfileRule, RenderSubscriptionBaseInput, RenderSubscriptionInput, SubscriptionFormat } from "./renderers/types";
export { renderClashConfig } from "./renderers/clash";
export { renderPlainSubscription, renderV2rayNSubscription } from "./renderers/plain";
export { renderSingBoxConfig } from "./renderers/sing-box";
export { renderXrayConfig } from "./renderers/xray";
export { singBoxGeoRuleSetsForRules } from "./renderers/rules";

// 统一格式别名入口，避免路由层散落 v2ray/base64/singbox 等兼容判断。
export function normalizeSubscriptionFormat(value: string | null | undefined): SubscriptionFormat {
  switch (value?.toLowerCase()) {
    case "v2ray":
    case "v2rayn":
    case "base64":
      return "base64";
    case "text":
    case "plain":
    case "raw":
      return "plain";
    case "singbox":
    case "sing-box":
      return "sing-box";
    case "xray":
    case "xray-core":
      return "xray";
    case "clash":
    case "yaml":
    case "yml":
    default:
      return "clash";
  }
}

// 路由层只关心目标格式，具体输出差异收敛到各 renderer 小模块内。
export function renderSubscription(input: RenderSubscriptionInput): string {
  const normalizedProfileRules = normalizeProfileRules(input);
  const dedupedInput = { ...input, nodes: dedupeRenderableNodes(input.nodes), profileRules: normalizedProfileRules, rules: normalizedProfileRules.map((rule) => rule.rule) };

  switch (input.format) {
    case "base64":
      return renderV2rayNSubscription(dedupedInput);
    case "plain":
      return renderPlainSubscription(dedupedInput);
    case "sing-box":
      return renderSingBoxConfig(dedupedInput);
    case "xray":
      return renderXrayConfig(dedupedInput);
    case "clash":
      return renderClashConfig(dedupedInput);
  }
}

export function applyBuiltInRoutingTemplate(input: RenderSubscriptionInput): RenderSubscriptionInput {
  if (!needsBuiltInRoutingTemplate(input)) {
    return input;
  }

  return {
    ...input,
    modules: [...builtInRoutingModules(input.format), ...(input.modules ?? [])],
    profileRules: [...builtInRoutingRules(input.format, input.defaultStrategy ?? "Proxy"), ...(input.profileRules ?? [])]
  };
}

function normalizeProfileRules(input: RenderSubscriptionInput): RenderProfileRule[] {
  if (input.profileRules) {
    return input.profileRules;
  }

  return (input.rules ?? []).map((rule) => ({ content: {}, format: "common", rule }));
}

function needsBuiltInRoutingTemplate(input: RenderSubscriptionInput) {
  if (!isRoutingFormat(input.format)) {
    return false;
  }

  return !hasRoutingRules(input) && !hasRoutingModules(input);
}

function hasRoutingRules(input: RenderSubscriptionInput) {
  if (!isRoutingFormat(input.format)) {
    return false;
  }

  const format = input.format;

  if (input.profileRules) {
    return normalizeProfileRules(input).some((rule) => matchesRuleFormat(rule, format));
  }

  return (input.rules ?? []).some((rule) => rule.trim().length > 0);
}

function hasRoutingModules(input: RenderSubscriptionInput) {
  if (!isRoutingFormat(input.format)) {
    return false;
  }

  const format = input.format;

  return (input.modules ?? []).some((module) =>
    matchesModuleFormat(module, format) && isRoutingModule(module, format)
  );
}

function isRoutingFormat(format: SubscriptionFormat): format is Exclude<SubscriptionFormat, "base64" | "plain"> {
  return format === "clash" || format === "sing-box" || format === "xray";
}

function matchesRuleFormat(rule: RenderProfileRule, format: SubscriptionFormat) {
  return format !== "base64" && format !== "plain" && (rule.format === "common" || rule.format === format);
}

function matchesModuleFormat(module: RenderConfigModule, format: SubscriptionFormat) {
  return format !== "base64" && format !== "plain" && (module.format === "common" || module.format === format);
}

function isRoutingModule(module: RenderConfigModule, format: Exclude<SubscriptionFormat, "base64" | "plain">) {
  if (module.type === "policy-group" || module.type === "rule-provider") {
    return true;
  }

  return module.type === "advanced-override" && hasRoutingOverride(module.content, format);
}

function hasRoutingOverride(content: Record<string, unknown>, format: Exclude<SubscriptionFormat, "base64" | "plain">) {
  switch (format) {
    case "clash":
      return Boolean(content.rules || content["rule-providers"] || content["proxy-groups"]);
    case "sing-box": {
      const route = recordValue(content.route);
      return Boolean(route.rules || route.rule_set || content.rules || content.rule_set);
    }
    case "xray": {
      const routing = recordValue(content.routing);
      return Boolean(routing.rules || routing.balancers || content.rules || content.balancers);
    }
  }
}

function builtInRoutingRules(format: SubscriptionFormat, fallbackPolicy: string): RenderProfileRule[] {
  switch (format) {
    case "clash":
      return [
        builtInRule("clash", "GEOIP,private,DIRECT"),
        builtInRule("clash", "RULE-SET,reject,REJECT"),
        builtInRule("clash", "RULE-SET,cn,DIRECT"),
        builtInRule("clash", "GEOIP,CN,DIRECT"),
        builtInRule("clash", `RULE-SET,gfw,${fallbackPolicy}`),
        builtInRule("clash", `MATCH,${fallbackPolicy}`)
      ];
    case "sing-box":
    case "xray":
      return [
        builtInRule("common", "GEOIP,private,DIRECT"),
        builtInRule("common", "GEOSITE,category-ads-all,REJECT"),
        builtInRule("common", "GEOSITE,cn,DIRECT"),
        builtInRule("common", "GEOIP,cn,DIRECT"),
        builtInRule("common", `GEOSITE,gfw,${fallbackPolicy}`),
        builtInRule("common", `MATCH,${fallbackPolicy}`)
      ];
    case "base64":
    case "plain":
      return [];
  }
}

function builtInRoutingModules(format: SubscriptionFormat): RenderConfigModule[] {
  if (format !== "clash") {
    return [];
  }

  return [
    {
      content: {
        cn: clashRuleProvider("https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ChinaDomain.list"),
        gfw: clashRuleProvider("https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ProxyGFWlist.list"),
        reject: clashRuleProvider("https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/BanAD.list")
      },
      format: "clash",
      type: "rule-provider"
    }
  ];
}

function builtInRule(format: RenderProfileRule["format"], rule: string): RenderProfileRule {
  return {
    content: {},
    format,
    rule
  };
}

function clashRuleProvider(url: string) {
  return {
    behavior: "classical",
    format: "text",
    interval: 86400,
    type: "http",
    url
  };
}

function recordValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

// 输出层兜底去重，确保多个订阅源带入相同节点时不会重复生成到客户端配置。
export function dedupeRenderableNodes(nodes: RenderableNode[]) {
  const unique = new Map<string, RenderableNode>();

  for (const node of nodes) {
    const key = renderableNodeKey(node);
    const current = unique.get(key);

    unique.set(key, {
      ...(current ?? node),
      groups: uniqueGroups([...(current?.groups ?? []), ...(node.groups ?? [])])
    });
  }

  return Array.from(unique.values());
}

export function renderableNodeKey(node: Pick<RenderableNode, "config_json" | "name" | "protocol">) {
  return nodeConfigKey(parseNodeConfig(node.config_json), node.protocol, node.name);
}

export function nodeConfigKey(config: Record<string, unknown>, protocol?: string, fallbackName = "") {
  const normalized = stripInternalFields(config);
  const type = String(normalized.type ?? protocol ?? "").toLowerCase();
  const server = String(normalized.server ?? "").toLowerCase();
  const port = String(normalized.port ?? "");
  const identityFields = [
    "uuid",
    "id",
    "password",
    "cipher",
    "method",
    "username",
    "network",
    "security",
    "tls",
    "sni",
    "servername",
    "server_name",
    "host",
    "path",
    "serviceName",
    "grpc-service-name",
    "plugin",
    "protocol",
    "obfs",
    "flow",
    "alpn",
    "fingerprint",
    "client-fingerprint",
    "public-key",
    "short-id",
    "auth",
    "auth-str",
    "up",
    "down",
    "private-key",
    "reserved"
  ];
  const identity = identityFields
    .filter((field) => normalized[field] !== undefined && normalized[field] !== null && normalized[field] !== "")
    .map((field) => `${field}:${stableValue(normalized[field])}`)
    .join("|");

  if (server || port || identity) {
    return `${type}|${server}|${port}|${identity}`;
  }

  return `${type}|${fallbackName.toLowerCase()}`;
}

function parseNodeConfig(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function stripInternalFields(config: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(config).filter(([key]) => !key.startsWith("__")));
}

function stableValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableValue).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${key}:${stableValue(item)}`)
      .join(",");
  }

  return String(value).toLowerCase();
}

function uniqueGroups(groups: string[]) {
  return Array.from(new Set(groups.map((group) => group.trim()).filter(Boolean)));
}
