import type { RenderConfigModule } from "./types";
import { uniqueStrings } from "./utils";

export function advancedOverrideFor(modules: RenderConfigModule[] | undefined, format: RenderConfigModule["format"]) {
  return (modules ?? [])
    .filter((module) => matchesFormat(module, format) && module.type === "advanced-override")
    .map((module) => module.content);
}

export function moduleOverridesFor(modules: RenderConfigModule[] | undefined, format: RenderConfigModule["format"]) {
  return [
    ...dnsOverrideFor(modules, format),
    ...inboundOverrideFor(modules, format),
    ...tunOverrideFor(modules, format),
    ...policyGroupOverrideFor(modules, format),
    ...providerOverrideFor(modules, format),
    ...observatoryOverrideFor(modules, format),
    ...advancedOverrideFor(modules, format)
  ];
}

export function mergeConfig<T extends Record<string, unknown>>(base: T, overrides: Record<string, unknown>[]) {
  return overrides.reduce((current, override) => deepMerge(current, override), base);
}

function dnsOverrideFor(modules: RenderConfigModule[] | undefined, format: RenderConfigModule["format"]) {
  return (modules ?? [])
    .filter((module) => matchesFormat(module, format) && module.type === "dns")
    .map((module) => toDnsOverride(format, module.content))
    .filter((override): override is Record<string, unknown> => override !== null);
}

function toDnsOverride(format: RenderConfigModule["format"], content: Record<string, unknown>): Record<string, unknown> | null {
  const serverSource = content.servers ?? content.nameserver;
  const servers = uniqueStrings(toDnsServerStrings(serverSource));
  const fallback = uniqueStrings(toDnsServerStrings(content.fallback));
  const hosts = objectValue(content.hosts);
  const nameserverPolicy = objectValue(content["nameserver-policy"]);
  const proxyServerNameserverPolicy = objectValue(content["proxy-server-nameserver-policy"]);
  const fallbackFilter = objectValue(content["fallback-filter"]);
  const defaultNameservers = toDnsServerStrings(content["default-nameserver"]);
  const singBoxStrategy = singBoxDnsStrategy(content.strategy);
  const xrayStrategy = xrayDnsStrategy(content.queryStrategy ?? content.strategy);
  const singBoxServers = toSingBoxDnsServers(serverSource);
  const singBoxFakeIpServer = singBoxFakeIpServerFor(content, singBoxServers);
  const singBoxDnsServers = singBoxFakeIpServer ? [singBoxFakeIpServer, ...singBoxServers] : singBoxServers;
  const singBoxRules = singBoxDnsRules(content, singBoxFakeIpServer);

  switch (format) {
    case "clash":
      return {
        dns: compact({
          enable: booleanValue(content.enable, true),
          "enhanced-mode": stringValue(content["enhanced-mode"]) ?? stringValue(content.enhancedMode) ?? "fake-ip",
          "fake-ip-filter": toStringArray(content["fake-ip-filter"] ?? content.fakeIpFilter),
          fallback: fallback.length > 0 ? fallback : undefined,
          "fallback-filter": Object.keys(fallbackFilter).length > 0 ? fallbackFilter : undefined,
          hosts: Object.keys(hosts).length > 0 ? hosts : undefined,
          nameserver: servers.length > 0 ? servers : undefined,
          "default-nameserver": defaultNameservers.length > 0 ? defaultNameservers : undefined,
          "nameserver-policy": Object.keys(nameserverPolicy).length > 0 ? nameserverPolicy : undefined,
          "proxy-server-nameserver": toDnsServerStrings(content["proxy-server-nameserver"]),
          "proxy-server-nameserver-policy": Object.keys(proxyServerNameserverPolicy).length > 0 ? proxyServerNameserverPolicy : undefined,
          "direct-nameserver": toDnsServerStrings(content["direct-nameserver"]),
          "direct-nameserver-follow-policy": content["direct-nameserver-follow-policy"]
        })
      };
    case "sing-box":
      return {
        dns: compact({
          cache_capacity: numberValue(content.cache_capacity),
          client_subnet: stringValue(content.client_subnet),
          disable_cache: content.disable_cache,
          disable_expire: content.disable_expire,
          final: stringValue(content.final) ?? firstSingBoxDnsServerTag(singBoxDnsServers),
          reverse_mapping: content.reverse_mapping,
          rules: singBoxRules,
          servers: singBoxDnsServers.length > 0 ? singBoxDnsServers : undefined,
          strategy: singBoxStrategy
        })
      };
    case "xray":
      return {
        dns: compact({
          clientIp: stringValue(content.clientIp ?? content.clientIP),
          disableCache: content.disableCache,
          disableFallback: content.disableFallback,
          disableFallbackIfMatch: content.disableFallbackIfMatch,
          enableParallelQuery: content.enableParallelQuery,
          hosts: Object.keys(hosts).length > 0 ? hosts : undefined,
          queryStrategy: xrayStrategy,
          servers: toXrayDnsServers(serverSource),
          tag: stringValue(content.tag),
          useSystemHosts: content.useSystemHosts
        })
      };
    case "common":
      return null;
  }
}

function inboundOverrideFor(modules: RenderConfigModule[] | undefined, format: RenderConfigModule["format"]) {
  return (modules ?? [])
    .filter((module) => matchesFormat(module, format) && module.type === "inbound")
    .map((module) => toInboundOverride(format, module.content))
    .filter((override): override is Record<string, unknown> => override !== null);
}

function toInboundOverride(format: RenderConfigModule["format"], content: Record<string, unknown>): Record<string, unknown> | null {
  const listen = stringValue(content.listen) ?? "127.0.0.1";
  const port = numberValue(content.port ?? content.listen_port) ?? 2080;
  const type = stringValue(content.inboundType ?? content.type ?? content.protocol) ?? "mixed";
  const allowLan = booleanValue(content.allowLan, false);
  const udp = booleanValue(content.udp, true);
  const sniff = booleanValue(content.sniff, true);
  const tag = stringValue(content.tag) ?? `${type}-in`;

  switch (format) {
    case "clash":
      return compact({
        "allow-lan": allowLan,
        "bind-address": listen,
        "mixed-port": type === "mixed" ? port : undefined,
        port: type === "http" ? port : undefined,
        "socks-port": type === "socks" ? port : undefined
      });
    case "sing-box":
      return compact({
        inbounds: [
          singBoxInbound(content, type, tag, listen, port)
        ],
        route: sniff ? { rules: [singBoxSniffRule(tag)] } : undefined
      });
    case "xray":
      return {
        inbounds: [
          compact({
            tag,
            listen,
            port,
            protocol: type === "http" ? "http" : "socks",
            settings: xrayInboundSettings(content, type, udp),
            sniffing: xraySniffingSettings(content, sniff)
          })
        ]
      };
    case "common":
      return null;
  }
}

function singBoxInbound(content: Record<string, unknown>, type: string, tag: string, listen: string, port: number) {
  const native = withoutKeys(content, [
    "allowLan",
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
  ]);

  return compact({
    ...native,
    type: type === "http" ? "http" : type === "socks" ? "socks" : "mixed",
    tag,
    listen,
    listen_port: port
  });
}

function singBoxSniffRule(inbound: string) {
  // sing-box 1.13 起移除旧入站 sniff 字段，嗅探需要放到 route rule action。
  return {
    inbound: [inbound],
    action: "sniff"
  };
}

function xrayInboundSettings(content: Record<string, unknown>, type: string, udp: boolean) {
  const settings = objectValue(content.settings);
  return compact({
    ...settings,
    udp: type === "http" ? settings.udp : settings.udp ?? udp
  });
}

function xrayTunSettings(content: Record<string, unknown>) {
  const settings = objectValue(content.settings);
  const autoSystemRoutingTable = xrayAutoSystemRoutingTable(content.autoSystemRoutingTable ?? content.autoRoute ?? settings.autoSystemRoutingTable);
  return compact({
    ...settings,
    gateway: toStringArray(content.gateway ?? settings.gateway ?? content.address),
    name: stringValue(content.name ?? content.interfaceName ?? settings.name),
    mtu: numberValue(content.mtu ?? settings.mtu),
    dns: toStringArray(content.dns ?? content.dnsHijack ?? content["dns-hijack"] ?? settings.dns),
    autoSystemRoutingTable,
    autoOutboundsInterface: stringValue(content.autoOutboundsInterface ?? content.autoDetectInterface ?? settings.autoOutboundsInterface)
      ?? (autoSystemRoutingTable ? "auto" : undefined)
  });
}

function xrayAutoSystemRoutingTable(value: unknown) {
  if (value === true) {
    return ["0.0.0.0/0", "::/0"];
  }

  if (value === false) {
    return undefined;
  }

  const values = toStringArray(value);
  return values.length > 0 ? values : undefined;
}

function xraySniffingSettings(content: Record<string, unknown>, sniff: boolean) {
  const sniffing = objectValue(content.sniffing);

  if (Object.keys(sniffing).length > 0) {
    return compact({
      ...sniffing,
      enabled: sniffing.enabled ?? sniff
    });
  }

  return sniff
    ? {
        enabled: true,
        destOverride: ["http", "tls", "quic"]
      }
    : undefined;
}

function tunOverrideFor(modules: RenderConfigModule[] | undefined, format: RenderConfigModule["format"]) {
  return (modules ?? [])
    .filter((module) => matchesFormat(module, format) && module.type === "tun")
    .map((module) => toTunOverride(format, module.content))
    .filter((override): override is Record<string, unknown> => override !== null);
}

function toTunOverride(format: RenderConfigModule["format"], content: Record<string, unknown>): Record<string, unknown> | null {
  switch (format) {
    case "clash":
      return {
        tun: compact({
          enable: booleanValue(content.enable, true),
          stack: stringValue(content.stack) ?? "mixed",
          device: stringValue(content.device),
          "dns-hijack": toStringArray(content["dns-hijack"] ?? content.dnsHijack),
          "auto-route": content["auto-route"] ?? content.autoRoute,
          "auto-detect-interface": content["auto-detect-interface"] ?? content.autoDetectInterface,
          "strict-route": content["strict-route"] ?? content.strictRoute,
          mtu: numberValue(content.mtu)
        })
      };
    case "sing-box":
      return {
        inbounds: [
          compact({
            ...withoutKeys(content, singBoxTunSemanticFields),
            type: "tun",
            tag: stringValue(content.tag) ?? "tun-in",
            interface_name: stringValue(content.interface_name ?? content.interfaceName),
            address: arrayOrValue(content.address),
            mtu: numberValue(content.mtu),
            auto_route: content.auto_route ?? content.autoRoute,
            strict_route: content.strict_route ?? content.strictRoute,
            stack: stringValue(content.stack),
            sniff: content.sniff
          })
        ]
      };
    case "xray":
      return {
        inbounds: [
          compact({
            tag: stringValue(content.tag) ?? "tun-in",
            protocol: "tun",
            settings: xrayTunSettings(content),
            sniffing: content.sniff === false ? undefined : { enabled: true, destOverride: ["http", "tls", "quic"] }
          })
        ]
      };
    case "common":
      return null;
  }
}

function policyGroupOverrideFor(modules: RenderConfigModule[] | undefined, format: RenderConfigModule["format"]) {
  return (modules ?? [])
    .filter((module) => matchesFormat(module, format) && module.type === "policy-group")
    .map((module) => toPolicyGroupOverride(format, module.content))
    .filter((override): override is Record<string, unknown> => override !== null);
}

function toPolicyGroupOverride(format: RenderConfigModule["format"], content: Record<string, unknown>): Record<string, unknown> | null {
  switch (format) {
    case "clash": {
      const groups = clashPolicyGroups(content);
      return groups.length > 0 ? { "proxy-groups": groups } : null;
    }
    case "sing-box": {
      const outbounds = singBoxPolicyOutbounds(content);
      return outbounds.length > 0 ? { outbounds } : null;
    }
    case "xray": {
      const balancers = xrayPolicyBalancers(content);
      return balancers.length > 0 ? { routing: { balancers } } : null;
    }
    case "common":
      return null;
  }
}

function clashPolicyGroups(content: Record<string, unknown>) {
  const rawGroups = nativeGroupEntries(content["proxy-groups"] ?? content.groups ?? content.group);
  const entries = rawGroups.length > 0 ? rawGroups : [content];

  return entries
    .map((entry): Record<string, unknown> | null => {
      const name = stringValue(entry.name ?? entry.tag);
      if (!name) {
        return null;
      }

      return compact({
        ...entry,
        name,
        type: stringValue(entry.type) ?? "select",
        proxies: stringArray(entry.proxies ?? entry.outbounds ?? entry.selector ?? entry.selectors),
        use: stringArray(entry.use),
        tag: undefined,
        outbounds: undefined,
        selector: undefined,
        selectors: undefined
      });
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

function singBoxPolicyOutbounds(content: Record<string, unknown>) {
  const rawOutbounds = nativeGroupEntries(content.outbounds ?? content.selectors ?? content.groups ?? content.group);
  const entries = rawOutbounds.length > 0 ? rawOutbounds : [content];

  return entries
    .map((entry): Record<string, unknown> | null => {
      const tag = stringValue(entry.tag ?? entry.name);
      const type = singBoxPolicyGroupType(entry.type ?? entry.groupType);

      if (!tag || !type) {
        return null;
      }

      return compact({
        ...entry,
        type,
        tag,
        outbounds: stringArray(entry.outbounds ?? entry.proxies ?? entry.selector ?? entry.selectors),
        groupType: undefined,
        name: undefined,
        proxies: undefined,
        selector: undefined,
        selectors: undefined
      });
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

function xrayPolicyBalancers(content: Record<string, unknown>) {
  const routing = objectValue(content.routing);
  const rawBalancers = nativeGroupEntries(routing.balancers ?? content.balancers ?? content.groups ?? content.group);
  const entries = rawBalancers.length > 0 ? rawBalancers : [content];

  return entries
    .map((entry): Record<string, unknown> | null => {
      const tag = stringValue(entry.tag ?? entry.name);
      const selector = stringArray(entry.selector ?? entry.selectors ?? entry.outbounds ?? entry.proxies);

      if (!tag || !selector) {
        return null;
      }

      return compact({
        ...entry,
        tag,
        selector,
        name: undefined,
        outbounds: undefined,
        proxies: undefined,
        selectors: undefined
      });
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

function nativeGroupEntries(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isPlainObject);
  }

  if (!isPlainObject(value)) {
    return [];
  }

  if (stringValue(value.name ?? value.tag) || Array.isArray(value.proxies) || Array.isArray(value.outbounds) || Array.isArray(value.selector)) {
    return [value];
  }

  return Object.entries(value)
    .filter(([, entry]) => isPlainObject(entry))
    .map(([name, entry]): Record<string, unknown> => ({ name, ...(entry as Record<string, unknown>) }));
}

function singBoxPolicyGroupType(value: unknown) {
  const type = stringValue(value) ?? "selector";

  if (type === "select") {
    return "selector";
  }

  if (type === "url-test" || type === "urltest") {
    return "urltest";
  }

  return ["selector", "urltest"].includes(type) ? type : null;
}

function providerOverrideFor(modules: RenderConfigModule[] | undefined, format: RenderConfigModule["format"]) {
  return (modules ?? [])
    .filter((module) => matchesFormat(module, format) && (module.type === "rule-provider" || module.type === "proxy-provider"))
    .map((module) => toProviderOverride(format, module.type, module.content))
    .filter((override): override is Record<string, unknown> => override !== null);
}

function toProviderOverride(format: RenderConfigModule["format"], type: string, content: Record<string, unknown>): Record<string, unknown> | null {
  switch (format) {
    case "clash":
      return type === "rule-provider"
        ? { "rule-providers": providerMap(content) }
        : { "proxy-providers": providerMap(content) };
    case "sing-box":
      return type === "rule-provider" ? { route: singBoxRouteOverride(content) } : null;
    case "xray":
      return type === "rule-provider" ? { routing: routingOverride(content) } : null;
    case "common":
      return null;
  }
}

function observatoryOverrideFor(modules: RenderConfigModule[] | undefined, format: RenderConfigModule["format"]) {
  return (modules ?? [])
    .filter((module) => matchesFormat(module, format) && module.type === "observatory")
    .map((module) => toObservatoryOverride(format, module.content))
    .filter((override): override is Record<string, unknown> => override !== null);
}

function toObservatoryOverride(format: RenderConfigModule["format"], content: Record<string, unknown>): Record<string, unknown> | null {
  switch (format) {
    case "xray":
      return compact({
        observatory: objectValue(content.observatory),
        policy: objectValue(content.policy)
      });
    case "sing-box":
      return compact({
        experimental: objectValue(content.experimental)
      });
    case "clash":
    case "common":
      return null;
  }
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>, parentKey = ""): T {
  const next: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = next[key];

    if (isPlainObject(current) && isPlainObject(value)) {
      next[key] = deepMerge(current, value, key);
      continue;
    }

    if (Array.isArray(current) && Array.isArray(value)) {
      next[key] = mergeArrayValue(parentKey, key, current, value);
      continue;
    }

    next[key] = value;
  }

  return next as T;
}

function mergeArrayValue(parentKey: string, key: string, current: unknown[], value: unknown[]) {
  if (shouldMergeByTag(parentKey, key)) {
    return mergeByTag(current, value);
  }

  return shouldAppendArray(parentKey, key) ? [...current, ...value] : value;
}

function shouldMergeByTag(parentKey: string, key: string) {
  return (parentKey === "routing" && key === "balancers")
    || (parentKey === "route" && key === "rule_set")
    || key === "endpoints"
    || key === "inbounds"
    || key === "outbounds"
    || key === "proxy-groups";
}

function shouldAppendArray(parentKey: string, key: string) {
  return (parentKey === "routing" && key === "rules")
    || (parentKey === "route" && key === "rules");
}

function mergeByTag(current: unknown[], value: unknown[]) {
  const next = [...current];
  const indexes = new Map<string, number>();

  next.forEach((item, index) => {
    const tag = tagValue(item);

    if (tag) {
      indexes.set(tag, index);
    }
  });

  for (const item of value) {
    const tag = tagValue(item);

    if (!tag || !indexes.has(tag)) {
      if (tag) {
        indexes.set(tag, next.length);
      }

      next.push(item);
      continue;
    }

    const index = indexes.get(tag) as number;
    const currentItem = next[index];
    next[index] = isPlainObject(currentItem) && isPlainObject(item)
      ? deepMerge(currentItem, item)
      : item;
  }

  return next;
}

function tagValue(value: unknown) {
  if (!isPlainObject(value)) {
    return null;
  }

  const tag = stringValue(value.tag);
  const name = stringValue(value.name);

  return tag ?? name ?? null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function matchesFormat(module: RenderConfigModule, format: RenderConfigModule["format"]) {
  return module.format === "common" || module.format === format;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function firstString(values: string[]) {
  return values.find((value) => value.trim().length > 0);
}

function objectValue(value: unknown) {
  return isPlainObject(value) ? value : {};
}

function withoutKeys(value: Record<string, unknown>, keys: string[]) {
  const blocked = new Set(keys);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !blocked.has(key)));
}

const singBoxTunSemanticFields = [
  "autoRoute",
  "interfaceName",
  "strictRoute"
];

function providerMap(content: Record<string, unknown>) {
  const name = stringValue(content.name);

  if (name && isPlainObject(content[name])) {
    return { [name]: content[name] };
  }

  if (name) {
    const entry = Object.fromEntries(Object.entries(content).filter(([key]) => key !== "name"));
    return Object.keys(entry).length > 0 ? { [name]: entry } : {};
  }

  return Object.fromEntries(Object.entries(content).filter(([key]) => key !== "name"));
}

function providerEntries(content: Record<string, unknown>) {
  return Object.entries(content)
    .filter(([key, value]) => key !== "name" && key !== "route" && isPlainObject(value))
    .map(([, value]) => value);
}

function singBoxRouteOverride(content: Record<string, unknown>) {
  const route = objectValue(content.route);

  if (Object.keys(route).length > 0) {
    return route;
  }

  return {
    rule_set: Array.isArray(content.rule_set) ? content.rule_set : providerEntries(content)
  };
}

function routingOverride(content: Record<string, unknown>) {
  const routing = objectValue(content.routing);

  if (Object.keys(routing).length > 0) {
    return routing;
  }

  return compact({
    balancers: Array.isArray(content.balancers) ? content.balancers : undefined,
    domainStrategy: stringValue(content.domainStrategy),
    rules: Array.isArray(content.rules) ? content.rules : undefined
  });
}

function arrayOrValue(value: unknown) {
  return Array.isArray(value) ? value : stringValue(value);
}

function toDnsServerStrings(value: unknown) {
  return toDnsServerEntries(value).flatMap((entry) => typeof entry === "string" ? [entry] : toStringArray(entry.address));
}

function toSingBoxDnsServers(value: unknown) {
  const entries = uniqueDnsServerEntries(toDnsServerEntries(value));

  return entries
    .map((entry, index) => toSingBoxDnsServer(entry, `dns-${index + 1}`))
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

function toXrayDnsServers(value: unknown) {
  const entries = uniqueDnsServerEntries(toDnsServerEntries(value));
  return entries.length > 0 ? entries : undefined;
}

function firstSingBoxDnsServerTag(servers: Array<Record<string, unknown>>) {
  const first = servers[0];
  return first ? stringValue(first.tag) : undefined;
}

function singBoxFakeIpServerFor(content: Record<string, unknown>, servers: Array<Record<string, unknown>>) {
  if (servers.some((server) => server.type === "fakeip")) {
    return undefined;
  }

  const fakeip = objectValue(content.fakeip);
  const hasFakeIpOptions = Object.keys(fakeip).some((key) => key !== "enabled");
  const enabled = booleanValue(content.fakeIp, false) || (hasFakeIpOptions || fakeip.enabled === true) && fakeip.enabled !== false;

  if (enabled) {
    return compact({
      ...fakeip,
      tag: stringValue(fakeip.tag) ?? "fakeip",
      type: "fakeip",
      enabled: undefined
    });
  }

  return undefined;
}

function singBoxDnsRules(content: Record<string, unknown>, fakeIpServer: Record<string, unknown> | undefined) {
  const rules = Array.isArray(content.rules) ? [...content.rules] : [];
  const fakeIpTag = fakeIpServer ? stringValue(fakeIpServer.tag) : undefined;

  return fakeIpTag && rules.length === 0
    ? [{ query_type: ["A", "AAAA"], server: fakeIpTag }]
    : rules.length > 0 ? rules : undefined;
}

function toSingBoxDnsServer(entry: string | Record<string, unknown>, fallbackTag: string): Record<string, unknown> | null {
  if (typeof entry === "string") {
    return singBoxDnsServerFromString(entry, fallbackTag);
  }

  const tag = stringValue(entry.tag) ?? fallbackTag;
  if (stringValue(entry.type) === "fakeip" || stringValue(entry.address) === "fakeip") {
    return compact({ ...entry, tag, type: "fakeip", address: undefined });
  }

  if (stringValue(entry.type) || stringValue(entry.server)) {
    return compact({ ...entry, tag });
  }

  const address = stringValue(entry.address);
  if (!address) {
    return compact({ ...entry, tag });
  }

  return compact({
    ...singBoxDnsServerFromString(address, tag),
    domain_resolver: entry.domain_resolver ?? entry.address_resolver,
    domain_strategy: entry.domain_strategy ?? entry.address_strategy,
    strategy: singBoxDnsStrategy(entry.strategy),
    detour: entry.detour,
    client_subnet: entry.client_subnet
  });
}

function singBoxDnsServerFromString(address: string, tag: string): Record<string, unknown> {
  const normalized = address.trim();

  if (normalized === "local" || normalized === "system") {
    return { type: "local", tag };
  }

  if (normalized === "fakeip") {
    return { type: "fakeip", tag };
  }

  const parsed = parseUrl(normalized);
  if (!parsed) {
    return { type: "udp", tag, server: normalized };
  }

  const host = parsed.hostname || normalized;
  const port = parsed.port ? Number(parsed.port) : undefined;
  const path = `${parsed.pathname}${parsed.search}` || undefined;

  switch (parsed.protocol) {
    case "https:":
      return compact({ type: "https", tag, server: host, server_port: port, path: path && path !== "/" ? path : undefined });
    case "h3:":
      return compact({ type: "h3", tag, server: host, server_port: port, path: path && path !== "/" ? path : undefined });
    case "tls:":
      return compact({ type: "tls", tag, server: host, server_port: port });
    case "quic:":
      return compact({ type: "quic", tag, server: host, server_port: port });
    case "tcp:":
      return compact({ type: "tcp", tag, server: host, server_port: port });
    case "udp:":
      return compact({ type: "udp", tag, server: host, server_port: port });
    default:
      return { type: "udp", tag, server: normalized };
  }
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function singBoxDnsStrategy(value: unknown) {
  const strategy = stringValue(value);
  return strategy && ["prefer_ipv4", "prefer_ipv6", "ipv4_only", "ipv6_only"].includes(strategy) ? strategy : undefined;
}

function xrayDnsStrategy(value: unknown) {
  const strategy = stringValue(value);
  return strategy && ["UseIP", "UseIPv4", "UseIPv6", "UseSystem"].includes(strategy) ? strategy : undefined;
}

function toDnsServerEntries(value: unknown): Array<string | Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeDnsServerEntry(item));
  }

  if (typeof value === "string") {
    return value.split(/\r?\n|,/).flatMap((item) => normalizeDnsServerEntry(item));
  }

  return normalizeDnsServerEntry(value);
}

function normalizeDnsServerEntry(value: unknown): Array<string | Record<string, unknown>> {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized ? [normalized] : [];
  }

  if (isPlainObject(value)) {
    const normalized = compact(value);
    return Object.keys(normalized).length > 0 ? [normalized] : [];
  }

  return [];
}

function uniqueDnsServerEntries(entries: Array<string | Record<string, unknown>>) {
  const seen = new Set<string>();
  const unique: Array<string | Record<string, unknown>> = [];

  for (const entry of entries) {
    const key = typeof entry === "string" ? `string:${entry}` : `object:${JSON.stringify(entry)}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(entry);
  }

  return unique;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => typeof item === "string" || typeof item === "number" ? [String(item).trim()] : []).filter(Boolean);
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value).split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function stringArray(value: unknown) {
  const values = toStringArray(value);
  return values.length > 0 ? values : undefined;
}
