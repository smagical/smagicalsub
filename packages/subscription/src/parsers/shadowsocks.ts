import type { ParsedNode } from "./types";
import { compact, tryDecodeBase64 } from "./utils";

export function parseShadowsocks(uri: string): ParsedNode | null {
  // ss URI 常见形式有直接 userinfo、userinfo base64 和整体 base64，这里同时兼容。
  const withoutScheme = uri.slice("ss://".length);
  const [main, hash = ""] = withoutScheme.split("#");
  const name = decodeURIComponent(hash || "shadowsocks");
  const [body, query = ""] = main.split("?");
  const parsed = parseShadowsocksBody(body);

  if (!parsed) {
    return null;
  }

  const params = new URLSearchParams(query);

  return {
    name,
    protocol: "ss",
    server: parsed.server,
    port: parsed.port,
    rawUri: uri,
    config: compact({
      type: "ss",
      server: parsed.server,
      port: parsed.port,
      cipher: parsed.cipher,
      password: parsed.password,
      plugin: params.get("plugin") ?? undefined
    })
  };
}

function parseShadowsocksBody(body: string) {
  if (body.includes("@")) {
    const atIndex = body.lastIndexOf("@");
    const userInfo = decodeURIComponent(body.slice(0, atIndex));
    const endpoint = parseEndpoint(body.slice(atIndex + 1));
    const credentials = parseCredentials(userInfo.includes(":") ? userInfo : tryDecodeBase64(userInfo));

    return endpoint && credentials ? { ...credentials, ...endpoint } : null;
  }

  const decoded = tryDecodeBase64(body);
  const atIndex = decoded.lastIndexOf("@");

  if (atIndex < 0) {
    return null;
  }

  const credentials = parseCredentials(decoded.slice(0, atIndex));
  const endpoint = parseEndpoint(decoded.slice(atIndex + 1));

  return endpoint && credentials ? { ...credentials, ...endpoint } : null;
}

function parseCredentials(value: string) {
  const separator = value.indexOf(":");

  if (separator <= 0) {
    return null;
  }

  return {
    cipher: value.slice(0, separator),
    password: value.slice(separator + 1)
  };
}

function parseEndpoint(value: string) {
  const decoded = decodeURIComponent(value);
  const ipv6Match = decoded.match(/^\[([^\]]+)\]:(\d+)$/);

  if (ipv6Match) {
    return { server: ipv6Match[1], port: Number(ipv6Match[2]) };
  }

  const separator = decoded.lastIndexOf(":");

  if (separator < 0) {
    return null;
  }

  const server = decoded.slice(0, separator);
  const port = Number(decoded.slice(separator + 1));

  return server && Number.isFinite(port) ? { server, port } : null;
}
