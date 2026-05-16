import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { nodeFromUri, renderableNode, representativeUriSamples } from "./fixtures";

describe("subscription renderer: Xray outbounds", () => {
  it("renders Xray JSON with routing rules and proxy balancer", () => {
    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules: ["GEOSITE,cn,DIRECT", "GEOSITE,category-ads-all,REJECT", "NETWORK,tcp,Proxy", "INBOUND-TAG,socks-in,Proxy", "PROTOCOL,bittorrent,REJECT"],
      nodes: [renderableNode()]
    });
    const parsed = JSON.parse(output) as {
      outbounds: Array<Record<string, unknown>>;
      routing: { balancers: Array<Record<string, unknown>>; rules: Array<Record<string, unknown>> };
    };

    expect(parsed.outbounds).toEqual([
      expect.objectContaining({ protocol: "shadowsocks", tag: "node:0:HK" }),
      expect.objectContaining({ protocol: "freedom", tag: "direct" }),
      expect.objectContaining({ protocol: "blackhole", tag: "block" })
    ]);
    expect(parsed.routing.balancers).toEqual(expect.arrayContaining([
      expect.objectContaining({ selector: ["node:"], tag: "Proxy" }),
      expect.objectContaining({ selector: ["node:0:HK"], tag: "Group: hk" })
    ]));
    expect(parsed.routing.rules).toEqual([
      expect.objectContaining({ domain: ["geosite:cn"], outboundTag: "direct" }),
      expect.objectContaining({ domain: ["geosite:category-ads-all"], outboundTag: "block" }),
      expect.objectContaining({ balancerTag: "Proxy", network: "tcp" }),
      expect.objectContaining({ balancerTag: "Proxy", inboundTag: ["socks-in"] }),
      expect.objectContaining({ outboundTag: "block", protocol: ["bittorrent"] }),
      expect.objectContaining({ balancerTag: "Proxy", network: "tcp,udp" })
    ]);
  });

  it("renders representative parsed URI samples to Xray outbounds and skips unsupported protocols", () => {
    const xrayProtocols = new Set(["http", "hysteria2", "socks5", "ss", "trojan", "vless", "vmess", "wireguard"]);
    const unsupportedProtocols = ["anytls", "naive", "shadowtls", "snell", "ssr", "tuic"];
    const nodes = representativeUriSamples
      .filter((sample) => xrayProtocols.has(sample.protocol) || unsupportedProtocols.includes(sample.protocol))
      .map((sample) => nodeFromUri(sample.uri));
    const output = renderSubscription({
      format: "xray",
      profileName: "URI Matrix",
      nodes
    });
    const parsed = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };

    expect(parsed.outbounds.map((outbound) => outbound.protocol)).toEqual(expect.arrayContaining([
      "blackhole",
      "freedom",
      "http",
      "hysteria",
      "shadowsocks",
      "socks",
      "trojan",
      "vless",
      "vmess",
      "wireguard"
    ]));
    expect(parsed.outbounds.find((outbound) => outbound.protocol === "vless")).toEqual(expect.objectContaining({
      streamSettings: expect.objectContaining({
        network: "grpc",
        realitySettings: expect.objectContaining({ publicKey: "public-key" }),
        security: "reality"
      })
    }));
    expect(parsed.outbounds.find((outbound) => outbound.protocol === "wireguard")).toEqual(expect.objectContaining({
      settings: expect.objectContaining({
        reserved: [1, 2, 3],
        secretKey: "private-key"
      })
    }));
    expect(parsed.outbounds.some((outbound) => String(outbound.tag).includes("TUIC"))).toBe(false);
    expect(parsed.outbounds.some((outbound) => outbound.protocol === "anytls")).toBe(false);
  });
});
