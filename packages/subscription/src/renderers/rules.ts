import type { RenderableNode } from "./types";
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

export type SingBoxRouteRule = Record<string, unknown>;
export type XrayRoutingRule = Record<string, unknown>;

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

export function createPolicyContext(nodes: RenderableNode[], outboundTags: string[], fallbackPolicy: string): PolicyContext {
  return {
    fallbackPolicy,
    nodeTagByName: new Map(
      nodes
        .map((node): [string, string | undefined] => [node.name, outboundTags.find((tag) => tag === node.name || tag === `node:${node.name}`)])
        .filter((item): item is [string, string] => Boolean(item[1]))
    ),
    selectorTags: new Set([fallbackPolicy, ...buildRenderedGroupNames(nodes)])
  };
}

export function renderSingBoxRouteRules(rules: string[], context: PolicyContext) {
  return rulesWithFallback(rules, context.fallbackPolicy)
    .map(parseRoutingRule)
    .filter((rule): rule is ParsedRoutingRule => rule !== null)
    .map((rule) => toSingBoxRouteRule(rule, context))
    .filter((rule): rule is SingBoxRouteRule => rule !== null);
}

export function renderXrayRoutingRules(rules: string[], context: PolicyContext) {
  return rulesWithFallback(rules, context.fallbackPolicy)
    .map(parseRoutingRule)
    .filter((rule): rule is ParsedRoutingRule => rule !== null)
    .map((rule) => toXrayRoutingRule(rule, context))
    .filter((rule): rule is XrayRoutingRule => rule !== null);
}

export function policyUsesBlock(rules: string[]) {
  return rules.some((rule) => {
    const parsed = parseRoutingRule(rule);
    return parsed ? isBlockPolicy(parsed.policy) : false;
  });
}

function toSingBoxRouteRule(rule: ParsedRoutingRule, context: PolicyContext): SingBoxRouteRule | null {
  const outbound = singBoxOutboundForPolicy(rule.policy, context);

  switch (rule.kind) {
    case "DOMAIN":
      return { domain: [rule.target], outbound };
    case "DOMAIN-SUFFIX":
      return { domain_suffix: [rule.target], outbound };
    case "DOMAIN-KEYWORD":
      return { domain_keyword: [rule.target], outbound };
    case "GEOSITE":
      return { geosite: [normalizeGeoValue(rule.target)], outbound };
    case "GEOIP":
      return normalizeGeoValue(rule.target) === "private" ? { ip_is_private: true, outbound } : { geoip: [normalizeGeoValue(rule.target)], outbound };
    case "IP-CIDR":
    case "IP-CIDR6":
      return { ip_cidr: [rule.target], outbound };
    case "SRC-IP-CIDR":
      return { source_ip_cidr: [rule.target], outbound };
    case "SRC-PORT":
      return portCondition("source_port", "source_port_range", rule.target, outbound);
    case "DST-PORT":
      return portCondition("port", "port_range", rule.target, outbound);
    case "PROCESS-NAME":
      return { process_name: [rule.target], outbound };
    case "MATCH":
      return { network: ["tcp", "udp"], outbound };
    default:
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
    case "GEOSITE":
      return { type: "field", domain: [`geosite:${normalizeGeoValue(rule.target)}`], ...target };
    case "GEOIP":
      return { type: "field", ip: [`geoip:${normalizeGeoValue(rule.target)}`], ...target };
    case "IP-CIDR":
    case "IP-CIDR6":
      return { type: "field", ip: [rule.target], ...target };
    case "SRC-IP-CIDR":
      return { type: "field", source: [rule.target], ...target };
    case "SRC-PORT":
      return { type: "field", sourcePort: rule.target, ...target };
    case "DST-PORT":
      return { type: "field", port: rule.target, ...target };
    case "PROCESS-NAME":
      return { type: "field", process: [rule.target], ...target };
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

function portCondition(portKey: string, rangeKey: string, value: string, outbound: string) {
  if (value.includes("-")) {
    return { [rangeKey]: [value.replace("-", ":")], outbound };
  }

  return { [portKey]: [Number(value)], outbound };
}
