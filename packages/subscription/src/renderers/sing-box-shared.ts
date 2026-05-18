import { compact, stringValue } from "./utils";

export function baseAuthOutbound(
  type: string,
  tag: string,
  server: string,
  serverPort: number,
  parsed: Record<string, unknown>
) {
  return compact({
    type,
    tag,
    server,
    server_port: serverPort,
    username: stringValue(parsed.username),
    password: stringValue(parsed.password)
  });
}

export function withTls(parsed: Record<string, unknown>, value: Record<string, unknown>, force = false) {
  const enabled = force || parsed.tls === true;
  const reality = objectValue(parsed["reality-opts"]);
  const publicKey = stringValue(reality["public-key"]);
  const shortId = stringValue(reality["short-id"]);
  const fingerprint = stringValue(parsed["client-fingerprint"] ?? parsed.fingerprint);

  return compact({
    ...value,
    transport: v2rayTransport(parsed),
    tls: enabled
      ? compact({
          enabled: true,
          server_name: stringValue(parsed.sni) ?? stringValue(parsed.servername),
          insecure: parsed["skip-cert-verify"] === true,
          alpn: stringList(parsed.alpn),
          utls: fingerprint ? { enabled: true, fingerprint } : undefined,
          reality: publicKey
            ? compact({
                enabled: true,
                public_key: publicKey,
                short_id: shortId
              })
            : undefined
        })
      : undefined
  });
}

function v2rayTransport(parsed: Record<string, unknown>) {
  const network = stringValue(parsed.network);
  const wsOptions = objectValue(parsed["ws-opts"]);
  const grpcOptions = objectValue(parsed["grpc-opts"]);

  switch (network) {
    case "ws":
      return compact({
        type: "ws",
        path: stringValue(wsOptions.path),
        headers: objectValue(wsOptions.headers)
      });
    case "grpc":
      return compact({
        type: "grpc",
        service_name: stringValue(grpcOptions["grpc-service-name"] ?? grpcOptions.serviceName)
      });
    case "httpupgrade":
      return compact({
        type: "httpupgrade",
        path: stringValue(wsOptions.path),
        headers: objectValue(wsOptions.headers)
      });
    default:
      return undefined;
  }
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return undefined;
}
