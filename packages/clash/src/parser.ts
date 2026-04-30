export type ParsedNode = {
  name: string;
  protocol: string;
  server?: string;
  port?: number;
  rawUri: string;
  config: Record<string, unknown>;
};

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
    if (uri.startsWith("vmess://")) {
      return parseVmess(uri);
    }

    if (uri.startsWith("trojan://") || uri.startsWith("vless://")) {
      return parseUrlNode(uri);
    }

    if (uri.startsWith("ss://")) {
      return parseShadowsocks(uri);
    }
  } catch {
    return null;
  }

  return null;
}

function parseVmess(uri: string): ParsedNode | null {
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

function parseUrlNode(uri: string): ParsedNode | null {
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

function parseShadowsocks(uri: string): ParsedNode | null {
  const withoutScheme = uri.slice("ss://".length);
  const [main, hash = ""] = withoutScheme.split("#");
  const name = decodeURIComponent(hash || "shadowsocks");
  const decoded = main.includes("@") ? main : tryDecodeBase64(main);
  const match = decoded.match(/^([^:]+):([^@]+)@([^:]+):(\d+)$/);

  if (!match) {
    return null;
  }

  const [, cipher, password, server, port] = match;

  return {
    name,
    protocol: "ss",
    server,
    port: Number(port),
    rawUri: uri,
    config: {
      type: "ss",
      server,
      port: Number(port),
      cipher,
      password
    }
  };
}

function tryDecodeBase64(value: string) {
  const normalized = value.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  try {
    const binary = globalThis.atob(normalized + padding);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return value;
  }
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")
  ) as T;
}
