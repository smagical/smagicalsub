import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { renderableNode } from "./fixtures";

describe("subscription renderer: inbound modules", () => {
  it("renders semantic inbound modules for Clash, sing-box and Xray", () => {
    const inboundContent = {
      allowLan: true,
      inboundType: "socks",
      listen: "0.0.0.0",
      port: 10808,
      sniff: true,
      tag: "socks-in",
      udp: true
    };
    const clash = YAML.parse(renderSubscription({
      format: "clash",
      profileName: "Default",
      modules: [{ content: inboundContent, format: "clash", type: "inbound" }],
      nodes: [renderableNode()]
    }).replace(/^#.*\n/, "")) as Record<string, unknown>;
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [{ content: inboundContent, format: "sing-box", type: "inbound" }],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>>; route: { rules: Array<Record<string, unknown>> } };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [{ content: inboundContent, format: "xray", type: "inbound" }],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>> };

    expect(clash["allow-lan"]).toBe(true);
    expect(clash["bind-address"]).toBe("0.0.0.0");
    expect(clash["socks-port"]).toBe(10808);
    expect(singBox.inbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ listen: "0.0.0.0", listen_port: 10808, type: "socks" })
    ]));
    expect(singBox.inbounds[0]).not.toHaveProperty("udp");
    expect(singBox.inbounds[0]).not.toHaveProperty("sniff");
    expect(singBox.route.rules).toEqual(expect.arrayContaining([expect.objectContaining({ action: "sniff", inbound: ["socks-in"] })]));
    expect(xray.inbounds).toEqual([expect.objectContaining({ listen: "0.0.0.0", port: 10808, protocol: "socks" })]);
  });

  it("preserves Xray inbound settings and sniffing module objects", () => {
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [
        {
          content: {
            inboundType: "socks",
            listen: "127.0.0.1",
            port: 10808,
            settings: { auth: "noauth", udp: true },
            sniffing: {
              destOverride: ["http", "tls"],
              enabled: true,
              metadataOnly: false
            },
            tag: "socks-in"
          },
          format: "xray",
          type: "inbound"
        }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<{ settings: Record<string, unknown>; sniffing: Record<string, unknown> }> };

    expect(xray.inbounds[0]?.settings).toEqual({ auth: "noauth", udp: true });
    expect(xray.inbounds[0]?.sniffing).toEqual({
      destOverride: ["http", "tls"],
      enabled: true,
      metadataOnly: false
    });
  });

  it("preserves sing-box inbound module object fields", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        {
          content: {
            listen_port: 2081,
            listen: "127.0.0.1",
            sniff: true,
            tag: "mixed-in",
            type: "socks",
            users: [{ password: "pass", username: "user" }]
          },
          format: "sing-box",
          type: "inbound"
        }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>>; route: { rules: Array<Record<string, unknown>> } };

    expect(singBox.inbounds).toEqual([
      expect.objectContaining({
        listen: "127.0.0.1",
        listen_port: 2081,
        tag: "mixed-in",
        type: "socks",
        users: [{ password: "pass", username: "user" }]
      })
    ]);
    expect(singBox.inbounds[0]).not.toHaveProperty("inboundType");
    expect(singBox.inbounds[0]).not.toHaveProperty("port");
    expect(singBox.inbounds[0]).not.toHaveProperty("sniff");
    expect(singBox.inbounds[0]).not.toHaveProperty("udp");
    expect(singBox.route.rules).toEqual(expect.arrayContaining([expect.objectContaining({ action: "sniff", inbound: ["mixed-in"] })]));
  });

  it("strips cross-format inbound fields from sing-box JSON", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        {
          content: {
            allowLan: true,
            inboundType: "mixed",
            listen: "127.0.0.1",
            port: 2080,
            protocol: "socks",
            settings: { udp: true },
            sniff: false,
            sniffing: { enabled: true },
            tag: "mixed-in",
            udp: true
          },
          format: "sing-box",
          type: "inbound"
        }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>>; route: { rules: Array<Record<string, unknown>> } };

    expect(singBox.inbounds[0]).toEqual(expect.objectContaining({
      listen: "127.0.0.1",
      listen_port: 2080,
      tag: "mixed-in",
      type: "mixed"
    }));
    expect(singBox.inbounds[0]).not.toHaveProperty("allowLan");
    expect(singBox.inbounds[0]).not.toHaveProperty("inboundType");
    expect(singBox.inbounds[0]).not.toHaveProperty("port");
    expect(singBox.inbounds[0]).not.toHaveProperty("protocol");
    expect(singBox.inbounds[0]).not.toHaveProperty("settings");
    expect(singBox.inbounds[0]).not.toHaveProperty("sniff");
    expect(singBox.inbounds[0]).not.toHaveProperty("sniffing");
    expect(singBox.inbounds[0]).not.toHaveProperty("udp");
    expect(singBox.route?.rules ?? []).not.toEqual(expect.arrayContaining([expect.objectContaining({ action: "sniff" })]));
  });

  it("sanitizes legacy sing-box inbound fields from advanced overrides", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        {
          content: {
            inbounds: [
              {
            domain_strategy: "prefer_ipv4",
            listen: "127.0.0.1",
            listen_port: 2080,
            sniff_override_destination: true,
            sniff: true,
            sniff_timeout: "300ms",
            tag: "mixed-in",
                type: "mixed",
                udp: true,
                udp_disable_domain_unmapping: true
              }
            ]
          },
          format: "sing-box",
          type: "advanced-override"
        }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>>; route: { rules: Array<Record<string, unknown>> } };

    expect(singBox.inbounds[0]).toEqual(expect.objectContaining({
      listen: "127.0.0.1",
      listen_port: 2080,
      tag: "mixed-in",
      type: "mixed"
    }));
    expect(singBox.inbounds[0]).not.toHaveProperty("domain_strategy");
    expect(singBox.inbounds[0]).not.toHaveProperty("sniff");
    expect(singBox.inbounds[0]).not.toHaveProperty("sniff_timeout");
    expect(singBox.inbounds[0]).not.toHaveProperty("sniff_override_destination");
    expect(singBox.inbounds[0]).not.toHaveProperty("udp");
    expect(singBox.inbounds[0]).not.toHaveProperty("udp_disable_domain_unmapping");
    expect(singBox.route.rules.slice(0, 3)).toEqual([
      expect.objectContaining({ action: "resolve", inbound: ["mixed-in"], strategy: "prefer_ipv4" }),
      expect.objectContaining({ action: "sniff", inbound: ["mixed-in"], timeout: "300ms" }),
      expect.objectContaining({ action: "route-options", inbound: ["mixed-in"], udp_disable_domain_unmapping: true })
    ]);
  });

  it("maps semantic TUN fields to sing-box snake_case fields", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        {
          content: {
            address: "172.19.0.1/30",
            autoRoute: true,
            interfaceName: "smagical0",
            mtu: 9000,
            sniff: true,
            stack: "mixed",
            strictRoute: true,
            tag: "tun-in"
          },
          format: "sing-box",
          type: "tun"
        }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>>; route: { rules: Array<Record<string, unknown>> } };

    expect(singBox.inbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({
        address: "172.19.0.1/30",
        auto_route: true,
        interface_name: "smagical0",
        mtu: 9000,
        stack: "mixed",
        strict_route: true,
        tag: "tun-in",
        type: "tun"
      })
    ]));
    expect(singBox.inbounds[0]).not.toHaveProperty("autoRoute");
    expect(singBox.inbounds[0]).not.toHaveProperty("interfaceName");
    expect(singBox.inbounds[0]).not.toHaveProperty("sniff");
    expect(singBox.inbounds[0]).not.toHaveProperty("strictRoute");
    expect(singBox.route.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: "sniff", inbound: ["tun-in"] })
    ]));
  });

  it("maps semantic TUN fields to Xray tun settings", () => {
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [
        {
          content: {
            address: "172.19.0.1/30",
            autoRoute: true,
            dnsHijack: ["any:53"],
            interfaceName: "smagical0",
            mtu: 9000,
            sniff: true,
            stack: "mixed",
            tag: "tun-in"
          },
          format: "xray",
          type: "tun"
        }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<{ protocol: string; settings: Record<string, unknown>; sniffing: Record<string, unknown> }> };

    expect(xray.inbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({
        protocol: "tun",
        settings: expect.objectContaining({
          autoOutboundsInterface: "auto",
          autoSystemRoutingTable: ["0.0.0.0/0", "::/0"],
          dns: ["any:53"],
          gateway: ["172.19.0.1/30"],
          mtu: 9000,
          name: "smagical0"
        }),
        sniffing: expect.objectContaining({ enabled: true })
      })
    ]));
    expect(xray.inbounds[0]?.settings).not.toHaveProperty("address");
    expect(xray.inbounds[0]?.settings).not.toHaveProperty("stack");
  });
});
