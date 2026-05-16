import { parse as parseYaml } from "yaml";
import type { ProfileDto, ProfileModuleFormat, ProfileModuleType, ProfileRuleDto, ProfileRuleFormat } from "@smagicalsub/shared";

const maxRuleLength = 300;
const knownRuleKinds = new Set([
  "DOMAIN",
  "DOMAIN-SUFFIX",
  "DOMAIN-KEYWORD",
  "DOMAIN-REGEX",
  "GEOSITE",
  "GEOIP",
  "IP-CIDR",
  "IP-CIDR6",
  "SRC-IP-CIDR",
  "SRC-GEOIP",
  "SRC-PORT",
  "DST-PORT",
  "IN-PORT",
  "INBOUND-TAG",
  "PROCESS-NAME",
  "PROCESS-PATH",
  "PROCESS",
  "NETWORK",
  "PROTOCOL",
  "RULE-SET",
  "MATCH",
  "AND",
  "OR",
  "NOT"
]);

export type ProfileRuleDraft = {
  content: Record<string, unknown>;
  enabled: boolean;
  format: ProfileRuleFormat;
  position: number;
  rule: string;
  source?: string;
};

export type ProfileModuleDraft = {
  content: Record<string, unknown>;
  enabled: boolean;
  format: ProfileModuleFormat;
  is_default: boolean;
  name: string;
  type: ProfileModuleType;
};

export type ProfilePreviewIssue = {
  message: string;
  source?: string;
};

export type ProfileBuildPreview = {
  defaultStrategy: string;
  description: string;
  duplicateRules: ProfileRuleDraft[];
  issues: ProfilePreviewIssue[];
  modules: ProfileModuleDraft[];
  name: string;
  rules: ProfileRuleDraft[];
  sourceLabel: string;
};

export type ImportConfigFormat = "auto" | "clash" | "sing-box" | "xray";

export type ImportProfileInput = {
  content: string;
  defaultStrategy: string;
  description: string;
  format: ImportConfigFormat;
  name: string;
};

type ImportedRuleDraft = Omit<ProfileRuleDraft, "enabled" | "position">;

const profileRuleFormats = new Set<ProfileRuleFormat>(["common", "clash", "sing-box", "xray"]);
const singBoxRoutePassthroughKeys = new Set(["rules", "rule_set"]);
const xrayRoutingPassthroughKeys = new Set(["balancers", "rules"]);
const clashExtractedTopLevelKeys = new Set(["dns", "proxies", "proxy-groups", "proxy-providers", "rule-providers", "rules", "tun"]);
const singBoxExtractedTopLevelKeys = new Set(["dns", "endpoints", "inbounds", "outbounds", "route"]);
const xrayExtractedTopLevelKeys = new Set(["dns", "inbounds", "observatory", "outbounds", "policy", "routing"]);

const singBoxConditionFamilies: Record<string, string> = {
  domain: "destination",
  domain_suffix: "destination",
  domain_keyword: "destination",
  domain_regex: "destination",
  geosite: "destination",
  geoip: "destination",
  ip_cidr: "destination",
  ip_is_private: "destination-ip-private",
  source_geoip: "source",
  source_ip_cidr: "source",
  source_ip_is_private: "source-ip-private",
  source_port: "source-port",
  source_port_range: "source-port",
  port: "destination-port",
  port_range: "destination-port",
  inbound: "inbound",
  process_name: "process",
  process_path: "process",
  network: "network",
  protocol: "protocol",
  rule_set: "rule-set"
};
const singBoxNativeOnlyFields = [
  "auth_user",
  "user",
  "wifi_ssid",
  "wifi_bssid",
  "interface_address",
  "ip_version",
  "client",
  "network_type",
  "network_interface_address",
  "default_interface_address",
  "process_path_regex",
  "package_name",
  "package_name_regex",
  "user_id",
  "source_mac_address",
  "source_hostname",
  "preferred_by",
  "clash_mode",
  "network_is_expensive",
  "network_is_constrained",
  "rule_set_ipcidr_match_source",
  "rule_set_ip_cidr_match_source",
  "method",
  "no_drop",
  "override_address",
  "override_port",
  "network_strategy",
  "fallback_network_type",
  "fallback_delay",
  "udp_disable_domain_unmapping",
  "udp_connect",
  "udp_timeout",
  "tls_fragment",
  "tls_fragment_fallback_delay",
  "tls_record_fragment",
  "sniffer",
  "timeout",
  "server",
  "strategy",
  "disable_cache",
  "disable_optimistic_cache",
  "rewrite_ttl",
  "client_subnet"
];
const singBoxKnownRuleFields = new Set([
  ...Object.keys(singBoxConditionFamilies),
  ...singBoxNativeOnlyFields,
  "action",
  "invert",
  "mode",
  "outbound",
  "rules",
  "type"
]);

const xrayConditionFamilies: Record<string, string> = {
  domain: "domain",
  ip: "ip",
  source: "source-ip",
  sourceIP: "source-ip",
  port: "destination-port",
  sourcePort: "source-port",
  localPort: "local-port",
  network: "network",
  inboundTag: "inbound",
  protocol: "protocol",
  process: "process"
};
const xrayNativeOnlyFields = ["attrs", "localIP", "user", "vlessRoute", "webhook", "ruleTag"];
const xrayKnownRuleFields = new Set([
  ...Object.keys(xrayConditionFamilies),
  ...xrayNativeOnlyFields,
  "balancerTag",
  "outboundTag",
  "type"
]);
const convertiblePolicyTargets = new Set(["DIRECT", "REJECT", "REJECT-DROP", "BLOCK", "PROXY"]);

export function buildImportPreview(input: ImportProfileInput): ProfileBuildPreview {
  const issues: ProfilePreviewIssue[] = [];
  const parsed = parseConfigContent(input.content, issues);
  const detectedFormat = resolveImportFormat(parsed, input.content, input.format);
  const rawRules = extractRawRules(parsed, issues, detectedFormat);
  const { duplicates, rules } = normalizeRuleDrafts(rawRules, issues);
  const modules = extractModuleDrafts(parsed, input.name, issues, detectedFormat);

  return {
    defaultStrategy: normalizeStrategy(input.defaultStrategy),
    description: input.description.trim() || "从配置文件导入生成",
    duplicateRules: duplicates,
    issues,
    modules,
    name: normalizeProfileName(input.name, "导入配置档"),
    rules,
    sourceLabel: sourceLabelForFormat(detectedFormat, parsed, input.content)
  };
}

export async function buildMergePreview({
  defaultStrategy,
  description,
  name,
  profileIds,
  profiles,
  loadRules
}: {
  defaultStrategy: string;
  description: string;
  name: string;
  profileIds: string[];
  profiles: ProfileDto[];
  loadRules: (profileId: string) => Promise<ProfileRuleDto[]>;
}): Promise<ProfileBuildPreview> {
  const issues: ProfilePreviewIssue[] = [];
  const orderedProfiles = profileIds.map((id) => profiles.find((profile) => profile.id === id)).filter((profile): profile is ProfileDto => Boolean(profile));
  const seen = new Set<string>();
  const duplicateRules: ProfileRuleDraft[] = [];
  const mergedRules: ProfileRuleDraft[] = [];

  for (const profile of orderedProfiles) {
    const profileRules = await loadRules(profile.id);

    for (const rule of profileRules.filter((item) => Boolean(item.enabled))) {
      const draft = profileRuleToDraft(rule, mergedRules.length * 10);
      const key = profileRuleDedupKey(draft);

      if (seen.has(key)) {
        duplicateRules.push(draft);
        continue;
      }

      seen.add(key);
      mergedRules.push(draft);
    }
  }

  const firstProfile = orderedProfiles[0];

  if (orderedProfiles.length < 2) {
    issues.push({ message: "至少选择两个配置档才能合并。" });
  }

  return {
    defaultStrategy: normalizeStrategy(defaultStrategy || firstProfile?.default_strategy || "Proxy"),
    description: description.trim() || `合并自 ${orderedProfiles.map((profile) => profile.name).join("、")}`,
    duplicateRules,
    issues,
    modules: [],
    name: normalizeProfileName(name, firstProfile ? `${firstProfile.name} 合并` : "合并配置档"),
    rules: mergedRules,
    sourceLabel: `合并 ${orderedProfiles.length} 个配置档`
  };
}

export function canCreatePreview(preview: ProfileBuildPreview | null) {
  return Boolean(preview && (preview.rules.length > 0 || preview.modules.length > 0) && preview.name.trim() && preview.defaultStrategy.trim());
}

function parseConfigContent(content: string, issues: ProfilePreviewIssue[]) {
  const trimmed = content.trim();

  if (!trimmed) {
    issues.push({ message: "配置内容为空。" });
    return null;
  }

  try {
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return JSON.parse(trimmed) as unknown;
    }
  } catch (error) {
    issues.push({ message: `JSON 解析失败：${errorMessage(error)}` });
    return null;
  }

  try {
    return parseYaml(trimmed) as unknown;
  } catch (error) {
    issues.push({ message: `YAML 解析失败：${errorMessage(error)}` });
    return null;
  }
}

function extractRawRules(parsed: unknown, issues: ProfilePreviewIssue[], format: ImportConfigFormat): ImportedRuleDraft[] {
  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => extractRuleItem(item, issues, format));
  }

  if (!isRecord(parsed)) {
    return [];
  }

  if ((format === "auto" || format === "clash") && Array.isArray(parsed.rules)) {
    return parsed.rules.flatMap((item) => extractRuleItem(item, issues, "clash"));
  }

  const route = parsed.route;
  if ((format === "auto" || format === "sing-box") && isRecord(route) && Array.isArray(route.rules)) {
    return route.rules.flatMap((item) => extractSingBoxRule(item, issues));
  }

  const routing = parsed.routing;
  if ((format === "auto" || format === "xray") && isRecord(routing) && Array.isArray(routing.rules)) {
    return routing.rules.flatMap((item) => extractXrayRule(item, issues));
  }

  issues.push({ message: "未找到可识别的 rules、route.rules 或 routing.rules。" });
  return [];
}

function extractModuleDrafts(parsed: unknown, profileName: string, issues: ProfilePreviewIssue[], format: ImportConfigFormat): ProfileModuleDraft[] {
  if (!isRecord(parsed)) {
    return [];
  }

  const sourceName = normalizeProfileName(profileName, "导入配置");

  if (format === "clash" || (format === "auto" && (Array.isArray(parsed.rules) || parsed.proxies || parsed["proxy-groups"]))) {
    return extractClashModules(parsed, sourceName);
  }

  if (format === "xray" || (format === "auto" && (isRecord(parsed.routing) || looksLikeXrayConfig(parsed)))) {
    return extractXrayModules(parsed, sourceName, issues);
  }

  if (format === "sing-box" || (format === "auto" && (isRecord(parsed.route) || looksLikeSingBoxConfig(parsed)))) {
    return extractSingBoxModules(parsed, sourceName);
  }

  return [];
}

function extractClashModules(parsed: Record<string, unknown>, sourceName: string) {
  const modules: ProfileModuleDraft[] = [];
  const dns = objectValue(parsed.dns);
  const tun = objectValue(parsed.tun);
  const ruleProviders = objectValue(parsed["rule-providers"]);
  const proxyProviders = objectValue(parsed["proxy-providers"]);
  const advancedOverride = pickUnextractedTopLevel(parsed, clashExtractedTopLevelKeys);

  if (Object.keys(dns).length > 0) {
    modules.push(moduleDraft(`${sourceName} Clash DNS`, "clash", "dns", {
      enable: dns.enable,
      enhancedMode: dns["enhanced-mode"],
      "default-nameserver": dns["default-nameserver"],
      fakeIpFilter: dns["fake-ip-filter"],
      fallback: dns.fallback,
      "fallback-filter": dns["fallback-filter"],
      hosts: dns.hosts,
      "nameserver-policy": dns["nameserver-policy"],
      "proxy-server-nameserver": dns["proxy-server-nameserver"],
      "proxy-server-nameserver-policy": dns["proxy-server-nameserver-policy"],
      "direct-nameserver": dns["direct-nameserver"],
      "direct-nameserver-follow-policy": dns["direct-nameserver-follow-policy"],
      servers: dns.nameserver,
      strategy: dns["default-nameserver"] ? "" : undefined
    }));
  }

  if (Object.keys(tun).length > 0) {
    modules.push(moduleDraft(`${sourceName} Clash TUN`, "clash", "tun", tun));
  }

  if (Object.keys(ruleProviders).length > 0) {
    modules.push(moduleDraft(`${sourceName} Clash rule-providers`, "clash", "rule-provider", ruleProviders));
  }

  if (Object.keys(proxyProviders).length > 0) {
    modules.push(moduleDraft(`${sourceName} Clash proxy-providers`, "clash", "proxy-provider", proxyProviders));
  }

  if (Array.isArray(parsed["proxy-groups"]) && parsed["proxy-groups"].length > 0) {
    modules.push(moduleDraft(`${sourceName} Clash 策略组`, "clash", "policy-group", {
      "proxy-groups": parsed["proxy-groups"]
    }));
  }

  if (Object.keys(advancedOverride).length > 0) {
    modules.push(moduleDraft(`${sourceName} Clash 高级覆盖`, "clash", "advanced-override", advancedOverride));
  }

  return modules;
}

function extractSingBoxModules(parsed: Record<string, unknown>, sourceName: string) {
  const modules: ProfileModuleDraft[] = [];
  const dns = objectValue(parsed.dns);
  const route = objectValue(parsed.route);
  const ruleSet = Array.isArray(route.rule_set) ? route.rule_set : [];
  const routeSettings = Object.fromEntries(Object.entries(route).filter(([key]) => !singBoxRoutePassthroughKeys.has(key)));
  const advancedOverride = pickUnextractedTopLevel(parsed, singBoxExtractedTopLevelKeys);
  const policyOutbounds = (Array.isArray(parsed.outbounds) ? parsed.outbounds : [])
    .filter((outbound) => isRecord(outbound) && isSingBoxPolicyOutbound(outbound));
  const tunInbound = (Array.isArray(parsed.inbounds) ? parsed.inbounds : [])
    .find((inbound) => isRecord(inbound) && inbound.type === "tun");
  const regularInbounds = (Array.isArray(parsed.inbounds) ? parsed.inbounds : [])
    .filter((inbound): inbound is Record<string, unknown> => isRecord(inbound) && inbound.type !== "tun");

  if (Object.keys(dns).length > 0) {
    modules.push(moduleDraft(`${sourceName} sing-box DNS`, "sing-box", "dns", {
      cache_capacity: dns.cache_capacity,
      client_subnet: dns.client_subnet,
      disable_cache: dns.disable_cache,
      disable_expire: dns.disable_expire,
      fakeip: dns.fakeip,
      fakeIp: Boolean(objectValue(dns.fakeip).enabled),
      final: dns.final,
      independent_cache: dns.independent_cache,
      reverse_mapping: dns.reverse_mapping,
      rules: dns.rules,
      servers: dns.servers,
      strategy: dns.strategy
    }));
  }

  for (const [index, inbound] of regularInbounds.entries()) {
    modules.push(moduleDraft(`${sourceName} sing-box 入站${regularInbounds.length > 1 ? ` ${index + 1}` : ""}`, "sing-box", "inbound", {
      ...inbound,
      inboundType: inbound.type,
      listen: inbound.listen,
      port: inbound.listen_port,
      sniff: inbound.sniff,
      tag: inbound.tag,
      udp: inbound.udp
    }));
  }

  if (isRecord(tunInbound)) {
    modules.push(moduleDraft(`${sourceName} sing-box TUN`, "sing-box", "tun", tunInbound));
  }

  if (ruleSet.length > 0) {
    modules.push(moduleDraft(`${sourceName} sing-box rule-set`, "sing-box", "rule-provider", { rule_set: ruleSet }));
  }

  if (policyOutbounds.length > 0) {
    modules.push(moduleDraft(`${sourceName} sing-box 策略组`, "sing-box", "policy-group", { outbounds: policyOutbounds }));
  }

  if (Object.keys(routeSettings).length > 0) {
    modules.push(moduleDraft(`${sourceName} sing-box 路由设置`, "sing-box", "rule-provider", { route: routeSettings }));
  }

  if (Object.keys(advancedOverride).length > 0) {
    modules.push(moduleDraft(`${sourceName} sing-box 高级覆盖`, "sing-box", "advanced-override", advancedOverride));
  }

  return modules;
}

function extractXrayModules(parsed: Record<string, unknown>, sourceName: string, issues: ProfilePreviewIssue[]) {
  const modules: ProfileModuleDraft[] = [];
  const dns = objectValue(parsed.dns);
  const routing = objectValue(parsed.routing);
  const routingSettings = Object.fromEntries(Object.entries(routing).filter(([key]) => !xrayRoutingPassthroughKeys.has(key)));
  const advancedOverride = pickUnextractedTopLevel(parsed, xrayExtractedTopLevelKeys);
  const observatory = objectValue(parsed.observatory);
  const policy = objectValue(parsed.policy);
  const inbound = (Array.isArray(parsed.inbounds) ? parsed.inbounds : [])
    .find((item) => isRecord(item));

  if (Object.keys(dns).length > 0) {
    modules.push(moduleDraft(`${sourceName} Xray DNS`, "xray", "dns", {
      clientIp: dns.clientIp ?? dns.clientIP,
      disableCache: dns.disableCache,
      disableFallback: dns.disableFallback,
      disableFallbackIfMatch: dns.disableFallbackIfMatch,
      enableParallelQuery: dns.enableParallelQuery,
      hosts: dns.hosts,
      queryStrategy: dns.queryStrategy,
      servers: dns.servers,
      tag: dns.tag,
      useSystemHosts: dns.useSystemHosts
    }));
  }

  if (isRecord(inbound)) {
    const sniffing = objectValue(inbound.sniffing);
    const settings = objectValue(inbound.settings);
    modules.push(moduleDraft(`${sourceName} Xray 入站`, "xray", "inbound", {
      inboundType: inbound.protocol,
      listen: inbound.listen,
      port: inbound.port,
      sniff: sniffing.enabled,
      sniffing: Object.keys(sniffing).length > 0 ? sniffing : undefined,
      tag: inbound.tag,
      udp: settings.udp,
      settings: Object.keys(settings).length > 0 ? settings : undefined
    }));
  }

  if (Object.keys(observatory).length > 0 || Object.keys(policy).length > 0) {
    modules.push(moduleDraft(`${sourceName} Xray 观测`, "xray", "observatory", {
      observatory: Object.keys(observatory).length > 0 ? observatory : undefined,
      policy: Object.keys(policy).length > 0 ? policy : undefined
    }));
  }

  if (Object.keys(routingSettings).length > 0) {
    modules.push(moduleDraft(`${sourceName} Xray 路由设置`, "xray", "rule-provider", { routing: routingSettings }));
  }

  if (Array.isArray(routing.balancers) && routing.balancers.length > 0) {
    modules.push(moduleDraft(`${sourceName} Xray balancers`, "xray", "policy-group", {
      routing: {
        balancers: routing.balancers
      }
    }));
    issues.push({ message: "Xray balancers 已保留到策略组模块；请确认订阅输出中的 balancerTag 与节点选择器一致。" });
  }

  if (Object.keys(advancedOverride).length > 0) {
    modules.push(moduleDraft(`${sourceName} Xray 高级覆盖`, "xray", "advanced-override", advancedOverride));
  }

  return modules;
}

function looksLikeSingBoxConfig(parsed: Record<string, unknown>) {
  if (Array.isArray(parsed.inbounds) && parsed.inbounds.some((inbound) => isRecord(inbound) && typeof inbound.type === "string")) {
    return true;
  }

  if (Array.isArray(parsed.outbounds) && parsed.outbounds.some((outbound) => isRecord(outbound) && typeof outbound.type === "string")) {
    return true;
  }

  return ["endpoints", "experimental", "ntp"].some((key) => parsed[key] !== undefined);
}

function isSingBoxPolicyOutbound(outbound: Record<string, unknown>) {
  return outbound.type === "selector" || outbound.type === "urltest";
}

function looksLikeXrayConfig(parsed: Record<string, unknown>) {
  if (Array.isArray(parsed.inbounds) && parsed.inbounds.some((inbound) => isRecord(inbound) && typeof inbound.protocol === "string")) {
    return true;
  }

  if (Array.isArray(parsed.outbounds) && parsed.outbounds.some((outbound) => isRecord(outbound) && typeof outbound.protocol === "string")) {
    return true;
  }

  return ["api", "reverse", "stats", "transport"].some((key) => parsed[key] !== undefined);
}

function extractRuleItem(item: unknown, issues: ProfilePreviewIssue[], format: ImportConfigFormat) {
  if (typeof item === "string") {
    return [commonRule(item)];
  }

  if (isRecord(item)) {
    if (typeof item.rule === "string") {
      return [importedRule(normalizeProfileRuleFormat(item.format) ?? "common", item.rule, objectValue(item.content), stringifyIssueSource(item))];
    }

    if (format === "xray" || (format === "auto" && looksLikeXrayRule(item))) {
      return extractXrayRule(item, issues);
    }

    return extractSingBoxRule(item, issues);
  }

  issues.push({ message: "存在非字符串规则，已跳过。", source: JSON.stringify(item) });
  return [];
}

function extractSingBoxRule(item: unknown, issues: ProfilePreviewIssue[]) {
  if (!isRecord(item)) {
    return [];
  }

  const nativeReason = singBoxNativeReason(item);
  if (nativeReason) {
    issues.push({ message: `sing-box 规则包含 ${nativeReason}，已保留为 sing-box 原生规则。`, source: stringifyIssueSource(item) });
    return [nativeRule("sing-box", item)];
  }

  const policy = normalizeImportedPolicy(firstString(item.outbound, item.action === "reject" ? "REJECT" : undefined, item.server, item.strategy) ?? "Proxy");
  const rules: ImportedRuleDraft[] = [];

  appendValues(rules, "DOMAIN", item.domain, policy);
  appendValues(rules, "DOMAIN-SUFFIX", item.domain_suffix, policy);
  appendValues(rules, "DOMAIN-KEYWORD", item.domain_keyword, policy);
  appendValues(rules, "DOMAIN-REGEX", item.domain_regex, policy);
  appendValues(rules, "GEOSITE", item.geosite, policy);
  appendValues(rules, "GEOIP", item.geoip, policy);
  appendValues(rules, "SRC-GEOIP", item.source_geoip, policy);
  appendValues(rules, "IP-CIDR", item.ip_cidr, policy);
  appendValues(rules, "SRC-IP-CIDR", item.source_ip_cidr, policy);
  appendValues(rules, "SRC-PORT", item.source_port, policy);
  appendValues(rules, "SRC-PORT", item.source_port_range, policy);
  appendValues(rules, "DST-PORT", item.port, policy);
  appendValues(rules, "DST-PORT", item.port_range, policy);
  appendValues(rules, "INBOUND-TAG", item.inbound, policy);
  appendValues(rules, "PROCESS-NAME", item.process_name, policy);
  appendValues(rules, "PROCESS-PATH", item.process_path, policy);
  appendValues(rules, "NETWORK", item.network, policy);
  appendValues(rules, "PROTOCOL", item.protocol, policy);
  appendValues(rules, "RULE-SET", item.rule_set, policy);

  if (item.ip_is_private === true) {
    rules.push(commonRule(`GEOIP,private,${policy}`));
  }

  if (item.source_ip_is_private === true) {
    rules.push(commonRule(`SRC-GEOIP,private,${policy}`));
  }

  if (rules.length === 0) {
    issues.push({ message: "sing-box 规则没有可转换条件，已保留为 sing-box 原生规则。", source: stringifyIssueSource(item) });
    return [nativeRule("sing-box", item)];
  }

  return rules;
}

function extractXrayRule(item: unknown, issues: ProfilePreviewIssue[]) {
  if (!isRecord(item)) {
    return [];
  }

  const nativeReason = xrayNativeReason(item);
  if (nativeReason) {
    issues.push({ message: `Xray routing 规则包含 ${nativeReason}，已保留为 Xray 原生规则。`, source: stringifyIssueSource(item) });
    return [nativeRule("xray", item)];
  }

  const policy = normalizeImportedPolicy(firstString(item.outboundTag) ?? "Proxy");
  const rules: ImportedRuleDraft[] = [];

  appendXrayDomainRules(rules, item.domain, policy, issues);
  appendXrayIpRules(rules, item.ip, policy, issues);
  appendXraySourceIpRules(rules, item.source, policy, issues);
  appendXraySourceIpRules(rules, item.sourceIP, policy, issues);
  appendXrayPortRules(rules, "DST-PORT", item.port, policy);
  appendXrayPortRules(rules, "SRC-PORT", item.sourcePort, policy);
  appendXrayPortRules(rules, "IN-PORT", item.localPort, policy);
  appendValues(rules, "INBOUND-TAG", item.inboundTag, policy);
  appendValues(rules, "PROTOCOL", item.protocol, policy);
  appendXrayProcessRules(rules, item.process, policy);
  appendXrayNetworkRules(rules, item.network, policy);

  if (rules.length === 0) {
    issues.push({ message: "Xray routing 规则没有可转换条件，已保留为 Xray 原生规则。", source: stringifyIssueSource(item) });
    return [nativeRule("xray", item)];
  }

  return rules;
}

function normalizeRuleDrafts(rawRules: ImportedRuleDraft[], issues: ProfilePreviewIssue[]) {
  const seen = new Set<string>();
  const duplicates: ProfileRuleDraft[] = [];
  const rules: ProfileRuleDraft[] = [];

  for (const rawRule of rawRules) {
    const rule = rawRule.format === "common" || rawRule.format === "clash"
      ? normalizeRuleText(rawRule.rule)
      : normalizeNativeRuleText(rawRule.rule);

    if (!rule) {
      continue;
    }

    if ((rawRule.format === "common" || rawRule.format === "clash") && rule.length > maxRuleLength) {
      issues.push({ message: `规则超过 ${maxRuleLength} 字符，已跳过。`, source: rule });
      continue;
    }

    const kind = rule.split(",", 1)[0]?.trim().toUpperCase();
    if ((rawRule.format === "common" || rawRule.format === "clash") && !knownRuleKinds.has(kind)) {
      issues.push({ message: "未知规则类型，已保留预览但建议确认。", source: rule });
    }

    const draft = { content: rawRule.content, enabled: true, format: rawRule.format, position: rules.length * 10, rule };
    const dedupKey = profileRuleDedupKey(draft);
    if (seen.has(dedupKey)) {
      duplicates.push(draft);
      continue;
    }

    seen.add(dedupKey);
    rules.push(draft);
  }

  return { duplicates, rules };
}

function normalizeRuleText(value: string) {
  const rule = value.trim();

  if (!rule || rule.startsWith("#")) {
    return null;
  }

  return rule.replace(/\s*,\s*/g, ",");
}

function normalizeNativeRuleText(value: string) {
  return value.trim() || null;
}

function profileRuleToDraft(rule: ProfileRuleDto, position: number): ProfileRuleDraft {
  return {
    content: rule.content ?? {},
    enabled: true,
    format: rule.format ?? "common",
    position,
    rule: rule.rule
  };
}

function profileRuleDedupKey(rule: ProfileRuleDraft) {
  return `${rule.format}:${rule.rule}:${JSON.stringify(rule.content)}`;
}

function appendValues(rules: ImportedRuleDraft[], kind: string, value: unknown, policy: string) {
  for (const item of toStringArray(value)) {
    rules.push(commonRule(`${kind},${item},${policy}`));
  }
}

function moduleDraft(
  name: string,
  format: ProfileModuleFormat,
  type: ProfileModuleType,
  content: Record<string, unknown>
): ProfileModuleDraft {
  return {
    content: compactObject(content),
    enabled: true,
    format,
    is_default: false,
    name,
    type
  };
}

function compactObject(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Record<string, unknown>;
}

function pickUnextractedTopLevel(parsed: Record<string, unknown>, extractedKeys: Set<string>) {
  return Object.fromEntries(
    Object.entries(parsed).filter(([key, value]) => !extractedKeys.has(key) && value !== undefined)
  ) as Record<string, unknown>;
}

function appendXrayDomainRules(rules: ImportedRuleDraft[], value: unknown, policy: string, issues: ProfilePreviewIssue[]) {
  for (const domain of toStringArray(value)) {
    if (domain.startsWith("geosite:")) {
      rules.push(commonRule(`GEOSITE,${domain.slice("geosite:".length)},${policy}`));
    } else if (domain.startsWith("domain:")) {
      rules.push(commonRule(`DOMAIN-SUFFIX,${domain.slice("domain:".length)},${policy}`));
    } else if (domain.startsWith("full:")) {
      rules.push(commonRule(`DOMAIN,${domain.slice("full:".length)},${policy}`));
    } else if (domain.startsWith("keyword:")) {
      rules.push(commonRule(`DOMAIN-KEYWORD,${domain.slice("keyword:".length)},${policy}`));
    } else if (domain.startsWith("regexp:")) {
      rules.push(commonRule(`DOMAIN-REGEX,${domain.slice("regexp:".length)},${policy}`));
    } else if (domain.startsWith("ext:") || domain.startsWith("!")) {
      issues.push({ message: "Xray 外部域名文件或反向域名匹配已保留为原生规则，建议人工确认。", source: domain });
    } else {
      rules.push(commonRule(`DOMAIN-KEYWORD,${domain},${policy}`));
    }
  }
}

function appendXrayIpRules(rules: ImportedRuleDraft[], value: unknown, policy: string, issues: ProfilePreviewIssue[]) {
  for (const ip of toStringArray(value)) {
    if (ip.startsWith("geoip:")) {
      rules.push(commonRule(`GEOIP,${ip.slice("geoip:".length)},${policy}`));
    } else if (ip.startsWith("ext:") || ip.startsWith("!")) {
      issues.push({ message: "Xray 外部 IP 文件或反向 IP 匹配已保留为原生规则，建议人工确认。", source: ip });
    } else {
      rules.push(commonRule(`IP-CIDR,${ip},${policy}`));
    }
  }
}

function appendXraySourceIpRules(rules: ImportedRuleDraft[], value: unknown, policy: string, issues: ProfilePreviewIssue[]) {
  for (const sourceIp of toStringArray(value)) {
    if (sourceIp.startsWith("geoip:")) {
      rules.push(commonRule(`SRC-GEOIP,${sourceIp.slice("geoip:".length)},${policy}`));
    } else if (sourceIp.startsWith("ext:") || sourceIp.startsWith("!")) {
      issues.push({ message: "Xray 外部源 IP 文件或反向源 IP 匹配已保留为原生规则，建议人工确认。", source: sourceIp });
    } else {
      rules.push(commonRule(`SRC-IP-CIDR,${sourceIp},${policy}`));
    }
  }
}

function appendXrayPortRules(rules: ImportedRuleDraft[], kind: string, value: unknown, policy: string) {
  for (const portText of toStringArray(value)) {
    for (const item of portText.split(",").map((port) => port.trim()).filter(Boolean)) {
      rules.push(commonRule(`${kind},${item},${policy}`));
    }
  }
}

function appendXrayProcessRules(rules: ImportedRuleDraft[], value: unknown, policy: string) {
  for (const process of toStringArray(value)) {
    const kind = process.includes("/") || process.includes("\\") ? "PROCESS-PATH" : "PROCESS-NAME";
    rules.push(commonRule(`${kind},${process},${policy}`));
  }
}

function appendXrayNetworkRules(rules: ImportedRuleDraft[], value: unknown, policy: string) {
  for (const networkText of toStringArray(value)) {
    for (const network of networkText.split(",").map((item) => item.trim()).filter(Boolean)) {
      rules.push(commonRule(`NETWORK,${network},${policy}`));
    }
  }
}

function commonRule(rule: string): ImportedRuleDraft {
  return importedRule("common", rule, {});
}

function nativeRule(format: Extract<ProfileRuleFormat, "sing-box" | "xray">, content: Record<string, unknown>): ImportedRuleDraft {
  return importedRule(format, nativeRuleText(format, content), content);
}

function importedRule(format: ProfileRuleFormat, rule: string, content: Record<string, unknown>, source?: string): ImportedRuleDraft {
  return {
    content,
    format,
    rule,
    source
  };
}

function nativeRuleText(format: ProfileRuleFormat, content: Record<string, unknown>) {
  const prefix = format === "xray" ? "Xray routing" : "sing-box route";
  const detail = stringifyIssueSource(content);
  const maxDetailLength = maxRuleLength - prefix.length - 2;

  return detail.length > maxDetailLength
    ? `${prefix}: ${detail.slice(0, Math.max(0, maxDetailLength - 3))}...`
    : `${prefix}: ${detail}`;
}

function singBoxNativeReason(item: Record<string, unknown>) {
  if (item.type === "logical" || Array.isArray(item.rules)) {
    return "逻辑组合条件";
  }

  if (item.action !== undefined && item.action !== "route" && item.action !== "reject") {
    return `非 route/reject 的 action=${String(item.action)}`;
  }

  const outbound = firstString(item.outbound);
  if (outbound && !isConvertiblePolicyTarget(outbound)) {
    return `自定义 outbound=${outbound}`;
  }

  if (item.invert !== undefined && item.invert !== false) {
    return "invert 反向匹配";
  }

  const nativeOnlyFields = singBoxNativeOnlyFields.filter((field) => item[field] !== undefined);
  if (nativeOnlyFields.length > 0) {
    return `专用字段 ${nativeOnlyFields.join("、")}`;
  }

  const unknownFields = Object.keys(item).filter((field) => !singBoxKnownRuleFields.has(field));
  if (unknownFields.length > 0) {
    return `未知字段 ${unknownFields.join("、")}`;
  }

  const families = presentConditionFamilies(item, singBoxConditionFamilies);
  if (families.length > 1) {
    return `多个条件组合 ${families.join(" + ")}`;
  }

  if (families.length === 0) {
    return "无通用可转换条件";
  }

  return null;
}

function xrayNativeReason(item: Record<string, unknown>) {
  if (item.type !== undefined && item.type !== "field") {
    return `非 field 类型 type=${String(item.type)}`;
  }

  if (item.balancerTag !== undefined) {
    return "balancerTag 负载均衡目标";
  }

  const outboundTag = firstString(item.outboundTag);
  if (outboundTag && !isConvertiblePolicyTarget(outboundTag)) {
    return `自定义 outboundTag=${outboundTag}`;
  }

  const nativeOnlyFields = xrayNativeOnlyFields.filter((field) => item[field] !== undefined);
  if (nativeOnlyFields.length > 0) {
    return `专用字段 ${nativeOnlyFields.join("、")}`;
  }

  const unknownFields = Object.keys(item).filter((field) => !xrayKnownRuleFields.has(field));
  if (unknownFields.length > 0) {
    return `未知字段 ${unknownFields.join("、")}`;
  }

  if (hasUnconvertibleXrayMatcher(item.domain) || hasUnconvertibleXrayMatcher(item.ip) || hasUnconvertibleXrayMatcher(item.source) || hasUnconvertibleXrayMatcher(item.sourceIP)) {
    return "外部文件或反向匹配";
  }

  const families = presentConditionFamilies(item, xrayConditionFamilies);
  if (families.length > 1) {
    return `多个条件组合 ${families.join(" + ")}`;
  }

  if (families.length === 0) {
    return "无通用可转换条件";
  }

  return null;
}

function presentConditionFamilies(item: Record<string, unknown>, families: Record<string, string>) {
  return Array.from(new Set(
    Object.entries(families)
      .filter(([field]) => hasConditionValue(item[field]))
      .map(([, family]) => family)
  ));
}

function hasConditionValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return value === true;
  }

  return false;
}

function hasUnconvertibleXrayMatcher(value: unknown) {
  return toStringArray(value).some((item) => item.startsWith("ext:") || item.startsWith("!"));
}

function looksLikeXrayRule(item: Record<string, unknown>) {
  return [
    "attrs",
    "balancerTag",
    "inboundTag",
    "localIP",
    "localPort",
    "outboundTag",
    "sourceIP",
    "sourcePort",
    "vlessRoute",
    "webhook"
  ].some((field) => item[field] !== undefined) || item.type === "field";
}

function isConvertiblePolicyTarget(value: string) {
  return convertiblePolicyTargets.has(value.trim().toUpperCase());
}

function normalizeImportedPolicy(value: string) {
  const normalized = value.trim();
  const upper = normalized.toUpperCase();

  if (upper === "DIRECT") {
    return "DIRECT";
  }

  if (upper === "REJECT" || upper === "REJECT-DROP" || upper === "BLOCK") {
    return "REJECT";
  }

  if (upper === "PROXY") {
    return "Proxy";
  }

  return normalized || "Proxy";
}

function normalizeProfileRuleFormat(value: unknown): ProfileRuleFormat | null {
  return typeof value === "string" && profileRuleFormats.has(value as ProfileRuleFormat)
    ? value as ProfileRuleFormat
    : null;
}

function resolveImportFormat(parsed: unknown, content: string, preferredFormat: ImportConfigFormat): ImportConfigFormat {
  if (preferredFormat !== "auto") {
    return preferredFormat;
  }

  if (isRecord(parsed)) {
    if (Array.isArray(parsed.rules) || parsed.proxies || parsed["proxy-groups"]) {
      return "clash";
    }

    if (isRecord(parsed.route)) {
      return "sing-box";
    }

    if (isRecord(parsed.routing)) {
      return "xray";
    }

    if (looksLikeSingBoxConfig(parsed)) {
      return "sing-box";
    }

    if (looksLikeXrayConfig(parsed)) {
      return "xray";
    }
  }

  return content.trim().startsWith("[") ? "clash" : "auto";
}

function sourceLabelForFormat(format: ImportConfigFormat, parsed: unknown, content: string) {
  switch (format) {
    case "clash":
      return Array.isArray(parsed) ? "规则数组" : "Clash/Mihomo YAML";
    case "sing-box":
      return "sing-box JSON";
    case "xray":
      return "Xray JSON";
    case "auto":
      return content.trim().startsWith("[") ? "规则数组" : "未知配置";
  }
}

function normalizeProfileName(value: string, fallback: string) {
  return (value.trim() || fallback).slice(0, 80);
}

function normalizeStrategy(value: string) {
  return (value.trim() || "Proxy").slice(0, 80);
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized ? [normalized] : [];
  }

  return [];
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
}

function objectValue(value: unknown) {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知错误";
}

function stringifyIssueSource(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
