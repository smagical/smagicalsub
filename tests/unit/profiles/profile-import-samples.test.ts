import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { renderSubscription } from "@smagicalsub/subscription";
import { buildImportPreview } from "../../../apps/web/src/features/profiles/profileImport";
import { clashClientSample, sampleNode, singBoxClientSample, xrayClientSample } from "./profile-import-fixtures";

describe("profile import preview: representative samples", () => {
  it("imports representative Clash, sing-box and Xray client samples without dropping core modules", () => {
    const clashPreview = buildImportPreview({
      content: clashClientSample(),
      defaultStrategy: "Proxy",
      description: "",
      format: "clash",
      name: "mihomo sample"
    });
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify(singBoxClientSample()),
      defaultStrategy: "Proxy",
      description: "",
      format: "sing-box",
      name: "sing-box sample"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify(xrayClientSample()),
      defaultStrategy: "Proxy",
      description: "",
      format: "xray",
      name: "xray sample"
    });

    expect(clashPreview.modules.map((module) => `${module.format}:${module.type}`)).toEqual([
      "clash:dns",
      "clash:tun",
      "clash:rule-provider",
      "clash:proxy-provider",
      "clash:policy-group",
      "clash:advanced-override"
    ]);
    expect(singBoxPreview.modules.map((module) => `${module.format}:${module.type}`)).toEqual([
      "sing-box:dns",
      "sing-box:inbound",
      "sing-box:tun",
      "sing-box:rule-provider",
      "sing-box:policy-group",
      "sing-box:rule-provider",
      "sing-box:advanced-override"
    ]);
    expect(xrayPreview.modules.map((module) => `${module.format}:${module.type}`)).toEqual([
      "xray:dns",
      "xray:inbound",
      "xray:observatory",
      "xray:rule-provider",
      "xray:policy-group",
      "xray:advanced-override"
    ]);
    expect(clashPreview.rules.map((rule) => rule.rule)).toEqual([
      "DOMAIN-SUFFIX,example.com,DIRECT",
      "RULE-SET,geosite-cn,Proxy",
      "MATCH,Proxy"
    ]);
    expect(singBoxPreview.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: "GEOSITE,cn,DIRECT" }),
      expect.objectContaining({ format: "sing-box", content: expect.objectContaining({ type: "logical" }) })
    ]));
    expect(xrayPreview.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: "GEOSITE,cn,DIRECT" }),
      expect.objectContaining({ format: "xray", content: expect.objectContaining({ balancerTag: "Proxy" }) })
    ]));
  });

  it("renders imported representative samples back to their target config structures", () => {
    const clashPreview = buildImportPreview({
      content: clashClientSample(),
      defaultStrategy: "Proxy",
      description: "",
      format: "clash",
      name: "mihomo sample"
    });
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify(singBoxClientSample()),
      defaultStrategy: "Proxy",
      description: "",
      format: "sing-box",
      name: "sing-box sample"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify(xrayClientSample()),
      defaultStrategy: "Proxy",
      description: "",
      format: "xray",
      name: "xray sample"
    });
    const clash = YAML.parse(renderSubscription({
      format: "clash",
      profileName: clashPreview.name,
      defaultStrategy: clashPreview.defaultStrategy,
      profileRules: clashPreview.rules,
      modules: clashPreview.modules,
      nodes: [sampleNode()]
    }).replace(/^#.*\n/, "")) as Record<string, unknown>;
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: singBoxPreview.name,
      defaultStrategy: singBoxPreview.defaultStrategy,
      profileRules: singBoxPreview.rules,
      modules: singBoxPreview.modules,
      nodes: [sampleNode()]
    })) as { dns: Record<string, unknown>; inbounds: Array<Record<string, unknown>>; outbounds: Array<Record<string, unknown>>; route: Record<string, unknown> };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: xrayPreview.name,
      defaultStrategy: xrayPreview.defaultStrategy,
      profileRules: xrayPreview.rules,
      modules: xrayPreview.modules,
      nodes: [sampleNode()]
    })) as { dns: Record<string, unknown>; inbounds: Array<Record<string, unknown>>; observatory: Record<string, unknown>; routing: { balancers: Array<Record<string, unknown>>; rules: Array<Record<string, unknown>> } };

    expect(clash.dns).toEqual(expect.objectContaining({
      "enhanced-mode": "fake-ip",
      "proxy-server-nameserver": ["https://doh.pub/dns-query"],
      "fallback-filter": expect.objectContaining({
        geoip: true,
        "geoip-code": "CN",
        geosite: ["gfw"]
      }),
      "nameserver-policy": { "geosite:cn": "https://dns.alidns.com/dns-query" }
    }));
    expect(clash["proxy-groups"]).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Proxy", type: "select" }),
      expect.objectContaining({ lazy: true, name: "Auto", type: "url-test", use: ["airport"] })
    ]));
    expect(clash["proxy-providers"]).toEqual(expect.objectContaining({
      airport: expect.objectContaining({
        "health-check": expect.objectContaining({ lazy: true }),
        override: expect.objectContaining({ udp: true })
      })
    }));
    expect(singBox.dns).toEqual(expect.objectContaining({
      final: "remote",
      independent_cache: true,
      reverse_mapping: true
    }));
    expect(singBox.dns.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain_suffix: [".lan"], server: "local" })
    ]));
    expect(singBox.dns.servers).toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: "fakeip", type: "fakeip" }),
      expect.objectContaining({ tag: "remote", type: "https" })
    ]));
    expect(singBox.inbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: "tun-in", type: "tun" }),
      expect.objectContaining({ listen_port: 2080, tag: "mixed-in", type: "mixed" })
    ]));
    expect(singBox.outbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: "Proxy", type: "selector" })
    ]));
    expect(singBox.route.rule_set).toEqual(expect.arrayContaining([
      expect.objectContaining({ download_detour: "direct", tag: "geosite-cn", type: "remote" })
    ]));
    expect(singBox.route.default_domain_resolver).toEqual({
      server: "remote",
      strategy: "prefer_ipv4"
    });
    expect(xray.dns.servers).toEqual(expect.arrayContaining([
      expect.objectContaining({ address: "https://dns.example/dns-query" })
    ]));
    expect(xray.inbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ protocol: "socks", tag: "socks-in" })
    ]));
    expect(xray.observatory).toEqual(expect.objectContaining({ subjectSelector: ["node:"] }));
    expect(xray.routing.balancers).toEqual(expect.arrayContaining([
      expect.objectContaining({ selector: ["node:"], tag: "Proxy" })
    ]));
    expect(xray.routing.domainMatcher).toBe("mph");
    expect(xray.routing.domainStrategy).toBe("IPIfNonMatch");
    expect(xray.routing.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: ["geosite:cn"], outboundTag: "direct" }),
      expect.objectContaining({ balancerTag: "Proxy", ruleTag: "example-proxy" })
    ]));
  });
});
