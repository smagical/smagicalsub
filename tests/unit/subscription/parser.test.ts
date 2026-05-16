import { describe, expect, it } from "vitest";
import { parseNodeUri, parseSubscription } from "@smagicalsub/subscription";
import { representativeUriSamples, ssUri, vmessUri } from "./fixtures";

describe("subscription parser", () => {
  it("parses base64 subscriptions and skips invalid lines", () => {
    const nodes = parseSubscription(btoa(`${ssUri}\ninvalid://node\n`));

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      name: "HK",
      protocol: "ss",
      server: "example.com",
      port: 8388
    });
  });

  it("parses mixed plaintext and line-level base64 subscriptions while skipping bad lines", () => {
    const trojanUri = "trojan://secret@trojan.example.com:443?type=ws&host=ws.example.com&path=%2Ftrojan&sni=tls.example.com#Trojan";
    const vlessUri = "vless://00000000-0000-0000-0000-000000000000@vless.example.com:443?security=tls&sni=vless.example.com&type=ws&host=edge.example.com&path=%2Fws#VLESS";
    const nodes = parseSubscription([
      ssUri,
      "bad://node",
      btoa(`${trojanUri}\ninvalid-line`),
      vlessUri
    ].join("\n"));

    expect(nodes.map((node) => node.protocol)).toEqual(["ss", "trojan", "vless"]);
    expect(nodes.map((node) => node.name)).toEqual(["HK", "Trojan", "VLESS"]);
  });

  it("parses Shadowsocks SIP002 userinfo base64 and IPv6 endpoints", () => {
    const userInfoBase64 = btoa("aes-128-gcm:p@ss:word");
    const node = parseNodeUri(`ss://${userInfoBase64}@example.com:8388#SIP002`);
    const ipv6Node = parseNodeUri(`ss://${btoa("aes-256-gcm:pass@[2001:db8::1]:8389")}#IPv6`);

    expect(node).toMatchObject({
      name: "SIP002",
      protocol: "ss",
      server: "example.com",
      port: 8388,
      config: expect.objectContaining({
        cipher: "aes-128-gcm",
        password: "p@ss:word"
      })
    });
    expect(ipv6Node).toMatchObject({
      name: "IPv6",
      server: "2001:db8::1",
      port: 8389
    });
  });

  it("parses vmess json uri into the common node shape", () => {
    const uri = vmessUri();

    expect(parseNodeUri(uri)).toMatchObject({
      name: "VMess",
      protocol: "vmess",
      server: "vmess.example.com",
      port: 443
    });
  });

  it("parses representative URI samples across supported protocol families", () => {
    for (const sample of representativeUriSamples) {
      const node = parseNodeUri(sample.uri);

      expect(node, sample.protocol).not.toBeNull();
      expect(node).toEqual(expect.objectContaining({
        protocol: sample.protocol,
        rawUri: sample.uri
      }));
      expect(node?.config).toEqual(expect.objectContaining({ type: sample.protocol }));
    }

    expect(parseNodeUri(representativeUriSamples.find((sample) => sample.protocol === "vless")?.uri ?? "")?.config).toEqual(expect.objectContaining({
      flow: "xtls-rprx-vision",
      network: "grpc",
      security: "reality"
    }));
    expect(parseNodeUri(representativeUriSamples.find((sample) => sample.protocol === "tuic")?.uri ?? "")?.config).toEqual(expect.objectContaining({
      "congestion-controller": "bbr",
      "udp-relay-mode": "native"
    }));
    expect(parseNodeUri(representativeUriSamples.find((sample) => sample.protocol === "wireguard")?.uri ?? "")?.config).toEqual(expect.objectContaining({
      "public-key": "peer-key",
      reserved: "1,2,3"
    }));
  });
});
