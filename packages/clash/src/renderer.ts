import YAML from "yaml";

export type RenderableNode = {
  id?: string;
  name: string;
  protocol?: string;
  config_json: string;
  groups?: string[];
};

export type SubscriptionFormat = "clash" | "v2rayn" | "plain" | "sing-box";

export type RenderClashConfigInput = {
  profileName: string;
  nodes: RenderableNode[];
};

export type RenderSubscriptionInput = RenderClashConfigInput & {
  format: SubscriptionFormat;
};

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

export function renderSubscription(input: RenderSubscriptionInput): string {
  switch (input.format) {
    case "v2rayn":
      return renderV2rayNSubscription(input);
    case "plain":
      return renderPlainSubscription(input);
    case "sing-box":
      return renderSingBoxConfig(input);
    case "clash":
      return renderClashConfig(input);
  }
}

export function renderClashConfig(input: RenderClashConfigInput): string {
  const renderableNodes = input.nodes
    .map((node) => {
      const proxy = toProxy(node);
      return proxy ? { proxy, groups: node.groups ?? [] } : null;
    })
    .filter((node): node is { proxy: Record<string, unknown>; groups: string[] } => node !== null);
  const proxies = renderableNodes.map((node) => node.proxy);
  const proxyNames = proxies.map((proxy) => String(proxy.name));
  const proxyGroups = buildProxyGroups(renderableNodes);

  const config = {
    "mixed-port": 7890,
    "allow-lan": false,
    mode: "rule",
    "log-level": "info",
    proxies,
    "proxy-groups": proxyGroups.length > 0 ? proxyGroups : [createProxyGroup("Proxy", proxyNames)],
    rules: ["MATCH,Proxy"]
  };

  return `# ${input.profileName}\n${YAML.stringify(config)}`;
}

function buildProxyGroups(nodes: Array<{ proxy: Record<string, unknown>; groups: string[] }>) {
  const groups = new Map<string, string[]>();
  const ungrouped: string[] = [];

  for (const node of nodes) {
    const proxyName = String(node.proxy.name);
    const nodeGroups = uniqueStrings(node.groups);

    if (nodeGroups.length === 0) {
      ungrouped.push(proxyName);
      continue;
    }

    for (const group of nodeGroups) {
      groups.set(group, [...(groups.get(group) ?? []), proxyName]);
    }
  }

  if (groups.size === 0 && ungrouped.length === 0) {
    return [];
  }

  const groupNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  const renderedGroupNames = groupNames.map(renderGroupName);
  const mainProxies =
    renderedGroupNames.length > 0 ? [...renderedGroupNames, ...uniqueStrings(ungrouped)] : uniqueStrings(ungrouped);
  const proxyGroups = [createProxyGroup("Proxy", mainProxies)];

  for (const groupName of groupNames) {
    proxyGroups.push(createProxyGroup(renderGroupName(groupName), uniqueStrings(groups.get(groupName) ?? [])));
  }

  return proxyGroups;
}

function createProxyGroup(name: string, proxies: string[]) {
  return {
    name,
    type: "select",
    proxies: proxies.length > 0 ? proxies : ["DIRECT"]
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function renderGroupName(group: string) {
  return `Group: ${group}`;
}

function toProxy(node: RenderableNode): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(node.config_json) as Record<string, unknown>;
    return {
      name: node.name,
      ...stripInternalFields(parsed)
    };
  } catch {
    return null;
  }
}

export function renderPlainSubscription(input: RenderClashConfigInput): string {
  return input.nodes.map(getRawUri).filter((uri): uri is string => uri !== null).join("\n");
}

export function renderV2rayNSubscription(input: RenderClashConfigInput): string {
  const plain = renderPlainSubscription(input);
  return encodeBase64(plain ? `${plain}\n` : "");
}

export function renderSingBoxConfig(input: RenderClashConfigInput): string {
  const outbounds = input.nodes
    .map(toSingBoxOutbound)
    .filter((outbound): outbound is Record<string, unknown> => outbound !== null);
  const outboundTags = outbounds.map((outbound) => String(outbound.tag));
  const grouped = buildSingBoxSelectors(input.nodes, outboundTags);

  const config = {
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
    outbounds: [
      createSingBoxSelector("Proxy", grouped.main.length > 0 ? grouped.main : ["direct"]),
      ...grouped.groups,
      ...outbounds,
      {
        type: "direct",
        tag: "direct"
      }
    ],
    route: {
      final: "Proxy"
    }
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

function getRawUri(node: RenderableNode) {
  try {
    const parsed = JSON.parse(node.config_json) as Record<string, unknown>;
    return typeof parsed.__rawUri === "string" ? parsed.__rawUri : null;
  } catch {
    return null;
  }
}

function stripInternalFields(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith("__")));
}

function toSingBoxOutbound(node: RenderableNode): Record<string, unknown> | null {
  try {
    const parsed = stripInternalFields(JSON.parse(node.config_json) as Record<string, unknown>);
    const tag = node.name;
    const server = stringValue(parsed.server);
    const serverPort = numberValue(parsed.port);

    if (!server || !serverPort) {
      return null;
    }

    switch (parsed.type) {
      case "ss":
        return compact({
          type: "shadowsocks",
          tag,
          server,
          server_port: serverPort,
          method: stringValue(parsed.cipher),
          password: stringValue(parsed.password)
        });
      case "trojan":
        return compact({
          type: "trojan",
          tag,
          server,
          server_port: serverPort,
          password: stringValue(parsed.password),
          tls: parsed.tls ? { enabled: true } : undefined
        });
      case "vmess":
        return compact({
          type: "vmess",
          tag,
          server,
          server_port: serverPort,
          uuid: stringValue(parsed.uuid),
          security: stringValue(parsed.cipher) ?? "auto",
          alter_id: numberValue(parsed.alterId),
          tls: parsed.tls ? { enabled: true } : undefined
        });
      case "vless":
        return compact({
          type: "vless",
          tag,
          server,
          server_port: serverPort,
          uuid: stringValue(parsed.uuid),
          tls: parsed.tls ? { enabled: true } : undefined
        });
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function buildSingBoxSelectors(nodes: RenderableNode[], outboundTags: string[]) {
  const groups = new Map<string, string[]>();
  const ungrouped: string[] = [];
  const tagSet = new Set(outboundTags);

  for (const node of nodes) {
    if (!tagSet.has(node.name)) {
      continue;
    }

    const nodeGroups = uniqueStrings(node.groups ?? []);

    if (nodeGroups.length === 0) {
      ungrouped.push(node.name);
      continue;
    }

    for (const group of nodeGroups) {
      groups.set(group, [...(groups.get(group) ?? []), node.name]);
    }
  }

  const groupNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  const renderedGroupNames = groupNames.map(renderGroupName);

  return {
    main: renderedGroupNames.length > 0 ? [...renderedGroupNames, ...uniqueStrings(ungrouped)] : uniqueStrings(ungrouped),
    groups: groupNames.map((groupName) =>
      createSingBoxSelector(renderGroupName(groupName), uniqueStrings(groups.get(groupName) ?? []))
    )
  };
}

function createSingBoxSelector(tag: string, outbounds: string[]) {
  return {
    type: "selector",
    tag,
    outbounds: outbounds.length > 0 ? outbounds : ["direct"]
  };
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 8192;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return globalThis.btoa(binary);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")
  ) as T;
}
