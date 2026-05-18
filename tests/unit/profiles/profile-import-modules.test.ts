import { describe, expect, it } from "vitest";
import { buildImportPreview } from "../../../apps/web/src/features/profiles/profileImport";

describe("profile import preview: config modules", () => {
  it("preserves routing-level settings as modules when importing Xray and sing-box configs", () => {
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify({
        route: {
          auto_detect_interface: true,
          default_domain_resolver: "local",
          final: "Proxy",
          rules: [],
          rule_set: [{ tag: "geosite-cn", type: "remote", url: "https://example.com/geosite-cn.srs" }]
        }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "sing-box",
      name: "sing-box route settings"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify({
        routing: {
          balancers: [{ selector: ["node:"], tag: "Proxy" }],
          domainMatcher: "mph",
          domainStrategy: "IPIfNonMatch",
          rules: []
        }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "xray",
      name: "xray route settings"
    });

    expect(singBoxPreview.modules).toEqual(expect.arrayContaining([
      expect.objectContaining({ format: "sing-box", type: "rule-provider" }),
      expect.objectContaining({
        content: { route: { auto_detect_interface: true, default_domain_resolver: "local", final: "Proxy" } },
        format: "sing-box",
        type: "rule-provider"
      })
    ]));
    expect(xrayPreview.modules).toEqual([
      expect.objectContaining({
        content: { routing: { domainMatcher: "mph", domainStrategy: "IPIfNonMatch" } },
        format: "xray",
        type: "rule-provider"
      }),
      expect.objectContaining({
        content: { routing: { balancers: [{ selector: ["node:"], tag: "Proxy" }] } },
        format: "xray",
        type: "policy-group"
      })
    ]);
  });

  it("extracts config modules from Clash, sing-box and Xray configs", () => {
    const clashPreview = buildImportPreview({
      content: [
        "allow-lan: true",
        "dns:",
        "  enable: true",
        "  enhanced-mode: fake-ip",
        "  nameserver:",
        "    - https://dns.example/dns-query",
        "  default-nameserver:",
        "    - 223.5.5.5",
        "  nameserver-policy:",
        "    geosite:cn: 223.5.5.5",
        "tun:",
        "  enable: true",
        "  stack: mixed",
        "rule-providers:",
        "  cn:",
        "    type: http",
        "    url: https://example.com/cn.yaml",
        "proxy-groups:",
        "  - name: ImportedGroup",
        "    type: select",
        "    proxies:",
        "      - DIRECT",
        "rules:",
        "  - RULE-SET,cn,DIRECT"
      ].join("\n"),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "clash modules"
    });
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify({
        dns: { servers: [{ address: "https://dns.example/dns-query", detour: "direct", tag: "remote" }] },
        experimental: { clash_api: { external_controller: "127.0.0.1:9090" } },
        inbounds: [{ type: "tun", tag: "tun-in", address: ["172.19.0.1/30"] }],
        ntp: { enabled: true, server: "time.apple.com" },
        outbounds: [{ outbounds: ["direct"], tag: "ImportedSelector", type: "selector" }],
        route: { rule_set: [{ tag: "geosite-cn", type: "remote", url: "https://example.com/geosite-cn.srs" }], rules: [] }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "sing-box modules"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify({
        api: { services: ["HandlerService"], tag: "api" },
        dns: { queryStrategy: "UseIP", servers: [{ address: "https://dns.example/dns-query", domains: ["geosite:private"] }] },
        observatory: { subjectSelector: ["node:"], probeURL: "https://www.google.com/generate_204" },
        policy: { levels: { "0": { statsUserUplink: true } } },
        stats: {},
        routing: { balancers: [{ selector: ["node:"], tag: "ImportedBalancer" }], rules: [] }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "xray modules"
    });

    expect(clashPreview.modules.map((module) => `${module.format}:${module.type}`)).toEqual([
      "clash:dns",
      "clash:tun",
      "clash:rule-provider",
      "clash:policy-group",
      "clash:advanced-override"
    ]);
    expect(singBoxPreview.modules.map((module) => `${module.format}:${module.type}`)).toEqual([
      "sing-box:dns",
      "sing-box:tun",
      "sing-box:rule-provider",
      "sing-box:policy-group",
      "sing-box:advanced-override"
    ]);
    expect(xrayPreview.modules.map((module) => `${module.format}:${module.type}`)).toEqual([
      "xray:dns",
      "xray:observatory",
      "xray:policy-group",
      "xray:advanced-override"
    ]);
    expect(singBoxPreview.modules[0]?.content.servers).toEqual([
      expect.objectContaining({ address: "https://dns.example/dns-query", detour: "direct", tag: "remote" })
    ]);
    expect(clashPreview.modules[0]?.content).toEqual(expect.objectContaining({
      "default-nameserver": ["223.5.5.5"],
      "nameserver-policy": { "geosite:cn": "223.5.5.5" }
    }));
    expect(xrayPreview.modules[0]?.content).toEqual(expect.objectContaining({
      queryStrategy: "UseIP",
      servers: [expect.objectContaining({ address: "https://dns.example/dns-query", domains: ["geosite:private"] })]
    }));
    expect(clashPreview.modules.find((module) => module.type === "policy-group")?.content).toEqual({
      "proxy-groups": [
        expect.objectContaining({ name: "ImportedGroup", type: "select" })
      ]
    });
    expect(singBoxPreview.modules.find((module) => module.type === "policy-group")?.content).toEqual({
      outbounds: [
        expect.objectContaining({ tag: "ImportedSelector", type: "selector" })
      ]
    });
    expect(xrayPreview.modules.find((module) => module.type === "policy-group")?.content).toEqual({
      routing: {
        balancers: [
          expect.objectContaining({ selector: ["node:"], tag: "ImportedBalancer" })
        ]
      }
    });
    expect(clashPreview.modules.at(-1)?.content).toEqual({ "allow-lan": true });
    expect(singBoxPreview.modules.at(-1)?.content).toEqual({
      experimental: { clash_api: { external_controller: "127.0.0.1:9090" } },
      ntp: { enabled: true, server: "time.apple.com" }
    });
    expect(xrayPreview.modules.at(-1)?.content).toEqual({
      api: { services: ["HandlerService"], tag: "api" },
      stats: {}
    });
  });

  it("preserves Mihomo DNS extension fields when importing Clash configs", () => {
    const preview = buildImportPreview({
      content: [
        "dns:",
        "  enable: true",
        "  proxy-server-nameserver:",
        "    - https://doh.pub/dns-query",
        "  direct-nameserver:",
        "    - system",
        "  direct-nameserver-follow-policy: false",
        "  fallback-filter:",
        "    geoip: true",
        "    geoip-code: CN",
        "    geosite:",
        "      - gfw",
        "  nameserver-policy:",
        "    geosite:cn: https://dns.alidns.com/dns-query",
        "rules:",
        "  - MATCH,Proxy"
      ].join("\n"),
      defaultStrategy: "Proxy",
      description: "",
      format: "clash",
      name: "mihomo dns"
    });

    expect(preview.modules[0]).toEqual(expect.objectContaining({
      format: "clash",
      type: "dns",
      content: expect.objectContaining({
        "direct-nameserver": ["system"],
        "direct-nameserver-follow-policy": false,
        "fallback-filter": expect.objectContaining({ geoip: true, "geoip-code": "CN" }),
        "proxy-server-nameserver": ["https://doh.pub/dns-query"]
      })
    }));
  });
});
