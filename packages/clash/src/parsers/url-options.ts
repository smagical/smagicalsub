import { booleanParam, compact, numberParam, stringParam } from "./utils";

const defaultTlsProtocols = new Set(["anytls", "hysteria", "hysteria2", "naive", "shadowtls", "trojan", "tuic"]);

export function baseUrlConfig(protocol: string, url: URL) {
  return {
    type: protocol,
    server: url.hostname,
    port: urlPort(url),
    udp: booleanParam(url.searchParams, "udp"),
    ...tlsOptions(url, protocol)
  };
}

export function urlPort(url: URL) {
  const parsed = url.port ? Number(url.port) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function decodedUsername(url: URL) {
  return decodeURIComponent(url.username);
}

export function decodedPassword(url: URL) {
  return decodeURIComponent(url.password);
}

export function tlsOptions(url: URL, protocol: string) {
  const params = url.searchParams;
  const security = stringParam(params, "security");
  const tls =
    url.protocol === "https:" ||
    defaultTlsProtocols.has(protocol) ||
    security === "tls" ||
    security === "reality";

  return compact({
    tls,
    servername: stringParam(params, "sni", "peer", "host", "servername"),
    sni: stringParam(params, "sni", "peer", "host", "servername"),
    alpn: stringParam(params, "alpn"),
    fingerprint: stringParam(params, "fp", "fingerprint"),
    "client-fingerprint": stringParam(params, "fp", "fingerprint", "client-fingerprint"),
    "skip-cert-verify": booleanParam(params, "allowInsecure", "insecure", "skip-cert-verify")
  });
}

export function websocketOptions(params: URLSearchParams) {
  const path = stringParam(params, "path");
  const host = stringParam(params, "host");

  return path || host
    ? {
        path,
        headers: host ? { Host: host } : undefined
      }
    : undefined;
}

export function grpcOptions(params: URLSearchParams) {
  const serviceName = stringParam(params, "serviceName", "service_name");
  return serviceName ? { "grpc-service-name": serviceName } : undefined;
}

export function realityOptions(params: URLSearchParams) {
  const publicKey = stringParam(params, "pbk", "public-key", "public_key");
  const shortId = stringParam(params, "sid", "short-id", "short_id");

  return publicKey || shortId
    ? {
        "public-key": publicKey,
        "short-id": shortId
      }
    : undefined;
}

export function timingOptions(params: URLSearchParams) {
  return compact({
    "idle-session-check-interval": numberParam(params, "idle-session-check-interval", "idle_session_check_interval"),
    "idle-session-timeout": numberParam(params, "idle-session-timeout", "idle_session_timeout"),
    "min-idle-session": numberParam(params, "min-idle-session", "min_idle_session"),
    "hop-interval": stringParam(params, "hop-interval", "hop_interval")
  });
}
