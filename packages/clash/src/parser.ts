import { parseShadowsocks } from "./parsers/shadowsocks";
import { parseShadowsocksR } from "./parsers/ssr";
import type { ParsedNode } from "./parsers/types";
import { parseUrlNode } from "./parsers/url-node";
import { isUrlNodeUri } from "./parsers/url-schemes";
import { tryDecodeBase64 } from "./parsers/utils";
import { parseVmess } from "./parsers/vmess";

export type { ParsedNode } from "./parsers/types";

// 订阅内容可能是 base64 包裹的多行 URI，也可能已经是明文。
// 单条节点解析失败时直接丢弃，避免一条脏数据阻断整次源刷新。
export function parseSubscription(content: string): ParsedNode[] {
  const normalized = tryDecodeBase64(content);
  return normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseNodeUri)
    .filter((node): node is ParsedNode => node !== null);
}

export function parseNodeUri(uri: string): ParsedNode | null {
  try {
    // 所有入口统一转换为 ParsedNode，后续 D1 存储和渲染层只依赖这个中间结构。
    if (uri.startsWith("vmess://")) {
      return parseVmess(uri);
    }

    if (isUrlNodeUri(uri)) {
      return parseUrlNode(uri);
    }

    if (uri.startsWith("ss://")) {
      return parseShadowsocks(uri);
    }

    if (uri.startsWith("ssr://")) {
      return parseShadowsocksR(uri);
    }
  } catch {
    return null;
  }

  return null;
}
