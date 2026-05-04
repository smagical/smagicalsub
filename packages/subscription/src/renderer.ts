import { renderClashConfig } from "./renderers/clash";
import { renderPlainSubscription, renderV2rayNSubscription } from "./renderers/plain";
import { renderSingBoxConfig } from "./renderers/sing-box";
import type { RenderableNode, RenderSubscriptionInput, SubscriptionFormat } from "./renderers/types";

export type { RenderableNode, RenderSubscriptionBaseInput, RenderSubscriptionInput, SubscriptionFormat } from "./renderers/types";
export { renderClashConfig } from "./renderers/clash";
export { renderPlainSubscription, renderV2rayNSubscription } from "./renderers/plain";
export { renderSingBoxConfig } from "./renderers/sing-box";

// 统一格式别名入口，避免路由层散落 v2ray/base64/singbox 等兼容判断。
export function normalizeSubscriptionFormat(value: string | null | undefined): SubscriptionFormat {
  switch (value?.toLowerCase()) {
    case "v2ray":
    case "v2rayn":
    case "base64":
      return "v2rayn";
    case "text":
    case "plain":
    case "raw":
      return "plain";
    case "singbox":
    case "sing-box":
      return "sing-box";
    case "clash":
    case "yaml":
    case "yml":
    default:
      return "clash";
  }
}

// 路由层只关心目标格式，具体输出差异收敛到各 renderer 小模块内。
export function renderSubscription(input: RenderSubscriptionInput): string {
  const dedupedInput = { ...input, nodes: dedupeRenderableNodes(input.nodes) };

  switch (input.format) {
    case "v2rayn":
      return renderV2rayNSubscription(dedupedInput);
    case "plain":
      return renderPlainSubscription(dedupedInput);
    case "sing-box":
      return renderSingBoxConfig(dedupedInput);
    case "clash":
      return renderClashConfig(dedupedInput);
  }
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
