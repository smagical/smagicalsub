import { describe, expect, it } from "vitest";
import { parseNodeUri, renderSubscription } from "@smagicalsub/subscription";
import { nodeFromUri, renderableNode, representativeUriSamples } from "./fixtures";

describe("subscription renderer: sing-box outbounds", () => {
  it("renders sing-box JSON with selector and outbound", () => {
    const output = renderSubscription({
      format: "sing-box",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules: [
        "GEOSITE,cn,DIRECT",
        "GEOSITE,category-ads-all,REJECT",
        "NETWORK,tcp,Proxy",
        "PROCESS-PATH,C:/Apps/Telegram/Telegram.exe,Proxy",
        "RULE-SET,geosite-cn,Proxy",
        "PROTOCOL,bittorrent,REJECT"
      ],
      nodes: [renderableNode()]
    });
    const parsed = JSON.parse(output) as { outbounds: Array<Record<string, unknown>>; route: { rules: Array<Record<string, unknown>> } };

    expect(parsed.outbounds).toEqual([
      expect.objectContaining({ type: "selector", tag: "Proxy" }),
      expect.objectContaining({ type: "selector", tag: "Group: hk" }),
      expect.objectContaining({ type: "shadowsocks", tag: "HK" }),
      expect.objectContaining({ type: "direct", tag: "direct" })
    ]);
    expect(parsed.route.rules).toEqual([
      expect.objectContaining({ action: "route", geosite: ["cn"], outbound: "direct" }),
      expect.objectContaining({ action: "reject", geosite: ["category-ads-all"] }),
      expect.objectContaining({ action: "route", network: ["tcp"], outbound: "Proxy" }),
      expect.objectContaining({ action: "route", process_path: ["C:/Apps/Telegram/Telegram.exe"], outbound: "Proxy" }),
      expect.objectContaining({ action: "route", rule_set: ["geosite-cn"], outbound: "Proxy" }),
      expect.objectContaining({ action: "reject", protocol: ["bittorrent"] }),
      expect.objectContaining({ action: "route", network: ["tcp", "udp"], outbound: "Proxy" })
    ]);
  });

  it("renders representative parsed URI samples to sing-box outbounds when the protocol is supported", () => {
    const supportedProtocols = new Set(["anytls", "hysteria", "hysteria2", "http", "naive", "shadowtls", "socks5", "ss", "ssh", "trojan", "tuic", "vless", "vmess", "wireguard"]);
    const nodes = representativeUriSamples
      .filter((sample) => supportedProtocols.has(sample.protocol))
      .map((sample) => nodeFromUri(sample.uri));
    const output = renderSubscription({
      format: "sing-box",
      profileName: "URI Matrix",
      nodes
    });
    const parsed = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };

    expect(parsed.outbounds.map((outbound) => outbound.type)).toEqual(expect.arrayContaining([
      "anytls",
      "hysteria",
      "hysteria2",
      "http",
      "naive",
      "selector",
      "shadowtls",
      "shadowsocks",
      "socks",
      "ssh",
      "trojan",
      "tuic",
      "vless",
      "vmess",
      "wireguard"
    ]));
    expect(parsed.outbounds.find((outbound) => outbound.type === "vless")).toEqual(expect.objectContaining({
      flow: "xtls-rprx-vision",
      tls: expect.objectContaining({ reality: expect.objectContaining({ public_key: "public-key" }) }),
      transport: expect.objectContaining({ type: "grpc" })
    }));
    expect(parsed.outbounds.find((outbound) => outbound.type === "wireguard")).toEqual(expect.objectContaining({
      local_address: ["10.0.0.2/32", "fd00::2/128"],
      reserved: [1, 2, 3]
    }));
  });

  it("renders sing-box V2Ray transport and REALITY TLS options", () => {
    const parsedNode = parseNodeUri(
      "vless://00000000-0000-0000-0000-000000000000@vless.example.com:443?security=reality&sni=edge.example.com&pbk=public-key&sid=abcd&spx=%2F&fp=chrome&type=grpc&serviceName=grpc-service&flow=xtls-rprx-vision#Reality"
    );

    expect(parsedNode).not.toBeNull();

    const output = renderSubscription({
      format: "sing-box",
      profileName: "Default",
      nodes: [{
        name: parsedNode?.name ?? "Reality",
        protocol: parsedNode?.protocol,
        config_json: JSON.stringify(parsedNode?.config)
      }]
    });
    const singBox = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };
    const outbound = singBox.outbounds.find((item) => item.type === "vless") as {
      flow: string;
      tls: { reality: Record<string, unknown>; server_name: string; utls: Record<string, unknown> };
      transport: Record<string, unknown>;
    };

    expect(outbound.transport).toEqual(expect.objectContaining({ service_name: "grpc-service", type: "grpc" }));
    expect(outbound.tls.server_name).toBe("edge.example.com");
    expect(outbound.tls.utls).toEqual(expect.objectContaining({ fingerprint: "chrome" }));
    expect(outbound.tls.reality).toEqual(expect.objectContaining({ public_key: "public-key", short_id: "abcd" }));
    expect(outbound.flow).toBe("xtls-rprx-vision");
  });

  it("renders sing-box Hysteria2 speed and obfs options", () => {
    const parsedNode = parseNodeUri("hy2://secret@hy2.example.com:443?obfs=salamander&obfs-password=obfs-pass&up=100&down=200#HY2");

    expect(parsedNode).not.toBeNull();

    const output = renderSubscription({
      format: "sing-box",
      profileName: "Default",
      nodes: [{
        name: parsedNode?.name ?? "HY2",
        protocol: parsedNode?.protocol,
        config_json: JSON.stringify(parsedNode?.config)
      }]
    });
    const singBox = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };
    const outbound = singBox.outbounds.find((item) => item.type === "hysteria2") as Record<string, unknown>;

    expect(outbound).toEqual(expect.objectContaining({
      down_mbps: 200,
      password: "secret",
      up_mbps: 100
    }));
    expect(outbound.obfs).toEqual(expect.objectContaining({ password: "obfs-pass", type: "salamander" }));
  });

  it("renders sing-box WireGuard address and reserved arrays", () => {
    const parsedNode = parseNodeUri("wg://private-key@wg.example.com:51820?public-key=peer-key&pre-shared-key=psk&ip=10.0.0.2%2F32&ipv6=fd00::2%2F128&reserved=1,2,3&mtu=1420#WG");

    expect(parsedNode).not.toBeNull();

    const output = renderSubscription({
      format: "sing-box",
      profileName: "Default",
      nodes: [{
        name: parsedNode?.name ?? "WG",
        protocol: parsedNode?.protocol,
        config_json: JSON.stringify(parsedNode?.config)
      }]
    });
    const singBox = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };
    const outbound = singBox.outbounds.find((item) => item.type === "wireguard") as Record<string, unknown>;

    expect(outbound).toEqual(expect.objectContaining({
      local_address: ["10.0.0.2/32", "fd00::2/128"],
      mtu: 1420,
      peer_public_key: "peer-key",
      reserved: [1, 2, 3]
    }));
  });
});
