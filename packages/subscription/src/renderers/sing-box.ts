import type { RenderSubscriptionBaseInput, RenderableNode } from "./types";
import { toSingBoxEndpoint, toSingBoxOutbound } from "./sing-box-outbound";
import { createPolicyContext, renderSingBoxProfileRules, singBoxGeoRuleSetsForRules } from "./rules";
import { mergeConfig, moduleOverridesFor } from "./modules";
import { defaultGroupName, renderGroupName, uniqueStrings } from "./utils";

export function renderSingBoxConfig(input: RenderSubscriptionBaseInput): string {
  // 输出保持最小可运行：mixed inbound、主 selector、分组 selector、节点 outbound 和 direct。
  const primarySelector = input.defaultStrategy ?? "Proxy";
  const profileRules = input.profileRules ?? (input.rules ?? []).map((rule) => ({ content: {}, format: "common" as const, rule }));
  const outbounds = input.nodes
    .map(toSingBoxOutbound)
    .filter((outbound): outbound is Record<string, unknown> => outbound !== null);
  const endpoints = input.nodes
    .map(toSingBoxEndpoint)
    .filter((endpoint): endpoint is Record<string, unknown> => endpoint !== null);
  const outboundTags = outbounds.map((outbound) => String(outbound.tag));
  const endpointTags = endpoints.map((endpoint) => String(endpoint.tag));
  const selectableTags = uniqueStrings([...outboundTags, ...endpointTags]);
  const grouped = buildSingBoxSelectors(input.nodes, selectableTags);
  const policyContext = createPolicyContext(input.nodes, selectableTags, primarySelector);
  const routeRules = renderSingBoxProfileRules(profileRules, policyContext);
  const ruleSet = singBoxGeoRuleSetsForRules(profileRules);

  const config = sanitizeSingBoxConfig(mergeConfig(
    {
    log: {
      level: "info"
    },
    inbounds: [
      {
        type: "mixed",
        tag: "mixed-in",
        listen: "127.0.0.1",
        listen_port: 2080
      }
    ],
    endpoints,
    outbounds: [
      createSingBoxSelector(primarySelector, grouped.main.length > 0 ? grouped.main : ["direct"]),
      ...grouped.groups,
      ...outbounds,
      {
        type: "direct",
        tag: "direct"
      },
    ],
    route: {
      rule_set: ruleSet,
      rules: routeRules,
      final: primarySelector
    }
    },
    moduleOverridesFor(input.modules, "sing-box")
  ), ruleSet);

  return `${JSON.stringify(config, null, 2)}\n`;
}

// sing-box selector 复用 Clash 的分组模型：空分组节点统一归入“默认”。
function buildSingBoxSelectors(nodes: RenderableNode[], outboundTags: string[]) {
  const groups = new Map<string, string[]>();
  const tagSet = new Set(outboundTags);

  for (const node of nodes) {
    if (!tagSet.has(node.name)) {
      continue;
    }

    const nodeGroups = uniqueStrings(node.groups ?? []);
    const effectiveGroups = nodeGroups.length > 0 ? nodeGroups : [defaultGroupName];

    for (const group of effectiveGroups) {
      groups.set(group, [...(groups.get(group) ?? []), node.name]);
    }
  }

  const groupNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  const renderedGroupNames = groupNames.map(renderGroupName);

  return {
    main: renderedGroupNames,
    groups: groupNames.map((groupName) =>
      createSingBoxSelector(renderGroupName(groupName), uniqueStrings(groups.get(groupName) ?? []))
    )
  };
}

function createSingBoxSelector(tag: string, outbounds: string[]) {
  // 空分组回退到 direct，保证生成的 sing-box JSON 始终可启动。
  return {
    type: "selector",
    tag,
    outbounds: outbounds.length > 0 ? outbounds : ["direct"]
  };
}

function sanitizeSingBoxConfig<T extends Record<string, unknown>>(config: T, generatedRuleSets: Array<Record<string, unknown>> = []): T {
  const next: Record<string, unknown> = { ...config };
  const routeRules: Array<Record<string, unknown>> = [];

  if (isRecord(next.dns)) {
    next.dns = sanitizeSingBoxDns(next.dns);
  }

  if (Array.isArray(next.inbounds)) {
    next.inbounds = next.inbounds.map((inbound, index) => sanitizeSingBoxInbound(inbound, index, routeRules));
  }

  const route = isRecord(next.route) ? { ...next.route } : {};
  const existingRules = Array.isArray(route.rules) ? route.rules : [];
  const rules = prioritizeSingBoxRuleActions([...routeRules, ...existingRules]);

  if (rules.length > 0 || Object.keys(route).length > 0) {
    next.route = {
      ...route,
      rule_set: mergeSingBoxRuleSets(Array.isArray(route.rule_set) ? route.rule_set : [], generatedRuleSets),
      rules
    };
  }

  return next as T;
}

function mergeSingBoxRuleSets(current: unknown[], generated: Array<Record<string, unknown>>) {
  const byTag = new Map<string, Record<string, unknown>>();

  for (const item of [...generated, ...current]) {
    if (!isRecord(item)) {
      continue;
    }

    const tag = stringValue(item.tag);
    if (tag) {
      byTag.set(tag, item);
    }
  }

  return Array.from(byTag.values());
}

function sanitizeSingBoxDns(value: Record<string, unknown>) {
  const dns = { ...value };
  delete dns.fakeip;
  delete dns.independent_cache;
  return dns;
}

function sanitizeSingBoxInbound(value: unknown, index: number, routeRules: Array<Record<string, unknown>>) {
  if (!isRecord(value)) {
    return value;
  }

  const type = stringValue(value.type) ?? "mixed";
  const tag = stringValue(value.tag) ?? `${type}-in-${index + 1}`;
  const normalized: Record<string, unknown> = {
    ...value,
    tag
  };

  appendLegacyInboundRouteRules(normalized, tag, routeRules);

  for (const key of legacySingBoxInboundFields) {
    delete normalized[key];
  }

  return normalized;
}

function appendLegacyInboundRouteRules(inbound: Record<string, unknown>, tag: string, rules: Array<Record<string, unknown>>) {
  const strategy = stringValue(inbound.domain_strategy);
  const sniffTimeout = stringValue(inbound.sniff_timeout);

  if (strategy) {
    rules.push({
      inbound: [tag],
      action: "resolve",
      strategy
    });
  }

  if (inbound.sniff === true || inbound.sniff_override_destination === true || sniffTimeout) {
    rules.push({
      inbound: [tag],
      action: "sniff",
      timeout: sniffTimeout
    });
  }

  if (inbound.udp_disable_domain_unmapping === true) {
    rules.push({
      inbound: [tag],
      action: "route-options",
      udp_disable_domain_unmapping: true
    });
  }
}

function prioritizeSingBoxRuleActions(rules: unknown[]) {
  const normalized = rules.filter(isRecord);
  const nonFinalActions = normalized.filter(isNonFinalSingBoxRuleAction);
  const otherRules = normalized.filter((rule) => !isNonFinalSingBoxRuleAction(rule));
  return [...uniqueJsonRules(nonFinalActions), ...uniqueJsonRules(otherRules)];
}

function isNonFinalSingBoxRuleAction(rule: Record<string, unknown>) {
  const action = stringValue(rule.action);
  return action === "sniff" || action === "resolve" || action === "route-options";
}

function uniqueJsonRules(rules: Array<Record<string, unknown>>) {
  const seen = new Set<string>();
  const next: Array<Record<string, unknown>> = [];

  for (const rule of rules) {
    const key = JSON.stringify(rule);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    next.push(rule);
  }

  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const legacySingBoxInboundFields = [
  "allowLan",
  "domain_strategy",
  "inboundType",
  "port",
  "protocol",
  "settings",
  "sniff",
  "sniff_override_destination",
  "sniff_timeout",
  "sniffing",
  "udp",
  "udp_disable_domain_unmapping"
];
