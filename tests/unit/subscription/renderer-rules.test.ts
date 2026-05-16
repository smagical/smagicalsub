import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { renderableNode } from "./fixtures";

describe("subscription renderer: routing rules", () => {
  it("renders broad profile routing rules for sing-box and Xray", () => {
    const rules = [
      "DOMAIN,full.example.com,DIRECT",
      "DOMAIN-SUFFIX,example.org,Proxy",
      "DOMAIN-KEYWORD,video,Proxy",
      "DOMAIN-REGEX,^api\\.,Proxy",
      "GEOIP,private,DIRECT",
      "SRC-IP-CIDR,192.168.1.0/24,DIRECT",
      "SRC-PORT,1000-2000,Proxy",
      "DST-PORT,443,Proxy",
      "IN-PORT,10808,Proxy",
      "INBOUND-TAG,socks-in,Proxy",
      "PROCESS-NAME,Telegram.exe,Proxy",
      "NETWORK,udp,Proxy",
      "PROTOCOL,bittorrent,REJECT",
      "RULE-SET,geosite-cn,DIRECT",
      "MATCH,Proxy"
    ];
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules,
      nodes: [renderableNode()]
    })) as { route: { rules: Array<Record<string, unknown>> } };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules,
      nodes: [renderableNode()]
    })) as { routing: { rules: Array<Record<string, unknown>> } };

    expect(singBox.route.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: "route", domain: ["full.example.com"], outbound: "direct" }),
      expect.objectContaining({ action: "route", domain_suffix: ["example.org"], outbound: "Proxy" }),
      expect.objectContaining({ action: "route", ip_is_private: true, outbound: "direct" }),
      expect.objectContaining({ action: "route", source_ip_cidr: ["192.168.1.0/24"], outbound: "direct" }),
      expect.objectContaining({ action: "route", source_port_range: ["1000:2000"], outbound: "Proxy" }),
      expect.objectContaining({ action: "reject", protocol: ["bittorrent"] }),
      expect.objectContaining({ action: "route", rule_set: ["geosite-cn"], outbound: "direct" })
    ]));
    expect(xray.routing.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: ["full:full.example.com"], outboundTag: "direct" }),
      expect.objectContaining({ domain: ["domain:example.org"], balancerTag: "Proxy" }),
      expect.objectContaining({ ip: ["geoip:private"], outboundTag: "direct" }),
      expect.objectContaining({ source: ["192.168.1.0/24"], outboundTag: "direct" }),
      expect.objectContaining({ sourcePort: "1000-2000", balancerTag: "Proxy" }),
      expect.objectContaining({ outboundTag: "block", protocol: ["bittorrent"] })
    ]));
  });

  it("routes common and native profile rules to the matching output format", () => {
    const input = {
      profileName: "Default",
      defaultStrategy: "Proxy",
      profileRules: [
        { content: {}, format: "common" as const, rule: "DOMAIN-SUFFIX,common.example,Proxy" },
        { content: {}, format: "clash" as const, rule: "DOMAIN-SUFFIX,clash.example,DIRECT" },
        {
          content: { action: "route", domain_suffix: ["singbox.example"], outbound: "direct" },
          format: "sing-box" as const,
          rule: JSON.stringify({ action: "route", domain_suffix: ["singbox.example"], outbound: "direct" })
        },
        {
          content: { domain: ["domain:xray.example"], outboundTag: "direct", type: "field" },
          format: "xray" as const,
          rule: JSON.stringify({ domain: ["domain:xray.example"], outboundTag: "direct", type: "field" })
        }
      ],
      nodes: [renderableNode()]
    };
    const clash = YAML.parse(renderSubscription({ ...input, format: "clash" }).replace(/^#.*\n/, "")) as { rules: string[] };
    const singBox = JSON.parse(renderSubscription({ ...input, format: "sing-box" })) as { route: { rules: Array<Record<string, unknown>> } };
    const xray = JSON.parse(renderSubscription({ ...input, format: "xray" })) as { routing: { rules: Array<Record<string, unknown>> } };

    expect(clash.rules).toEqual([
      "DOMAIN-SUFFIX,common.example,Proxy",
      "DOMAIN-SUFFIX,clash.example,DIRECT",
      "MATCH,Proxy"
    ]);
    expect(singBox.route.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain_suffix: ["singbox.example"], outbound: "direct" }),
      expect.objectContaining({ domain_suffix: ["common.example"], outbound: "Proxy" })
    ]));
    expect(singBox.route.rules).not.toEqual(expect.arrayContaining([expect.objectContaining({ domain_suffix: ["clash.example"] })]));
    expect(xray.routing.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: ["domain:xray.example"], outboundTag: "direct" }),
      expect.objectContaining({ domain: ["domain:common.example"], balancerTag: "Proxy" })
    ]));
    expect(xray.routing.rules).not.toEqual(expect.arrayContaining([expect.objectContaining({ domain: ["domain:clash.example"] })]));
  });

  it("keeps mixed common and native routing rules in profile order", () => {
    const input = {
      profileName: "Default",
      defaultStrategy: "Proxy",
      profileRules: [
        { content: {}, format: "common" as const, rule: "DOMAIN-SUFFIX,first.example,DIRECT" },
        {
          content: { domain: ["domain:native.example"], outboundTag: "direct", type: "field" },
          format: "xray" as const,
          rule: JSON.stringify({ domain: ["domain:native.example"], outboundTag: "direct", type: "field" })
        },
        { content: {}, format: "common" as const, rule: "DOMAIN-SUFFIX,last.example,Proxy" }
      ],
      nodes: [renderableNode()]
    };
    const xray = JSON.parse(renderSubscription({ ...input, format: "xray" })) as { routing: { rules: Array<Record<string, unknown>> } };

    expect(xray.routing.rules.slice(0, 3)).toEqual([
      expect.objectContaining({ domain: ["domain:first.example"], outboundTag: "direct" }),
      expect.objectContaining({ domain: ["domain:native.example"], outboundTag: "direct" }),
      expect.objectContaining({ balancerTag: "Proxy", domain: ["domain:last.example"] })
    ]);
    expect(xray.routing.rules.at(-1)).toEqual(expect.objectContaining({ balancerTag: "Proxy", network: "tcp,udp" }));
  });

  it("does not append an extra fallback when a common MATCH rule already exists", () => {
    const input = {
      profileName: "Default",
      defaultStrategy: "Proxy",
      profileRules: [
        { content: {}, format: "common" as const, rule: "DOMAIN-SUFFIX,first.example,DIRECT" },
        { content: {}, format: "common" as const, rule: "MATCH,DIRECT" }
      ],
      nodes: [renderableNode()]
    };
    const singBox = JSON.parse(renderSubscription({ ...input, format: "sing-box" })) as { route: { rules: Array<Record<string, unknown>> } };
    const xray = JSON.parse(renderSubscription({ ...input, format: "xray" })) as { routing: { rules: Array<Record<string, unknown>> } };

    expect(singBox.route.rules).toHaveLength(2);
    expect(singBox.route.rules.at(-1)).toEqual(expect.objectContaining({ network: ["tcp", "udp"], outbound: "direct" }));
    expect(xray.routing.rules).toHaveLength(2);
    expect(xray.routing.rules.at(-1)).toEqual(expect.objectContaining({ network: "tcp,udp", outboundTag: "direct" }));
  });

});
