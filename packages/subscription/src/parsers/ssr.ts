import type { ParsedNode } from "./types";
import { compact, decodeMaybeBase64Url } from "./utils";

export function parseShadowsocksR(uri: string): ParsedNode | null {
  // SSR URI 的主体和部分查询值都是 base64-url 编码，先还原为 Clash 可消费的 ssr 配置。
  const decoded = decodeMaybeBase64Url(uri.slice("ssr://".length));
  const [main, query = ""] = decoded.split("/?");
  const parts = main.split(":");

  if (parts.length < 6) {
    return null;
  }

  const [server, port, protocol, cipher, obfs, encodedPassword] = parts;
  const params = new URLSearchParams(query);
  const name = decodeMaybeBase64Url(params.get("remarks") ?? "") || server;
  const password = decodeMaybeBase64Url(encodedPassword);

  return {
    name,
    protocol: "ssr",
    server,
    port: Number(port),
    rawUri: uri,
    config: compact({
      type: "ssr",
      server,
      port: Number(port),
      cipher,
      password,
      protocol,
      obfs,
      "protocol-param": decodeMaybeBase64Url(params.get("protoparam") ?? ""),
      "obfs-param": decodeMaybeBase64Url(params.get("obfsparam") ?? "")
    })
  };
}
