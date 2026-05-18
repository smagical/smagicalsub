import { baseAuthOutbound, withTls } from "./sing-box-shared";
import { numberValue, stringValue } from "./utils";

export function toSpecialSingBoxOutbound(
  parsed: Record<string, unknown>,
  tag: string,
  server: string,
  serverPort: number
) {
  // 特殊协议字段差异大，集中在这里便于后续按官方 schema 精细补齐。
  switch (parsed.type) {
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
