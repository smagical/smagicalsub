import type { RenderSubscriptionBaseInput, RenderableNode } from "./types";
import { compact, getNodeConfig, numberValue, renderGroupName, stringValue, stripInternalFields, uniqueStrings } from "./utils";

export function renderSingBoxConfig(input: RenderSubscriptionBaseInput): string {
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

function toSingBoxOutbound(node: RenderableNode): Record<string, unknown> | null {
  try {
    const parsed = stripInternalFields(getNodeConfig(node));
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

// sing-box selector outbounds mirror the same grouping model used by Clash.
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

