import type { RenderSubscriptionBaseInput, RenderableNode } from "./types";
import { createPolicyContext, renderXrayProfileRules } from "./rules";
import { mergeConfig, moduleOverridesFor } from "./modules";
import { defaultGroupName, compact, getNodeConfig, numberValue, renderGroupName, stringValue, stripInternalFields, uniqueStrings } from "./utils";

type XrayOutbound = Record<string, unknown>;
type TaggedXrayNode = {
  node: RenderableNode;
  tag: string;
};

export function renderXrayConfig(input: RenderSubscriptionBaseInput): string {
  const primarySelector = input.defaultStrategy ?? "Proxy";
  const taggedNodes = input.nodes.map((node, index) => ({ node, tag: xrayNodeTag(node, index) }));
  const nodeOutbounds = taggedNodes
    .map(({ node, tag }) => toXrayOutbound(node, tag))
    .filter((outbound): outbound is XrayOutbound => outbound !== null);
  const outboundTags = nodeOutbounds.map((outbound) => String(outbound.tag));
  const nodeTagByName = new Map(
    taggedNodes
      .filter(({ tag }) => outboundTags.includes(tag))
      .map(({ node, tag }): [string, string] => [node.name, tag])
  );
  const balancers = buildXrayBalancers(taggedNodes, outboundTags, primarySelector);
  const policyContext = createPolicyContext(input.nodes, outboundTags, primarySelector, {
    nodeTagByName,
    selectorTags: new Set(balancers.map((balancer) => String(balancer.tag)))
  });
  const routingRules = renderXrayProfileRules(input.profileRules, policyContext);

  const config = mergeConfig(
    {
    log: {
      loglevel: "warning"
    },
    inbounds: [
      {
        tag: "socks-in",
        listen: "127.0.0.1",
        port: 10808,
        protocol: "socks",
        settings: {
          udp: true
        },
        sniffing: {
          enabled: true,
          destOverride: ["http", "tls", "quic"]
        }
      }
    ],
    outbounds: [
      ...nodeOutbounds,
      {
        tag: "direct",
        protocol: "freedom"
      },
      {
        tag: "block",
        protocol: "blackhole"
      }
    ],
    routing: compact({
      domainStrategy: "AsIs",
      rules: routingRules,
      balancers: balancers.length > 0 ? balancers : undefined
    })
    },
    moduleOverridesFor(input.modules, "xray")
  );

  return `${JSON.stringify(config, null, 2)}\n`;
}

function buildXrayBalancers(nodes: TaggedXrayNode[], outboundTags: string[], primarySelector: string) {
  const balancers: Array<Record<string, unknown>> = [
    createXrayBalancer(primarySelector, outboundTags.length > 0 ? ["node:"] : ["direct"])
  ];
  const groups = new Map<string, string[]>();
  const tagSet = new Set(outboundTags);

  for (const { node, tag } of nodes) {
    if (!tagSet.has(tag)) {
      continue;
    }

    const nodeGroups = uniqueStrings(node.groups ?? []);
    const effectiveGroups = nodeGroups.length > 0 ? nodeGroups : [defaultGroupName];

    for (const group of effectiveGroups) {
      groups.set(group, [...(groups.get(group) ?? []), tag]);
    }
  }

  const groupNames = Array.from(groups.keys()).sort((left, right) => left.localeCompare(right));

  for (const groupName of groupNames) {
    balancers.push(createXrayBalancer(renderGroupName(groupName), uniqueStrings(groups.get(groupName) ?? [])));
  }

  return balancers;
}

function createXrayBalancer(tag: string, selector: string[]) {
  return {
    selector: selector.length > 0 ? selector : ["direct"],
    tag
  };
}

function xrayNodeTag(node: RenderableNode, index: number) {
  return `node:${index}:${node.name}`;
}

function toXrayOutbound(node: RenderableNode, tag: string): XrayOutbound | null {
  try {
    const parsed = stripInternalFields(getNodeConfig(node));
    const server = stringValue(parsed.server);
    const port = numberValue(parsed.port);

    if (!server || !port) {
      return null;
    }

    return createOutbound(parsed, tag, server, port);
  } catch {
    return null;
  }
}

function createOutbound(parsed: Record<string, unknown>, tag: string, server: string, port: number) {
  switch (parsed.type) {
    case "ss":
      return {
        tag,
        protocol: "shadowsocks",
        settings: {
          servers: [
            compact({
              address: server,
              port,
              method: stringValue(parsed.cipher),
              password: stringValue(parsed.password)
            })
          ]
        }
      };
    case "trojan":
      return withStreamSettings(parsed, {
        tag,
        protocol: "trojan",
        settings: {
          servers: [
            compact({
              address: server,
              port,
              password: stringValue(parsed.password)
            })
          ]
        }
      });
    case "vmess":
      return withStreamSettings(parsed, {
        tag,
        protocol: "vmess",
        settings: {
          vnext: [
            {
              address: server,
              port,
              users: [
                compact({
                  id: stringValue(parsed.uuid),
                  alterId: numberValue(parsed.alterId),
                  security: stringValue(parsed.cipher) ?? "auto"
                })
              ]
            }
          ]
        }
      });
    case "vless":
      return withStreamSettings(parsed, {
        tag,
        protocol: "vless",
        settings: {
          vnext: [
            {
              address: server,
              port,
              users: [
                compact({
                  id: stringValue(parsed.uuid),
                  encryption: "none",
                  flow: stringValue(parsed.flow)
                })
              ]
            }
          ]
        }
      });
    case "http":
      return withStreamSettings(parsed, httpLikeOutbound("http", parsed, tag, server, port));
    case "socks4":
    case "socks5":
      return withStreamSettings(parsed, httpLikeOutbound("socks", parsed, tag, server, port));
    case "hysteria":
    case "hysteria2":
      return {
        tag,
        protocol: "hysteria",
        settings: {
          address: server,
          port,
          version: 2
        },
        streamSettings: compact({
          network: "hysteria",
          hysteriaSettings: compact({
            auth: stringValue(parsed.auth) ?? stringValue(parsed["auth-str"]) ?? stringValue(parsed.password),
            version: 2
          }),
          security: "tls",
          tlsSettings: tlsSettings(parsed)
        })
      };
    case "wireguard":
      return {
        tag,
        protocol: "wireguard",
        settings: compact({
          address: stringList(parsed.ip, parsed.ipv6),
          mtu: numberValue(parsed.mtu),
          peers: [
            compact({
              endpoint: `${server}:${port}`,
              publicKey: stringValue(parsed["public-key"]),
              preSharedKey: stringValue(parsed["pre-shared-key"])
            })
          ],
          reserved: reservedBytes(parsed.reserved),
          secretKey: stringValue(parsed["private-key"])
        })
      };
    default:
      return null;
  }
}

function httpLikeOutbound(protocol: "http" | "socks", parsed: Record<string, unknown>, tag: string, server: string, port: number) {
  const username = stringValue(parsed.username);
  const password = stringValue(parsed.password);

  return {
    tag,
    protocol,
    settings: {
      servers: [
        compact({
          address: server,
          port,
          users: username || password
            ? [
                compact({
                  user: username,
                  pass: password
                })
              ]
            : undefined
        })
      ]
    }
  };
}

function withStreamSettings(parsed: Record<string, unknown>, outbound: XrayOutbound) {
  const streamSettings = createStreamSettings(parsed);

  return compact({
    ...outbound,
    streamSettings
  });
}

function createStreamSettings(parsed: Record<string, unknown>) {
  const network = stringValue(parsed.network);
  const security = securityMode(parsed);

  return compact({
    network,
    security,
    wsSettings: network === "ws" ? websocketSettings(parsed) : undefined,
    grpcSettings: network === "grpc" ? grpcSettings(parsed) : undefined,
    httpupgradeSettings: network === "httpupgrade" ? httpUpgradeSettings(parsed) : undefined,
    tlsSettings: security === "tls" ? tlsSettings(parsed) : undefined,
    realitySettings: security === "reality" ? realitySettings(parsed) : undefined
  });
}

function websocketSettings(parsed: Record<string, unknown>) {
  const options = objectValue(parsed["ws-opts"]);
  const headers = objectValue(options.headers);

  return compact({
    path: stringValue(options.path),
    headers: Object.keys(headers).length > 0 ? headers : undefined
  });
}

function grpcSettings(parsed: Record<string, unknown>) {
  const options = objectValue(parsed["grpc-opts"]);

  return compact({
    serviceName: stringValue(options["grpc-service-name"]) ?? stringValue(options.serviceName)
  });
}

function httpUpgradeSettings(parsed: Record<string, unknown>) {
  const options = objectValue(parsed["ws-opts"]);
  const headers = objectValue(options.headers);

  return compact({
    path: stringValue(options.path),
    headers: Object.keys(headers).length > 0 ? headers : undefined
  });
}

function tlsSettings(parsed: Record<string, unknown>) {
  return compact({
    serverName: stringValue(parsed.sni) ?? stringValue(parsed.servername),
    allowInsecure: parsed["skip-cert-verify"] === true,
    alpn: stringList(parsed.alpn),
    fingerprint: stringValue(parsed.fingerprint) ?? stringValue(parsed["client-fingerprint"])
  });
}

function realitySettings(parsed: Record<string, unknown>) {
  const options = objectValue(parsed["reality-opts"]);

  return compact({
    serverName: stringValue(options["server-name"]) ?? stringValue(parsed.sni) ?? stringValue(parsed.servername),
    publicKey: stringValue(options["public-key"]),
    shortId: stringValue(options["short-id"]),
    spiderX: stringValue(options.spiderX) ?? (stringValue(options["public-key"]) ? "/" : undefined),
    fingerprint: stringValue(options.fingerprint) ?? stringValue(parsed.fingerprint) ?? stringValue(parsed["client-fingerprint"])
  });
}

function securityMode(parsed: Record<string, unknown>) {
  if (parsed.security === "reality" || parsed["reality-opts"]) {
    return "reality";
  }

  return parsed.security === "tls" || parsed.tls === true ? "tls" : undefined;
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringList(...values: unknown[]) {
  const items = values.flatMap((value) => {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value === "string" && value.trim()) {
      return value.split(",");
    }

    return [];
  }).map((item) => item.trim()).filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function numberLike(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function reservedBytes(value: unknown) {
  const values = stringList(value)
    ?.map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 255);

  return values && values.length > 0 ? values : undefined;
}
