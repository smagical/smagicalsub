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

  return compact({
    ...value,
    tls: enabled
      ? compact({
          enabled: true,
          server_name: stringValue(parsed.sni) ?? stringValue(parsed.servername),
          insecure: parsed["skip-cert-verify"] === true
        })
      : undefined
  });
}
