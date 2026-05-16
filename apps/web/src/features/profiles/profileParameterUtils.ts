import type { ProfileModuleFormat, ProfileModuleType } from "@smagicalsub/shared";

export type ParameterValueKind = "array" | "boolean" | "null" | "number" | "object" | "string" | "unknown";

export type ConfigParameterRow = {
  description: string;
  kind: ParameterValueKind;
  path: string;
  pathSegments: Array<string | number>;
  rawValue: string;
  type: string;
  valueData: unknown;
  value: string;
};

const parameterDescriptionMap: Record<string, string> = {
  "allow-lan": "Clash/Mihomo 是否允许局域网访问。",
  "bind-address": "Clash/Mihomo 监听绑定地址。",
  api: "Xray API 服务配置，常用于统计、HandlerService 或 LoggerService。",
  "api.services": "Xray API 启用的服务列表。",
  "api.tag": "Xray API 入站或出站引用标签。",
  dns: "DNS 模块主配置。",
  "dns.cache_capacity": "sing-box DNS 缓存容量。",
  "dns.clientIp": "Xray DNS 查询使用的客户端 IP。",
  "dns.client_subnet": "sing-box DNS 查询携带的客户端子网。",
  "dns.disableCache": "Xray 是否禁用 DNS 缓存。",
  "dns.disableFallback": "Xray 是否禁用 fallback 查询。",
  "dns.disable_cache": "sing-box 是否禁用 DNS 缓存。",
  "dns.enhancedMode": "Clash/Mihomo DNS 增强模式。",
  "dns.fake-ip-filter": "Clash/Mihomo fake-ip 过滤规则。",
  "dns.fakeIpFilter": "通用 fake-ip 过滤规则，渲染 Clash 时会转换。",
  "dns.fakeip": "sing-box fakeip 相关配置。",
  "dns.fallback": "备用 DNS 服务器列表。",
  "dns.final": "sing-box DNS 最终使用的 server tag。",
  "dns.hosts": "静态 hosts 映射。",
  "dns.independent_cache": "sing-box 是否启用独立缓存。",
  "dns.nameserver": "Clash/Mihomo 主 DNS 服务器列表。",
  "dns.queryStrategy": "Xray DNS 查询策略。",
  "dns.reverse_mapping": "sing-box 反向解析缓存映射。",
  "dns.rules": "DNS 规则列表。",
  "dns.servers": "DNS 服务器列表；不同输出端允许字符串或对象。",
  "dns.strategy": "sing-box DNS 解析策略。",
  endpoints: "sing-box endpoint 配置。",
  experimental: "sing-box 实验功能配置。",
  "experimental.clash_api": "sing-box Clash API 兼容接口配置。",
  inbounds: "入站监听列表。",
  log: "日志级别与输出配置。",
  ntp: "sing-box NTP 时间同步配置。",
  observatory: "Xray 观测模块，用于探测出站可用性。",
  outbounds: "出站代理列表；导入高级覆盖时可能覆盖生成节点。",
  "outbounds.outbounds": "sing-box selector/urltest 策略组包含的出站标签。",
  "outbounds.tag": "sing-box 出站或策略组标签。",
  "outbounds.type": "sing-box 出站类型，策略组通常是 selector 或 urltest。",
  policy: "Xray 用户等级与统计策略。",
  "proxy-groups": "Clash/Mihomo 策略组列表。",
  "proxy-groups.name": "Clash/Mihomo 策略组名称，规则策略会引用这个名称。",
  "proxy-groups.proxies": "Clash/Mihomo 策略组包含的节点、子策略组或 DIRECT/REJECT。",
  "proxy-groups.type": "Clash/Mihomo 策略组类型，例如 select、url-test、fallback。",
  "proxy-providers": "Clash/Mihomo 代理集提供者。",
  proxies: "Clash/Mihomo 代理节点列表。",
  reverse: "Xray 反向代理配置。",
  route: "sing-box 路由配置。",
  "route.auto_detect_interface": "sing-box 自动检测出口网卡。",
  "route.default_domain_resolver": "sing-box 路由域名解析器。",
  "route.final": "sing-box 未命中规则后的最终出站。",
  "route.rule_set": "sing-box 规则集定义列表。",
  "route.rules": "sing-box 路由规则列表。",
  routing: "Xray 路由配置。",
  "routing.balancers": "Xray 负载均衡器定义。",
  "routing.balancers.selector": "Xray balancer 的出站标签选择器，可使用 node: 前缀匹配生成节点。",
  "routing.balancers.tag": "Xray balancer 标签，routing 规则可通过 balancerTag 引用。",
  "routing.domainMatcher": "Xray 域名匹配器。",
  "routing.domainStrategy": "Xray 路由域名解析策略。",
  "routing.rules": "Xray 路由规则列表。",
  "rule-providers": "Clash/Mihomo 规则集提供者。",
  "rule_set": "sing-box 规则集列表。",
  rules: "路由或规则列表。",
  stats: "Xray 统计模块。",
  transport: "Xray 传输层配置。",
  tun: "Clash/Mihomo TUN 配置。",
  "tun.address": "TUN 地址或地址段。",
  "tun.autoRoute": "TUN 是否自动路由。",
  "tun.strictRoute": "TUN 是否严格路由。",
  "tun.dnsHijack": "TUN DNS 劫持地址。",
  "tun.stack": "TUN 协议栈。",
  "tun.mtu": "TUN MTU。",
  "tun.tag": "TUN 标签。"
};

export function buildConfigParameterRows(content: Record<string, unknown>, format: ProfileModuleFormat, type: ProfileModuleType, maxRows = 160) {
  const rows: ConfigParameterRow[] = [];
  collectParameterRows(content, "", [], rows, 0, format, type, maxRows);
  return rows;
}

export function resolveParameterContent(content: string | Record<string, unknown>) {
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }

  return content;
}

export function parameterRawValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatLabel(format: ProfileModuleFormat) {
  if (format === "sing-box") {
    return "sing-box";
  }

  if (format === "xray") {
    return "Xray";
  }

  if (format === "clash") {
    return "Clash/Mihomo";
  }

  return "通用";
}

export function moduleTypeLabel(type: ProfileModuleType) {
  if (type === "dns") {
    return "DNS";
  }

  if (type === "inbound") {
    return "入站";
  }

  if (type === "tun") {
    return "TUN";
  }

  if (type === "rule-provider") {
    return "规则集";
  }

  if (type === "proxy-provider") {
    return "代理集";
  }

  if (type === "observatory") {
    return "观测";
  }

  if (type === "policy-group") {
    return "策略组";
  }

  return "高级覆盖";
}

export function updateJsonContent(content: string | Record<string, unknown>, path: string | Array<string | number>, value: unknown) {
  const parsed = resolveParameterContent(content);
  if (!parsed) {
    return null;
  }

  const segments = Array.isArray(path) ? path : parseParameterPath(path);
  if (segments.length === 0) {
    return JSON.stringify(value, null, 2);
  }

  const next = cloneJson(parsed);
  if (!setJsonValue(next, segments, value)) {
    return null;
  }

  return JSON.stringify(next, null, 2);
}

function collectParameterRows(
  value: unknown,
  path: string,
  pathSegments: Array<string | number>,
  rows: ConfigParameterRow[],
  depth: number,
  format: ProfileModuleFormat,
  type: ProfileModuleType,
  maxRows: number
) {
  if (rows.length >= maxRows || depth > 4) {
    return;
  }

  if (path) {
    rows.push({
      description: parameterDescription(path, format, type),
      kind: parameterKind(value),
      path,
      pathSegments,
      rawValue: parameterRawValue(value),
      type: parameterType(value),
      valueData: value,
      value: parameterPreview(value)
    });
  }

  if (Array.isArray(value)) {
    value.slice(0, 8).forEach((item, index) => {
      if (item && typeof item === "object") {
        collectParameterRows(item, `${path}[${index}]`, [...pathSegments, index], rows, depth + 1, format, type, maxRows);
      }
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    collectParameterRows(child, path ? `${path}.${key}` : key, [...pathSegments, key], rows, depth + 1, format, type, maxRows);
  }
}

function parameterDescription(path: string, format: ProfileModuleFormat, type: ProfileModuleType) {
  const normalizedPath = normalizeParameterPath(path);
  const exact = parameterDescriptionMap[normalizedPath];

  if (exact) {
    return exact;
  }

  const parentPath = normalizedPath.split(".").slice(0, -1).join(".");
  if (parentPath && parameterDescriptionMap[parentPath]) {
    return `${parameterDescriptionMap[parentPath]} 的子参数。`;
  }

  if (type === "advanced-override") {
    return `${formatLabel(format)} 高级覆盖参数，未结构化识别时仍可通过 JSON 精确修改。`;
  }

  return `${formatLabel(format)} ${moduleTypeLabel(type)} 参数。`;
}

function normalizeParameterPath(path: string) {
  return path.replace(/\[\d+\]/g, "");
}

function parameterType(value: unknown) {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
}

function parameterKind(value: unknown): ParameterValueKind {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  const type = typeof value;

  if (type === "boolean" || type === "number" || type === "string") {
    return type;
  }

  if (type === "object") {
    return "object";
  }

  return "unknown";
}

function parameterPreview(value: unknown) {
  if (Array.isArray(value)) {
    const sample = value.slice(0, 3).map((item) => typeof item === "object" ? "{...}" : String(item)).join(", ");
    return `${value.length} 项${sample ? `：${sample}` : ""}`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return `${keys.length} 个键${keys.length > 0 ? `：${keys.slice(0, 4).join(", ")}` : ""}`;
  }

  if (typeof value === "boolean") {
    return value ? "true / 开启" : "false / 关闭";
  }

  if (value === null || value === undefined || value === "") {
    return "未设置";
  }

  return String(value);
}

function parseParameterPath(path: string) {
  const segments: Array<string | number> = [];
  const matcher = /([^.[\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(path))) {
    if (match[1]) {
      segments.push(match[1]);
      continue;
    }

    if (match[2]) {
      segments.push(Number(match[2]));
    }
  }

  return segments;
}

function setJsonValue(target: unknown, segments: Array<string | number>, value: unknown) {
  if (!target || typeof target !== "object") {
    return false;
  }

  let cursor = target as Record<string, unknown> | unknown[];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const last = index === segments.length - 1;
    const nextSegment = segments[index + 1];

    if (typeof segment === "number") {
      if (!Array.isArray(cursor)) {
        return false;
      }

      if (last) {
        cursor[segment] = value;
        return true;
      }

      const current = cursor[segment];
      if (!current || typeof current !== "object") {
        cursor[segment] = typeof nextSegment === "number" ? [] : {};
      }

      cursor = cursor[segment] as Record<string, unknown> | unknown[];
      continue;
    }

    if (last) {
      (cursor as Record<string, unknown>)[segment] = value;
      return true;
    }

    const current = (cursor as Record<string, unknown>)[segment];
    if (!current || typeof current !== "object") {
      (cursor as Record<string, unknown>)[segment] = typeof nextSegment === "number" ? [] : {};
    }

    cursor = (cursor as Record<string, unknown>)[segment] as Record<string, unknown> | unknown[];
  }

  return false;
}

function cloneJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJson(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cloneJson(item)]));
  }

  return value;
}
