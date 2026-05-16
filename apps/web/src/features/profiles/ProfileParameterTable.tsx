import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ProfileModuleFormat, ProfileModuleType } from "@smagicalsub/shared";
import { Copy, FileJson2 } from "lucide-react";

type ConfigParameterTableProps = {
  compact?: boolean;
  content: string | Record<string, unknown>;
  format: ProfileModuleFormat;
  maxRows?: number;
  type: ProfileModuleType;
};

type ConfigParameterRow = {
  description: string;
  path: string;
  rawValue: string;
  type: string;
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

export function ConfigParameterTable({ compact = false, content, format, maxRows = 80, type }: ConfigParameterTableProps) {
  const parsed = useMemo(() => resolveContent(content), [content]);
  const rows = useMemo(() => parsed ? buildConfigParameterRows(parsed, format, type) : [], [format, parsed, type]);
  const visibleRows = rows.slice(0, maxRows);

  return (
    <div className={cn("grid gap-2 rounded-xl border bg-card/70 p-3", compact && "gap-1.5 p-2.5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge className="gap-1.5 border-chart-4/30 bg-chart-4/10 text-chart-4" variant="outline">
            <FileJson2 />
            参数表格
          </Badge>
          <span className="text-xs text-muted-foreground">
            适用于 {formatLabel(format)} / {moduleTypeLabel(type)}，JSON 仍是最高级编辑入口。
          </span>
        </div>
        <Badge variant="secondary">{rows.length} 项</Badge>
      </div>

      {!parsed ? (
        <div className="rounded-lg border border-dashed bg-background/70 px-3 py-2 text-xs text-destructive">
          JSON 暂时无法解析，修正 JSON 后会显示参数表格。
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          当前配置为空，可以直接在 JSON 里添加高级参数。
        </div>
      ) : (
        <div className={cn("overflow-auto rounded-lg border bg-background/70", compact ? "max-h-56" : "max-h-72")}>
          <Table className="min-w-[780px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">参数路径</TableHead>
                <TableHead className="w-[96px]">类型</TableHead>
                <TableHead className="w-[22%]">当前值</TableHead>
                <TableHead>说明</TableHead>
                <TableHead className="w-[84px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.path}>
                  <TableCell className="whitespace-normal font-mono text-xs">
                    <span className="break-all">{row.path}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="font-mono" variant="outline">{row.type}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal text-xs">
                    <span className="break-all font-mono">{row.value}</span>
                  </TableCell>
                  <TableCell className="whitespace-normal text-xs leading-5 text-muted-foreground">
                    {row.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={() => copyText(row.rawValue)} size="xs" type="button" variant="outline">
                          <Copy data-icon="inline-start" />
                          复制
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>复制当前参数值</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {rows.length > visibleRows.length ? (
        <div className="text-xs text-muted-foreground">
          还有 {rows.length - visibleRows.length} 项未展示，可在 JSON 内容中继续查看和编辑。
        </div>
      ) : null}
    </div>
  );
}

export function buildConfigParameterRows(content: Record<string, unknown>, format: ProfileModuleFormat, type: ProfileModuleType, maxRows = 160) {
  const rows: ConfigParameterRow[] = [];
  collectParameterRows(content, "", rows, 0, format, type, maxRows);
  return rows;
}

function collectParameterRows(
  value: unknown,
  path: string,
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
      path,
      rawValue: parameterRawValue(value),
      type: parameterType(value),
      value: parameterPreview(value)
    });
  }

  if (Array.isArray(value)) {
    value.slice(0, 8).forEach((item, index) => {
      if (item && typeof item === "object") {
        collectParameterRows(item, `${path}[${index}]`, rows, depth + 1, format, type, maxRows);
      }
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    collectParameterRows(child, path ? `${path}.${key}` : key, rows, depth + 1, format, type, maxRows);
  }
}

function resolveContent(content: string | Record<string, unknown>) {
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

function parameterRawValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatLabel(format: ProfileModuleFormat) {
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

function moduleTypeLabel(type: ProfileModuleType) {
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

function copyText(value: string) {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard) {
    return;
  }

  void navigator.clipboard.writeText(value);
}
