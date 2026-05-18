import type { ParsedNode } from "./types";
import { compact } from "./utils";
import { toUrlNodeConfig } from "./url-config";
import { urlPort } from "./url-options";
import { normalizeUrlProtocol } from "./url-schemes";

export function parseUrlNode(uri: string): ParsedNode | null {
  // URL 型协议共享 host/port/hash/query 结构，协议差异收敛到专门的配置映射函数。
  const url = new URL(uri);
  const protocol = normalizeUrlProtocol(url.protocol.replace(":", ""));
  const name = decodeURIComponent(url.hash.slice(1) || url.hostname || protocol);
  const config = toUrlNodeConfig(protocol, url);

  return {
    name,
    protocol,
    server: url.hostname,
    port: urlPort(url),
    rawUri: uri,
    config: compact(config)
  };
}
