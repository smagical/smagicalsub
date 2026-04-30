import { baseAuthOutbound, withTls } from "./sing-box-shared";
import { compact, numberValue, stringValue } from "./utils";

export function toSpecialSingBoxOutbound(
  parsed: Record<string, unknown>,
  tag: string,
  server: string,
  serverPort: number
) {
  // 特殊协议字段差异大，集中在这里便于后续按官方 schema 精细补齐。
  switch (parsed.type) {
    case "wireguard":
      return compact({
        type: "wireguard",
        tag,
        server,
        server_port: serverPort,
        local_address: stringValue(parsed.ip),
        private_key: stringValue(parsed["private-key"]),
        peer_public_key: stringValue(parsed["public-key"]),
        pre_shared_key: stringValue(parsed["pre-shared-key"]),
        reserved: stringValue(parsed.reserved),
        mtu: numberValue(parsed.mtu)
      });
    case "anytls":
      return withTls(
        parsed,
        {
          type: "anytls",
          tag,
          server,
          server_port: serverPort,
          password: stringValue(parsed.password)
        },
        true
      );
    case "naive":
      return withTls(parsed, baseAuthOutbound("naive", tag, server, serverPort, parsed), true);
    case "shadowtls":
      return withTls(
        parsed,
        {
          type: "shadowtls",
          tag,
          server,
          server_port: serverPort,
          version: numberValue(parsed.version),
          password: stringValue(parsed.password)
        },
        true
      );
    default:
      return null;
  }
}
