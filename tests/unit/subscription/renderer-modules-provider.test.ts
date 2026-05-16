import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { renderableNode } from "./fixtures";

describe("subscription renderer: TUN and provider modules", () => {
  it("applies common modules before format-specific modules", () => {
    const output = renderSubscription({
      format: "clash",
      profileName: "Default",
      modules: [
        { content: { servers: ["https://common.example/dns-query"], enhancedMode: "fake-ip" }, format: "common", type: "dns" },
        { content: { servers: ["https://clash.example/dns-query"], enhancedMode: "redir-host" }, format: "clash", type: "dns" }
      ],
      nodes: [renderableNode()]
    });
    const parsed = YAML.parse(output.replace(/^#.*\n/, "")) as { dns: Record<string, unknown> };

    expect(parsed.dns.nameserver).toEqual(["https://clash.example/dns-query"]);
    expect(parsed.dns["enhanced-mode"]).toBe("redir-host");
  });

  it("renders TUN and provider modules for supported formats", () => {
    const clash = YAML.parse(renderSubscription({
      format: "clash",
      profileName: "Default",
      modules: [
        { content: { enable: true, stack: "mixed", dnsHijack: ["any:53"] }, format: "clash", type: "tun" },
        { content: { cn: { type: "http", url: "https://example.com/cn.yaml" } }, format: "clash", type: "rule-provider" },
        { content: { remote: { type: "http", url: "https://example.com/proxy.yaml" } }, format: "clash", type: "proxy-provider" }
      ],
      nodes: [renderableNode()]
    }).replace(/^#.*\n/, "")) as Record<string, unknown>;
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        { content: { address: ["172.19.0.1/30"], inet4_route_address: ["0.0.0.0/1"], tag: "tun-in" }, format: "sing-box", type: "tun" },
        { content: { geosite: { tag: "geosite-cn", type: "remote", url: "https://example.com/geosite-cn.srs" }, name: "geosite" }, format: "sing-box", type: "rule-provider" }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>>; route: { rule_set: Array<Record<string, unknown>> } };

    expect(clash.tun).toEqual(expect.objectContaining({ enable: true, stack: "mixed", "dns-hijack": ["any:53"] }));
    expect(clash["rule-providers"]).toEqual(expect.objectContaining({ cn: expect.objectContaining({ type: "http" }) }));
    expect(clash["proxy-providers"]).toEqual(expect.objectContaining({ remote: expect.objectContaining({ type: "http" }) }));
    expect(singBox.inbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ inet4_route_address: ["0.0.0.0/1"], type: "tun", tag: "tun-in" })
    ]));
    expect(singBox.route.rule_set).toEqual([expect.objectContaining({ tag: "geosite-cn" })]);
    expect(singBox.route.rule_set).not.toContain("geosite");
  });

  it("preserves provider health-check and rule-set metadata", () => {
    const clash = YAML.parse(renderSubscription({
      format: "clash",
      profileName: "Default",
      modules: [
        {
          content: {
            airport: {
              "health-check": {
                enable: true,
                "expected-status": 204,
                lazy: true,
                url: "http://www.gstatic.com/generate_204"
              },
              override: {
                "additional-prefix": "airport | ",
                "skip-cert-verify": true,
                udp: true
              },
              type: "http",
              url: "https://example.com/sub.yaml"
            }
          },
          format: "clash",
          type: "proxy-provider"
        }
      ],
      nodes: [renderableNode()]
    }).replace(/^#.*\n/, "")) as { "proxy-providers": Record<string, Record<string, unknown>> };
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        {
          content: {
            rule_set: [
              {
                download_detour: "direct",
                format: "binary",
                tag: "geosite-cn",
                type: "remote",
                url: "https://example.com/geosite-cn.srs"
              }
            ]
          },
          format: "sing-box",
          type: "rule-provider"
        }
      ],
      nodes: [renderableNode()]
    })) as { route: { rule_set: Array<Record<string, unknown>> } };

    expect(clash["proxy-providers"].airport["health-check"]).toEqual(expect.objectContaining({
      enable: true,
      lazy: true
    }));
    expect(clash["proxy-providers"].airport.override).toEqual(expect.objectContaining({
      "skip-cert-verify": true,
      udp: true
    }));
    expect(singBox.route.rule_set).toEqual([
      expect.objectContaining({ download_detour: "direct", format: "binary", tag: "geosite-cn" })
    ]);
  });
});
