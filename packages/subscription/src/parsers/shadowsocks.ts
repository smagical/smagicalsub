import type { ParsedNode } from "./types";
import { compact, tryDecodeBase64 } from "./utils";

export function parseShadowsocks(uri: string): ParsedNode | null {
  // ss URI 常见形式有直接 userinfo 和整体 base64，这里同时兼容两种来源。
  const withoutScheme = uri.slice("ss://".length);
  const [main, hash = ""] = withoutScheme.split("#");
  const name = decodeURIComponent(hash || "shadowsocks");
  const [body, query = ""] = main.split("?");
  const decoded = body.includes("@") ? body : tryDecodeBase64(body);
  const match = decoded.match(/^([^:]+):([^@]+)@(.+):(\d+)$/);

  if (!match) {
    return null;
  }

  const [, cipher, password, server, port] = match;
  const params = new URLSearchParams(query);

  return {
    name,
    protocol: "ss",
    server,
    port: Number(port),
    rawUri: uri,
    config: compact({
      type: "ss",
      server,
      port: Number(port),
      cipher,
      password,
      plugin: params.get("plugin") ?? undefined
    })
  };
}
