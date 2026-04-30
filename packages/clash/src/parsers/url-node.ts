import type { ParsedNode } from "./types";
import { compact } from "./utils";

export function parseUrlNode(uri: string): ParsedNode | null {
  // trojan/vless 都符合 URL 结构，只在认证字段名上区分 password 和 uuid。
  const url = new URL(uri);
  const protocol = url.protocol.replace(":", "");
  const name = decodeURIComponent(url.hash.slice(1) || url.hostname || protocol);
  const config: Record<string, unknown> = {
    type: protocol,
    server: url.hostname,
    port: Number(url.port),
    password: protocol === "trojan" ? decodeURIComponent(url.username) : undefined,
    uuid: protocol === "vless" ? decodeURIComponent(url.username) : undefined,
    network: url.searchParams.get("type") ?? undefined,
    tls: url.searchParams.get("security") === "tls"
  };

  return {
    name,
    protocol,
    server: url.hostname,
    port: Number(url.port),
    rawUri: uri,
    config: compact(config)
  };
}
