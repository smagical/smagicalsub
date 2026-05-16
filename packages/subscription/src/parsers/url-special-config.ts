import { compact, numberParam, stringParam } from "./utils";
import { decodedPassword, decodedUsername, timingOptions } from "./url-options";

export function wireguardConfig(base: Record<string, unknown>, url: URL) {
  const params = url.searchParams;

  return compact({
    ...base,
    "private-key": decodedUsername(url) || stringParam(params, "private-key", "private_key"),
    "public-key": stringParam(params, "public-key", "public_key", "peer_public_key"),
    "pre-shared-key": stringParam(params, "pre-shared-key", "pre_shared_key", "presharedkey"),
    ip: stringParam(params, "ip", "address", "local_address"),
    ipv6: stringParam(params, "ipv6"),
    network: stringParam(params, "network"),
    mtu: numberParam(params, "mtu"),
    reserved: stringParam(params, "reserved")
  });
}

export function anytlsConfig(base: Record<string, unknown>, url: URL) {
  const params = url.searchParams;

  return compact({
    ...base,
    password: decodedUsername(url) || decodedPassword(url) || stringParam(params, "password"),
    ...timingOptions(params)
  });
}

export function snellConfig(base: Record<string, unknown>, url: URL) {
  const params = url.searchParams;

  return compact({
    ...base,
    psk: decodedUsername(url) || stringParam(params, "psk"),
    version: numberParam(params, "version"),
    "obfs-opts": stringParam(params, "obfs")
      ? {
          mode: stringParam(params, "obfs"),
          host: stringParam(params, "obfs-host", "obfs_host")
        }
      : undefined
  });
}
