import { booleanParam, compact, numberParam, stringParam } from "./utils";
import { anytlsConfig, snellConfig, wireguardConfig } from "./url-special-config";
import {
  baseUrlConfig,
  decodedPassword,
  decodedUsername,
  grpcOptions,
  realityOptions,
  timingOptions,
  websocketOptions
} from "./url-options";

export function toUrlNodeConfig(protocol: string, url: URL): Record<string, unknown> {
  const params = url.searchParams;
  const base = baseUrlConfig(protocol, url);

  // 不同客户端的 URI 查询字段并不完全统一，这里只做可确定的 Clash/Mihomo 字段映射。
  switch (protocol) {
    case "trojan":
      return securedStreamConfig(base, "password", decodedUsername(url), params);
    case "vless":
      return securedStreamConfig(base, "uuid", decodedUsername(url), params);
    case "hysteria":
      return hysteriaConfig(base, url);
    case "hysteria2":
      return hysteria2Config(base, url);
    case "tuic":
      return tuicConfig(base, url);
    case "wireguard":
      return wireguardConfig(base, url);
    case "anytls":
      return anytlsConfig(base, url);
    case "snell":
      return snellConfig(base, url);
    case "naive":
    case "shadowtls":
      return passwordConfig(base, url);
    case "http":
    case "socks4":
    case "socks5":
    case "ssh":
    case "juicity":
    case "masque":
    case "mieru":
    case "sudoku":
    case "trust-tunnel":
      return userPasswordConfig(base, url);
    default:
      return userPasswordConfig(base, url);
  }
}

function securedStreamConfig(base: Record<string, unknown>, authKey: "password" | "uuid", value: string, params: URLSearchParams) {
  return compact({
    ...base,
    [authKey]: value,
    flow: stringParam(params, "flow"),
    network: stringParam(params, "type", "network"),
    "ws-opts": websocketOptions(params),
    "grpc-opts": grpcOptions(params),
    "reality-opts": realityOptions(params)
  });
}

function hysteriaConfig(base: Record<string, unknown>, url: URL) {
  const params = url.searchParams;
  const auth = decodedUsername(url) || stringParam(params, "auth", "auth-str", "auth_str");

  return compact({
    ...base,
    auth,
    "auth-str": auth,
    protocol: stringParam(params, "protocol"),
    up: stringParam(params, "up", "upmbps", "up_mbps"),
    down: stringParam(params, "down", "downmbps", "down_mbps"),
    obfs: stringParam(params, "obfs"),
    ...timingOptions(params)
  });
}

function hysteria2Config(base: Record<string, unknown>, url: URL) {
  const params = url.searchParams;

  return compact({
    ...base,
    password: decodedUsername(url) || stringParam(params, "password"),
    up: stringParam(params, "up", "upmbps", "up_mbps"),
    down: stringParam(params, "down", "downmbps", "down_mbps"),
    obfs: stringParam(params, "obfs", "obfs-type"),
    "obfs-password": stringParam(params, "obfs-password", "obfsPassword", "obfs_password"),
    ...timingOptions(params)
  });
}

function tuicConfig(base: Record<string, unknown>, url: URL) {
  const params = url.searchParams;

  return compact({
    ...base,
    uuid: decodedUsername(url),
    password: decodedPassword(url),
    "congestion-controller": stringParam(params, "congestion_control", "congestion-controller"),
    "udp-relay-mode": stringParam(params, "udp_relay_mode", "udp-relay-mode"),
    "disable-sni": booleanParam(params, "disable-sni", "disable_sni")
  });
}

function passwordConfig(base: Record<string, unknown>, url: URL) {
  const params = url.searchParams;

  return compact({
    ...base,
    username: decodedUsername(url),
    password: decodedPassword(url) || decodedUsername(url) || stringParam(params, "password", "psk"),
    version: numberParam(params, "version")
  });
}

function userPasswordConfig(base: Record<string, unknown>, url: URL) {
  return compact({
    ...base,
    username: decodedUsername(url),
    password: decodedPassword(url),
    "private-key": stringParam(url.searchParams, "private-key", "private_key")
  });
}
