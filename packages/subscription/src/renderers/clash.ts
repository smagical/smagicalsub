import YAML from "yaml";
import type { RenderSubscriptionBaseInput, RenderableNode } from "./types";
import { getNodeConfig, renderGroupName, stripInternalFields, uniqueStrings } from "./utils";

export function renderClashConfig(input: RenderSubscriptionBaseInput): string {
  // Clash 可直接消费内部通用配置，但渲染前必须去掉 __rawUri 等内部字段。
  const renderableNodes = input.nodes
    .map((node) => {
      const proxy = toProxy(node);
      return proxy ? { proxy, groups: node.groups ?? [] } : null;
    })
    .filter((node): node is { proxy: Record<string, unknown>; groups: string[] } => node !== null);
  const proxies = renderableNodes.map((node) => node.proxy);
  const proxyNames = proxies.map((proxy) => String(proxy.name));
  const primaryProxyGroup = input.defaultStrategy ?? "Proxy";
  const proxyGroups = buildProxyGroups(renderableNodes, primaryProxyGroup);
  const rules = buildRules(input.rules ?? [], primaryProxyGroup);

  const config = {
    "mixed-port": 7890,
    "allow-lan": false,
    mode: "rule",
    "log-level": "info",
    proxies,
    "proxy-groups": proxyGroups.length > 0 ? proxyGroups : [createProxyGroup(primaryProxyGroup, proxyNames)],
    rules
  };

  return `# ${input.profileName}\n${YAML.stringify(config)}`;
}

// 主 Proxy 组先引用生成的分组选择器，再追加未分组节点，便于客户端快速切换策略。
function buildProxyGroups(nodes: Array<{ proxy: Record<string, unknown>; groups: string[] }>, primaryProxyGroup: string) {
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
  const proxyGroups = [createProxyGroup(primaryProxyGroup, mainProxies)];

  for (const groupName of groupNames) {
    proxyGroups.push(createProxyGroup(renderGroupName(groupName), uniqueStrings(groups.get(groupName) ?? [])));
  }

  return proxyGroups;
}

function buildRules(rules: string[], primaryProxyGroup: string) {
  const profileRules = uniqueStrings(rules);
  const hasMatchFallback = profileRules.some((rule) => rule.toUpperCase().startsWith("MATCH,"));

  return hasMatchFallback ? profileRules : [...profileRules, `MATCH,${primaryProxyGroup}`];
}

function createProxyGroup(name: string, proxies: string[]) {
  return {
    name,
    type: "select",
    proxies: proxies.length > 0 ? proxies : ["DIRECT"]
  };
}

function toProxy(node: RenderableNode): Record<string, unknown> | null {
  try {
    return {
      name: node.name,
      ...stripInternalFields(getNodeConfig(node))
    };
  } catch {
    return null;
  }
}
