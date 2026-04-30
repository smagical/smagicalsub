import YAML from "yaml";

export type RenderableNode = {
  id?: string;
  name: string;
  protocol?: string;
  config_json: string;
  groups?: string[];
};

export type RenderClashConfigInput = {
  profileName: string;
  nodes: RenderableNode[];
};

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
      ...parsed
    };
  } catch {
    return null;
  }
}
