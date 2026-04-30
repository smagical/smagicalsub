import type { ParsedNode } from "./types";
import { compact, tryDecodeBase64 } from "./utils";

export function parseVmess(uri: string): ParsedNode | null {
  // vmess 的 JSON 字段来自客户端约定，先转换为 Clash 兼容字段，其他渲染器再二次映射。
  const json = tryDecodeBase64(uri.slice("vmess://".length));
  const payload = JSON.parse(json) as {
    ps?: string;
    add?: string;
    port?: string | number;
    id?: string;
    aid?: string | number;
    net?: string;
    type?: string;
    host?: string;
    path?: string;
    tls?: string;
  };

  const name = payload.ps ?? payload.add ?? "vmess";
  const config = {
    type: "vmess",
    server: payload.add,
    port: Number(payload.port),
    uuid: payload.id,
    alterId: Number(payload.aid ?? 0),
    cipher: "auto",
    network: payload.net,
    tls: payload.tls === "tls",
    "ws-opts": payload.path || payload.host
      ? {
          path: payload.path,
          headers: payload.host ? { Host: payload.host } : undefined
        }
      : undefined
  };

  return {
    name,
    protocol: "vmess",
    server: payload.add,
    port: Number(payload.port),
    rawUri: uri,
    config: compact(config)
  };
}
