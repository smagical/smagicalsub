import { describe, expect, it } from "vitest";
import { parseNodeUri, renderSubscription } from "@smagicalsub/subscription";

describe("subscription renderer: Xray transports", () => {
  it("renders Xray stream settings for REALITY and HTTPUpgrade", () => {
    const realityNode = parseNodeUri(
      "vless://00000000-0000-0000-0000-000000000000@vless.example.com:443?security=reality&sni=edge.example.com&pbk=public-key&sid=abcd&fp=chrome&type=grpc&serviceName=grpc-service&flow=xtls-rprx-vision#Reality"
    );
    const httpUpgradeNode = parseNodeUri(
      "vless://11111111-1111-1111-1111-111111111111@vless-upgrade.example.com:443?security=tls&sni=vless-upgrade.example.com&type=httpupgrade&path=%2Fupgrade&host=cdn.example.com#HttpUpgrade"
    );

    expect(realityNode).not.toBeNull();
    expect(httpUpgradeNode).not.toBeNull();

    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      nodes: [realityNode, httpUpgradeNode].filter((node): node is NonNullable<typeof node> => node !== null).map((node) => ({
        name: node.name,
        protocol: node.protocol,
        config_json: JSON.stringify(node.config)
      }))
    });
    const xray = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };
    const realityOutbound = xray.outbounds.find((outbound) => outbound.tag === "node:0:Reality") as { streamSettings: Record<string, unknown> };
    const httpUpgradeOutbound = xray.outbounds.find((outbound) => outbound.tag === "node:1:HttpUpgrade") as { streamSettings: Record<string, unknown> };

    expect(realityOutbound.streamSettings).toEqual(expect.objectContaining({
      grpcSettings: expect.objectContaining({ serviceName: "grpc-service" }),
      realitySettings: expect.objectContaining({ fingerprint: "chrome", publicKey: "public-key", shortId: "abcd", spiderX: "/" }),
      security: "reality"
    }));
    expect(httpUpgradeOutbound.streamSettings).toEqual(expect.objectContaining({
      httpupgradeSettings: expect.objectContaining({
        headers: { Host: "cdn.example.com" },
        path: "/upgrade"
      }),
      network: "httpupgrade",
      tlsSettings: expect.objectContaining({ serverName: "vless-upgrade.example.com" })
    }));
  });

  it("keeps explicit Xray security mode when URI has no provider-specific options", () => {
    const parsedNode = parseNodeUri(
      "vless://00000000-0000-0000-0000-000000000000@reality.example.com:443?security=reality&sni=edge.example.com#RealityNoKey"
    );

    expect(parsedNode).not.toBeNull();
    expect(parsedNode?.config).toEqual(expect.objectContaining({ security: "reality" }));

    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      nodes: [{
        name: parsedNode?.name ?? "RealityNoKey",
        protocol: parsedNode?.protocol,
        config_json: JSON.stringify(parsedNode?.config)
      }]
    });
    const xray = JSON.parse(output) as { outbounds: Array<{ streamSettings: Record<string, unknown>; tag: string }> };
    const outbound = xray.outbounds.find((item) => item.tag === "node:0:RealityNoKey");

    expect(outbound?.streamSettings).toEqual(expect.objectContaining({
      realitySettings: expect.objectContaining({ serverName: "edge.example.com" }),
      security: "reality"
    }));
  });

  it("renders Xray TLS stream settings for HTTPS proxies", () => {
    const parsedNode = parseNodeUri("https://user:pass@https-proxy.example.com:443?sni=proxy.example.com#HTTPS");

    expect(parsedNode).not.toBeNull();

    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      nodes: [{
        name: parsedNode?.name ?? "HTTPS",
        protocol: parsedNode?.protocol,
        config_json: JSON.stringify(parsedNode?.config)
      }]
    });
    const xray = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };
    const outbound = xray.outbounds.find((item) => item.tag === "node:0:HTTPS") as { streamSettings: Record<string, unknown> };

    expect(outbound.streamSettings).toEqual(expect.objectContaining({
      security: "tls",
      tlsSettings: expect.objectContaining({ serverName: "proxy.example.com" })
    }));
  });

  it("renders Xray Hysteria2 and WireGuard outbounds when supported by Xray-core", () => {
    const hysteriaNode = parseNodeUri("hy2://secret@hy2.example.com:443?up=100&down=200#HY2");
    const wireguardNode = parseNodeUri("wg://private-key@wg.example.com:51820?public-key=peer-key&pre-shared-key=psk&ip=10.0.0.2%2F32&ipv6=fd00::2%2F128&reserved=1,2,3&mtu=1420#WG");

    expect(hysteriaNode).not.toBeNull();
    expect(wireguardNode).not.toBeNull();

    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      nodes: [hysteriaNode, wireguardNode].filter((node): node is NonNullable<typeof node> => node !== null).map((node) => ({
        name: node.name,
        protocol: node.protocol,
        config_json: JSON.stringify(node.config)
      }))
    });
    const xray = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };
    const hysteriaOutbound = xray.outbounds.find((outbound) => outbound.protocol === "hysteria") as { settings: Record<string, unknown>; streamSettings: Record<string, unknown> };
    const wireguardOutbound = xray.outbounds.find((outbound) => outbound.protocol === "wireguard") as Record<string, unknown>;

    expect(hysteriaOutbound.settings).toEqual(expect.objectContaining({
      address: "hy2.example.com",
      port: 443,
      version: 2
    }));
    expect(hysteriaOutbound.streamSettings).toEqual(expect.objectContaining({
      hysteriaSettings: expect.objectContaining({ auth: "secret", version: 2 }),
      network: "hysteria",
      security: "tls"
    }));
    expect(wireguardOutbound.settings).toEqual(expect.objectContaining({
      address: ["10.0.0.2/32", "fd00::2/128"],
      mtu: 1420,
      reserved: [1, 2, 3],
      secretKey: "private-key"
    }));
    expect((wireguardOutbound.settings as { peers: Array<Record<string, unknown>> }).peers[0]).toEqual(expect.objectContaining({
      endpoint: "wg.example.com:51820",
      preSharedKey: "psk",
      publicKey: "peer-key"
    }));
  });

  it("skips incomplete Xray WireGuard outbounds", () => {
    const incompleteWireGuardNode = parseNodeUri("wg://private-key@wg.example.com:51820?ip=10.0.0.2%2F32#WG");

    expect(incompleteWireGuardNode).not.toBeNull();

    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      nodes: [{
        name: incompleteWireGuardNode?.name ?? "WG",
        protocol: incompleteWireGuardNode?.protocol,
        config_json: JSON.stringify(incompleteWireGuardNode?.config)
      }]
    });
    const xray = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };

    expect(xray.outbounds.find((outbound) => outbound.protocol === "wireguard")).toBeUndefined();
  });
});
