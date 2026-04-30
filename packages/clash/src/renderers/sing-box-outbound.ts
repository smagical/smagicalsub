import type { RenderableNode } from "./types";
import { toSpecialSingBoxOutbound } from "./sing-box-special-outbound";
import { baseAuthOutbound, withTls } from "./sing-box-shared";
import { compact, getNodeConfig, numberValue, stringValue, stripInternalFields } from "./utils";

export function toSingBoxOutbound(node: RenderableNode): Record<string, unknown> | null {
  try {
    const parsed = stripInternalFields(getNodeConfig(node));
    const tag = node.name;
    const server = stringValue(parsed.server);
    const serverPort = numberValue(parsed.port);

    if (!server || !serverPort) {
      return null;
    }

    return createOutbound(parsed, tag, server, serverPort);
  } catch {
    return null;
  }
}

function createOutbound(parsed: Record<string, unknown>, tag: string, server: string, serverPort: number) {
  // sing-box JSON 比原始 URI 更严格，只转换字段结构确定的协议，避免生成不可启动配置。
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
      return withTls(parsed, {
        type: "trojan",
        tag,
        server,
        server_port: serverPort,
        password: stringValue(parsed.password)
      });
    case "vmess":
      return withTls(parsed, {
        type: "vmess",
        tag,
        server,
        server_port: serverPort,
        uuid: stringValue(parsed.uuid),
        security: stringValue(parsed.cipher) ?? "auto",
        alter_id: numberValue(parsed.alterId)
      });
    case "vless":
      return withTls(parsed, {
        type: "vless",
        tag,
        server,
        server_port: serverPort,
        uuid: stringValue(parsed.uuid),
        flow: stringValue(parsed.flow)
      });
    case "hysteria":
      return withTls(parsed, {
        type: "hysteria",
        tag,
        server,
        server_port: serverPort,
        auth: stringValue(parsed.auth) ?? stringValue(parsed["auth-str"]),
        up: stringValue(parsed.up),
        down: stringValue(parsed.down)
      });
    case "hysteria2":
      return withTls(parsed, {
        type: "hysteria2",
        tag,
        server,
        server_port: serverPort,
        password: stringValue(parsed.password)
      });
    case "tuic":
      return withTls(parsed, {
        type: "tuic",
        tag,
        server,
        server_port: serverPort,
        uuid: stringValue(parsed.uuid),
        password: stringValue(parsed.password),
        congestion_control: stringValue(parsed["congestion-controller"])
      });
    case "http":
      return withTls(parsed, baseAuthOutbound("http", tag, server, serverPort, parsed));
    case "socks4":
    case "socks5":
      return compact({
        ...baseAuthOutbound("socks", tag, server, serverPort, parsed),
        version: parsed.type === "socks4" ? "4" : undefined
      });
    case "ssh":
      return compact({
        type: "ssh",
        tag,
        server,
        server_port: serverPort,
        user: stringValue(parsed.username),
        password: stringValue(parsed.password),
        private_key: stringValue(parsed["private-key"])
      });
    case "wireguard":
    case "anytls":
    case "naive":
    case "shadowtls":
      return toSpecialSingBoxOutbound(parsed, tag, server, serverPort);
    default:
      return null;
  }
}
