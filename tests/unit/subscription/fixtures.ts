import { parseNodeUri } from "@smagicalsub/subscription";
import type { RenderableNode } from "@smagicalsub/subscription";

export const ssUri = `ss://${btoa("aes-256-gcm:pass@example.com:8388")}#HK`;

export function renderableNode(): RenderableNode {
  return {
    id: "node-1",
    name: "HK",
    protocol: "ss",
    groups: ["hk"],
    config_json: JSON.stringify({
      type: "ss",
      server: "example.com",
      port: 8388,
      cipher: "aes-256-gcm",
      password: "pass",
      __rawUri: ssUri
    })
  };
}

export function nodeFromUri(uri: string): RenderableNode {
  const node = parseNodeUri(uri);

  if (!node) {
    throw new Error(`Unable to parse test URI: ${uri}`);
  }

  return {
    config_json: JSON.stringify(node.config),
    groups: [node.protocol],
    name: node.name,
    protocol: node.protocol
  };
}

export function vmessUri() {
  return `vmess://${btoa(
    JSON.stringify({
      ps: "VMess",
      add: "vmess.example.com",
      port: "443",
      id: "00000000-0000-0000-0000-000000000000",
      aid: "0",
      net: "ws",
      host: "host.example.com",
      path: "/ws",
      tls: "tls"
    })
  )}`;
}

function ssrUri() {
  const main = "ssr.example.com:8388:origin:aes-256-cfb:plain:cGFzcw";
  const query = "remarks=U1NS&obfsparam=b2Jmcw&protoparam=cHJvdG8";
  return `ssr://${btoa(`${main}/?${query}`).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
}

export const representativeUriSamples = [
  {
    protocol: "ss",
    uri: `ss://${btoa("aes-256-gcm:pass@example.com:8388")}#SS`
  },
  {
    protocol: "ssr",
    uri: ssrUri()
  },
  {
    protocol: "vmess",
    uri: vmessUri()
  },
  {
    protocol: "vless",
    uri: "vless://00000000-0000-0000-0000-000000000000@vless.example.com:443?security=reality&sni=edge.example.com&pbk=public-key&sid=abcd&spx=%2F&fp=chrome&type=grpc&serviceName=grpc-service&flow=xtls-rprx-vision#VLESS"
  },
  {
    protocol: "trojan",
    uri: "trojan://secret@trojan.example.com:443?type=ws&host=ws.example.com&path=%2Ftrojan&sni=tls.example.com#Trojan"
  },
  {
    protocol: "hysteria",
    uri: "hysteria://auth-token@hy.example.com:443?protocol=udp&up=50&down=100&obfs=salamander#Hysteria"
  },
  {
    protocol: "hysteria2",
    uri: "hy2://secret@hy2.example.com:443?obfs=salamander&obfs-password=obfs-pass&up=100&down=200#HY2"
  },
  {
    protocol: "tuic",
    uri: "tuic://00000000-0000-0000-0000-000000000000:tuic-pass@tuic.example.com:443?congestion_control=bbr&udp_relay_mode=native#TUIC"
  },
  {
    protocol: "wireguard",
    uri: "wg://private-key@wg.example.com:51820?public-key=peer-key&pre-shared-key=psk&ip=10.0.0.2%2F32&ipv6=fd00::2%2F128&reserved=1,2,3&mtu=1420#WG"
  },
  {
    protocol: "anytls",
    uri: "anytls://any-pass@anytls.example.com:443?sni=anytls.example.com&idle-session-timeout=30#AnyTLS"
  },
  {
    protocol: "naive",
    uri: "naive://user:pass@naive.example.com:443?sni=naive.example.com#Naive"
  },
  {
    protocol: "shadowtls",
    uri: "shadowtls://shadow-pass@shadowtls.example.com:443?version=3&sni=shadowtls.example.com#ShadowTLS"
  },
  {
    protocol: "http",
    uri: "http://user:pass@http.example.com:8080#HTTP"
  },
  {
    protocol: "socks5",
    uri: "socks://user:pass@socks.example.com:1080#SOCKS"
  },
  {
    protocol: "ssh",
    uri: "ssh://user:pass@ssh.example.com:22?private-key=private-key#SSH"
  },
  {
    protocol: "snell",
    uri: "snell://snell-psk@snell.example.com:443?version=3&obfs=http&obfs-host=obfs.example.com#Snell"
  }
];
