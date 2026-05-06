import type { RenderSubscriptionBaseInput, RenderableNode } from "./types";
import { createPolicyContext, renderXrayRoutingRules } from "./rules";
import { compact, getNodeConfig, numberValue, stringValue, stripInternalFields } from "./utils";

type XrayOutbound = Record<string, unknown>;

export function renderXrayConfig(input: RenderSubscriptionBaseInput): string {
  const primarySelector = input.defaultStrategy ?? "Proxy";
  const nodeOutbounds = input.nodes
    .map(toXrayOutbound)
    .filter((outbound): outbound is XrayOutbound => outbound !== null);
  const outboundTags = nodeOutbounds.map((outbound) => String(outbound.tag));
  const policyContext = createPolicyContext(input.nodes, outboundTags, primarySelector);
  policyContext.selectorTags = nodeOutbounds.length > 0 ? new Set([primarySelector]) : new Set();
  const routingRules = renderXrayRoutingRules(input.rules ?? [], policyContext);
  const balancers = nodeOutbounds.length > 0
    ? [
        {
          tag: primarySelector,
          selector: ["node:"]
        }
      ]
    : [];

  const config = {
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
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

function toXrayOutbound(node: RenderableNode): XrayOutbound | null {
  try {
    const parsed = stripInternalFields(getNodeConfig(node));
    const tag = `node:${node.name}`;
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
      return httpLikeOutbound("http", parsed, tag, server, port);
    case "socks4":
    case "socks5":
      return httpLikeOutbound("socks", parsed, tag, server, port);
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

function tlsSettings(parsed: Record<string, unknown>) {
  return compact({
    serverName: stringValue(parsed.sni) ?? stringValue(parsed.servername),
    allowInsecure: parsed["skip-cert-verify"] === true
  });
}

function realitySettings(parsed: Record<string, unknown>) {
  const options = objectValue(parsed["reality-opts"]);

  return compact({
    serverName: stringValue(options["server-name"]) ?? stringValue(parsed.sni) ?? stringValue(parsed.servername),
    publicKey: stringValue(options["public-key"]),
    shortId: stringValue(options["short-id"]),
    fingerprint: stringValue(options.fingerprint)
  });
}

function securityMode(parsed: Record<string, unknown>) {
  if (parsed["reality-opts"]) {
    return "reality";
  }

  return parsed.tls === true ? "tls" : undefined;
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
