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
        local_address: stringList(parsed.ip, parsed.ipv6),
        private_key: stringValue(parsed["private-key"]),
        peer_public_key: stringValue(parsed["public-key"]),
        pre_shared_key: stringValue(parsed["pre-shared-key"]),
        reserved: reservedBytes(parsed.reserved),
        network: stringValue(parsed.network),
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

function stringList(...values: unknown[]) {
  const items = values.flatMap((value) => {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value === "string") {
      return value.split(",");
    }

    return [];
  }).map((item) => item.trim()).filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function reservedBytes(value: unknown) {
  const values = stringList(value)
    ?.map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 255);

  return values && values.length > 0 ? values : undefined;
}
