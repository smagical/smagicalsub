const protocolAliases: Record<string, string> = {
  hy2: "hysteria2",
  https: "http",
  socks: "socks5",
  wg: "wireguard",
  "shadow-tls": "shadowtls",
  trustunnel: "trust-tunnel"
};

// 这里维护“可按 URL 结构解析”的协议；ss/ssr/vmess 有独立历史格式解析器。
const urlNodeProtocols = new Set([
  "anytls",
  "http",
  "hysteria",
  "hysteria2",
  "juicity",
  "masque",
  "mieru",
  "naive",
  "shadowtls",
  "snell",
  "socks4",
  "socks5",
  "ssh",
  "sudoku",
  "trojan",
  "trust-tunnel",
  "tuic",
  "vless",
  "wireguard"
]);

export function normalizeUrlProtocol(protocol: string) {
  const normalized = protocol.toLowerCase();
  return protocolAliases[normalized] ?? normalized;
}

export function isUrlNodeUri(uri: string) {
  const match = uri.match(/^([a-z][a-z0-9+.-]*):\/\//i);

  return match ? urlNodeProtocols.has(normalizeUrlProtocol(match[1])) : false;
}
