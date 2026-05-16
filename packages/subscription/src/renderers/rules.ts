import type { RenderProfileRule, RenderableNode } from "./types";
import { defaultGroupName, renderGroupName, uniqueStrings } from "./utils";

export type ParsedRoutingRule = {
  kind: string;
  policy: string;
  target: string;
};

export type PolicyContext = {
  fallbackPolicy: string;
  nodeTagByName: Map<string, string>;
  selectorTags: Set<string>;
};

export type PolicyContextOptions = {
  nodeTagByName?: Map<string, string>;
  selectorTags?: Set<string>;
};

export type SingBoxRouteRule = Record<string, unknown>;
export type XrayRoutingRule = Record<string, unknown>;

export function rulesForFormat(rules: RenderProfileRule[] | undefined, format: RenderProfileRule["format"]) {
  const normalizedRules = normalizeProfileRules(rules);

  if (format === "common") {
    return normalizedRules.filter((rule) => rule.format === "common");
  }

  return normalizedRules.filter((rule) => rule.format === "common" || rule.format === format);
}

export function textRulesForFormat(rules: RenderProfileRule[] | undefined, format: RenderProfileRule["format"]) {
  return rulesForFormat(rules, format).map((rule) => rule.rule);
}

export function parseRoutingRule(rule: string): ParsedRoutingRule | null {
  const parts = rule.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  const kind = parts[0].toUpperCase();

  if (kind === "MATCH") {
    return {
      kind,
      policy: parts[1] || "Proxy",
      target: ""
    };
  }

  if (parts.length < 3) {
    return null;
  }

  return {
    kind,
    policy: parts[2] || "Proxy",
    target: parts[1]
  };
}

export function rulesWithFallback(rules: string[], fallbackPolicy: string) {
  const normalizedRules = uniqueStrings(rules);
  const hasMatchFallback = normalizedRules.some((rule) => rule.toUpperCase().startsWith("MATCH,"));

  return hasMatchFallback ? normalizedRules : [...normalizedRules, `MATCH,${fallbackPolicy}`];
}

export function createPolicyContext(nodes: RenderableNode[], outboundTags: string[], fallbackPolicy: string, options: PolicyContextOptions = {}): PolicyContext {
  return {
    fallbackPolicy,
    nodeTagByName: options.nodeTagByName ?? new Map(
      nodes
        .map((node): [string, string | undefined] => [node.name, outboundTags.find((tag) => tag === node.name || tag === `node:${node.name}`)])
        .filter((item): item is [string, string] => Boolean(item[1]))
    ),
    selectorTags: options.selectorTags ?? new Set([fallbackPolicy, ...buildRenderedGroupNames(nodes)])
  };
}

export function renderSingBoxRouteRules(rules: string[], context: PolicyContext) {
  return rulesWithFallback(rules, context.fallbackPolicy)
    .map(parseRoutingRule)
    .filter((rule): rule is ParsedRoutingRule => rule !== null)
    .map((rule) => toSingBoxRouteRule(rule, context))
    .filter((rule): rule is SingBoxRouteRule => rule !== null);
}

export function renderSingBoxProfileRules(rules: RenderProfileRule[] | undefined, context: PolicyContext) {
  const formatRules = rulesForFormat(rules, "sing-box");
  const hasExplicitFallback = hasCommonMatchRule(formatRules);
  const renderedRules = formatRules.flatMap((rule) => {
    if (rule.format === "sing-box") {
      const nativeRule = toNativeRuleContent(rule);

      return nativeRule ? [nativeRule] : [];
    }

    return renderSingBoxCommonRule(rule.rule, context);
  });

  return hasExplicitFallback ? renderedRules : addSingBoxFallbackRule(renderedRules, context);
}

export function renderXrayRoutingRules(rules: string[], context: PolicyContext) {
  return rulesWithFallback(rules, context.fallbackPolicy)
    .map(parseRoutingRule)
    .filter((rule): rule is ParsedRoutingRule => rule !== null)
    .map((rule) => toXrayRoutingRule(rule, context))
    .filter((rule): rule is XrayRoutingRule => rule !== null);
}

export function renderXrayProfileRules(rules: RenderProfileRule[] | undefined, context: PolicyContext) {
  const formatRules = rulesForFormat(rules, "xray");
  const hasExplicitFallback = hasCommonMatchRule(formatRules);
  const renderedRules = formatRules.flatMap((rule) => {
    if (rule.format === "xray") {
      const nativeRule = toNativeRuleContent(rule);

      return nativeRule ? [nativeRule] : [];
    }

    return renderXrayCommonRule(rule.rule, context);
  });

  return hasExplicitFallback ? renderedRules : addXrayFallbackRule(renderedRules, context);
}

export function policyUsesBlock(rules: string[]) {
  return rules.some((rule) => {
    const parsed = parseRoutingRule(rule);
    return parsed ? isBlockPolicy(parsed.policy) : false;
  });
}

function toSingBoxRouteRule(rule: ParsedRoutingRule, context: PolicyContext): SingBoxRouteRule | null {
  const outbound = singBoxOutboundForPolicy(rule.policy, context);
  const action = singBoxRouteAction(rule.policy, outbound);

  switch (rule.kind) {
    case "DOMAIN":
      return { domain: [rule.target], ...action };
    case "DOMAIN-SUFFIX":
      return { domain_suffix: [rule.target], ...action };
    case "DOMAIN-KEYWORD":
      return { domain_keyword: [rule.target], ...action };
    case "DOMAIN-REGEX":
      return { domain_regex: [rule.target], ...action };
    case "GEOSITE":
      return { geosite: [normalizeGeoValue(rule.target)], ...action };
    case "GEOIP":
      return normalizeGeoValue(rule.target) === "private" ? { ip_is_private: true, ...action } : { geoip: [normalizeGeoValue(rule.target)], ...action };
    case "SRC-GEOIP":
      return normalizeGeoValue(rule.target) === "private" ? { source_ip_is_private: true, ...action } : { source_geoip: [normalizeGeoValue(rule.target)], ...action };
    case "IP-CIDR":
    case "IP-CIDR6":
      return { ip_cidr: [rule.target], ...action };
    case "SRC-IP-CIDR":
      return { source_ip_cidr: [rule.target], ...action };
    case "SRC-PORT":
      return portCondition("source_port", "source_port_range", rule.target, action);
    case "DST-PORT":
      return portCondition("port", "port_range", rule.target, action);
    case "IN-PORT":
      return portCondition("inbound_port", "inbound_port_range", rule.target, action);
    case "INBOUND-TAG":
      return { inbound: [rule.target], ...action };
    case "PROCESS-NAME":
      return { process_name: [rule.target], ...action };
    case "PROCESS-PATH":
      return { process_path: [rule.target], ...action };
    case "NETWORK":
      return { network: [rule.target], ...action };
    case "PROTOCOL":
      return { protocol: [rule.target], ...action };
    case "RULE-SET":
      return { rule_set: [rule.target], ...action };
    case "MATCH":
      return { network: ["tcp", "udp"], ...action };
    default:
      return null;
  }
}

function renderSingBoxCommonRule(rule: string, context: PolicyContext) {
  const parsed = parseRoutingRule(rule);

  return parsed ? [toSingBoxRouteRule(parsed, context)].filter((item): item is SingBoxRouteRule => item !== null) : [];
}

function renderXrayCommonRule(rule: string, context: PolicyContext) {
  const parsed = parseRoutingRule(rule);

  return parsed ? [toXrayRoutingRule(parsed, context)].filter((item): item is XrayRoutingRule => item !== null) : [];
}

function hasCommonMatchRule(rules: Array<{ format: string; rule: string }>) {
  return rules.some((rule) => rule.format === "common" && parseRoutingRule(rule.rule)?.kind === "MATCH");
}

function addSingBoxFallbackRule(rules: SingBoxRouteRule[], context: PolicyContext) {
  return hasGeneratedFallbackRule(rules, context) ? rules : [...rules, fallbackSingBoxRouteRule(context)];
}

function addXrayFallbackRule(rules: XrayRoutingRule[], context: PolicyContext) {
  return hasGeneratedFallbackRule(rules, context) ? rules : [...rules, fallbackXrayRoutingRule(context)];
}

function fallbackSingBoxRouteRule(context: PolicyContext) {
  return toSingBoxRouteRule({ kind: "MATCH", policy: context.fallbackPolicy, target: "" }, context) as SingBoxRouteRule;
}

function fallbackXrayRoutingRule(context: PolicyContext) {
  return toXrayRoutingRule({ kind: "MATCH", policy: context.fallbackPolicy, target: "" }, context) as XrayRoutingRule;
}

function hasGeneratedFallbackRule(rules: Array<Record<string, unknown>>, context: PolicyContext) {
  const fallbackPolicy = context.fallbackPolicy;

  return rules.some((rule) => {
    const action = rule.action;
    const network = rule.network;

    if (Array.isArray(network) && network.includes("tcp") && network.includes("udp")) {
      return rule.outbound === singBoxOutboundForPolicy(fallbackPolicy, context) || isBlockPolicy(fallbackPolicy) && action === "reject";
    }

    if (network === "tcp,udp") {
      const target = xrayPolicyTarget(fallbackPolicy, context);
      return Object.entries(target).every(([key, value]) => rule[key] === value);
    }

    return false;
  });
}

function normalizeProfileRules(rules: RenderProfileRule[] | undefined) {
  return (rules ?? []).map((rule) => ({
    content: rule.content ?? {},
    format: rule.format ?? "common",
    rule: rule.rule
  }));
}

function toNativeRuleContent(rule: RenderProfileRule) {
  const content = rule.content ?? {};
  return Object.keys(content).length > 0 ? content : parseNativeRule(rule.rule);
}

function parseNativeRule(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function toXrayRoutingRule(rule: ParsedRoutingRule, context: PolicyContext): XrayRoutingRule | null {
  const target = xrayPolicyTarget(rule.policy, context);

  switch (rule.kind) {
    case "DOMAIN":
      return { type: "field", domain: [`full:${rule.target}`], ...target };
    case "DOMAIN-SUFFIX":
      return { type: "field", domain: [`domain:${rule.target}`], ...target };
    case "DOMAIN-KEYWORD":
      return { type: "field", domain: [`keyword:${rule.target}`], ...target };
    case "DOMAIN-REGEX":
      return { type: "field", domain: [`regexp:${rule.target}`], ...target };
    case "GEOSITE":
      return { type: "field", domain: [`geosite:${normalizeGeoValue(rule.target)}`], ...target };
    case "GEOIP":
      return { type: "field", ip: [`geoip:${normalizeGeoValue(rule.target)}`], ...target };
    case "SRC-GEOIP":
      return { type: "field", source: [`geoip:${normalizeGeoValue(rule.target)}`], ...target };
    case "IP-CIDR":
    case "IP-CIDR6":
      return { type: "field", ip: [rule.target], ...target };
    case "SRC-IP-CIDR":
      return { type: "field", source: [rule.target], ...target };
    case "SRC-PORT":
      return { type: "field", sourcePort: rule.target, ...target };
    case "DST-PORT":
      return { type: "field", port: rule.target, ...target };
    case "IN-PORT":
      return { type: "field", localPort: rule.target, ...target };
    case "INBOUND-TAG":
      return { type: "field", inboundTag: [rule.target], ...target };
    case "PROCESS-NAME":
    case "PROCESS":
      return { type: "field", process: [rule.target], ...target };
    case "NETWORK":
      return { type: "field", network: rule.target, ...target };
    case "PROTOCOL":
      return { type: "field", protocol: [rule.target], ...target };
    case "MATCH":
      return { type: "field", network: "tcp,udp", ...target };
    default:
      return null;
  }
}

function singBoxOutboundForPolicy(policy: string, context: PolicyContext) {
  if (isDirectPolicy(policy)) {
    return "direct";
  }

  if (isBlockPolicy(policy)) {
    return "block";
  }

  return context.nodeTagByName.get(policy) ?? (context.selectorTags.has(policy) ? policy : context.fallbackPolicy);
}

function singBoxRouteAction(policy: string, outbound: string) {
  return isBlockPolicy(policy) ? { action: "reject" } : { action: "route", outbound };
}

function xrayPolicyTarget(policy: string, context: PolicyContext) {
  if (isDirectPolicy(policy)) {
    return { outboundTag: "direct" };
  }

  if (isBlockPolicy(policy)) {
    return { outboundTag: "block" };
  }

  const nodeTag = context.nodeTagByName.get(policy);

  if (nodeTag) {
    return { outboundTag: nodeTag };
  }

  if (context.selectorTags.has(policy)) {
    return { balancerTag: policy };
  }

  return context.selectorTags.has(context.fallbackPolicy)
    ? { balancerTag: context.fallbackPolicy }
    : { outboundTag: "direct" };
}

function buildRenderedGroupNames(nodes: RenderableNode[]) {
  const groupNames = uniqueStrings(nodes.flatMap((node) => (node.groups && node.groups.length > 0 ? node.groups : [defaultGroupName])));
  return groupNames.map(renderGroupName);
}

function isDirectPolicy(policy: string) {
  return policy.toUpperCase() === "DIRECT" || policy.toLowerCase() === "direct";
}

function isBlockPolicy(policy: string) {
  const normalized = policy.toUpperCase();
  return normalized === "REJECT" || normalized === "REJECT-DROP" || normalized === "BLOCK";
}

function normalizeGeoValue(value: string) {
  return value.trim().toLowerCase();
}

function portCondition(portKey: string, rangeKey: string, value: string, action: Record<string, unknown>) {
  if (value.includes("-")) {
    return { [rangeKey]: [value.replace("-", ":")], ...action };
  }

  const port = Number(value);

  return Number.isFinite(port) ? { [portKey]: [port], ...action } : { [rangeKey]: [value], ...action };
}
