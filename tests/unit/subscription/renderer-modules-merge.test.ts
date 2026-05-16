import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { renderableNode } from "./fixtures";

describe("subscription renderer: module merging", () => {
  it("appends array values from multiple modules instead of replacing them", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        { content: { rule_set: [{ tag: "geosite-cn", type: "remote", url: "https://example.com/cn.srs" }] }, format: "sing-box", type: "rule-provider" },
        { content: { route: { final: "direct", rule_set: [{ tag: "geoip-private", type: "remote", url: "https://example.com/private.srs" }] } }, format: "sing-box", type: "rule-provider" }
      ],
      nodes: [renderableNode()]
    })) as { route: { final: string; rule_set: Array<Record<string, unknown>> } };

    expect(singBox.route.rule_set).toEqual([
      expect.objectContaining({ tag: "geosite-cn" }),
      expect.objectContaining({ tag: "geoip-private" })
    ]);
    expect(singBox.route.final).toBe("direct");
  });

  it("preserves sing-box route settings objects from modules", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        {
          content: {
            route: {
              auto_detect_interface: true,
              default_domain_resolver: {
                server: "remote",
                strategy: "prefer_ipv4"
              },
              final: "direct"
            }
          },
          format: "sing-box",
          type: "rule-provider"
        }
      ],
      nodes: [renderableNode()]
    })) as { route: Record<string, unknown> };

    expect(singBox.route.default_domain_resolver).toEqual({
      server: "remote",
      strategy: "prefer_ipv4"
    });
    expect(singBox.route.auto_detect_interface).toBe(true);
    expect(singBox.route.final).toBe("direct");
  });

  it("preserves Xray routing settings objects from modules", () => {
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [
        {
          content: {
            routing: {
              domainMatcher: "mph",
              domainStrategy: "IPIfNonMatch",
              rules: [
                {
                  domain: ["geosite:private"],
                  outboundTag: "direct",
                  ruleTag: "private",
                  type: "field"
                }
              ]
            }
          },
          format: "xray",
          type: "rule-provider"
        }
      ],
      nodes: [renderableNode()]
    })) as { routing: Record<string, unknown> & { rules: Array<Record<string, unknown>> } };

    expect(xray.routing.domainMatcher).toBe("mph");
    expect(xray.routing.domainStrategy).toBe("IPIfNonMatch");
    expect(xray.routing.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: ["geosite:private"], ruleTag: "private" })
    ]));
  });

  it("merges tag-addressable route and routing arrays by tag", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        { content: { rule_set: [{ tag: "geosite-cn", type: "remote", url: "https://example.com/old.srs" }] }, format: "sing-box", type: "rule-provider" },
        { content: { rule_set: [{ tag: "geosite-cn", type: "remote", url: "https://example.com/new.srs" }] }, format: "sing-box", type: "rule-provider" }
      ],
      nodes: [renderableNode()]
    })) as { route: { rule_set: Array<Record<string, unknown>> } };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [
        { content: { routing: { balancers: [{ selector: ["custom:"], tag: "Proxy" }] } }, format: "xray", type: "rule-provider" }
      ],
      nodes: [renderableNode()]
    })) as { routing: { balancers: Array<Record<string, unknown>> } };

    expect(singBox.route.rule_set).toEqual([
      expect.objectContaining({ tag: "geosite-cn", url: "https://example.com/new.srs" })
    ]);
    expect(xray.routing.balancers.filter((balancer) => balancer.tag === "Proxy")).toEqual([
      expect.objectContaining({ selector: ["custom:"], tag: "Proxy" })
    ]);
  });
});
