import YAML from "yaml";

export type RenderableNode = {
  id?: string;
  name: string;
  protocol?: string;
  config_json: string;
};

export type RenderClashConfigInput = {
  profileName: string;
  nodes: RenderableNode[];
};

export function renderClashConfig(input: RenderClashConfigInput): string {
  const proxies = input.nodes.map(toProxy).filter((proxy): proxy is Record<string, unknown> => proxy !== null);
  const proxyNames = proxies.map((proxy) => String(proxy.name));

  const config = {
    mixed_port: 7890,
    allow_lan: false,
    mode: "rule",
    log_level: "info",
    proxies,
    "proxy-groups": [
      {
        name: "Proxy",
        type: "select",
        proxies: proxyNames.length > 0 ? proxyNames : ["DIRECT"]
      }
    ],
    rules: ["MATCH,Proxy"]
  };

  return `# ${input.profileName}\n${YAML.stringify(config)}`;
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

