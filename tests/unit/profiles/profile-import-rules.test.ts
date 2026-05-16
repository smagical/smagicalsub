import { describe, expect, it } from "vitest";
import { buildImportPreview } from "../../../apps/web/src/features/profiles/profileImport";

describe("profile import preview: rules", () => {
  it("extracts Clash/Mihomo rules and deduplicates them", () => {
    const preview = buildImportPreview({
      content: [
        "rules:",
        "  - DOMAIN-SUFFIX,example.com,Proxy",
        "  - DOMAIN-SUFFIX,example.com,Proxy",
        "  - GEOIP,CN,DIRECT"
      ].join("\n"),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "导入测试"
    });

    expect(preview.sourceLabel).toBe("Clash/Mihomo YAML");
    expect(preview.rules.map((rule) => rule.rule)).toEqual(["DOMAIN-SUFFIX,example.com,Proxy", "GEOIP,CN,DIRECT"]);
    expect(preview.duplicateRules).toHaveLength(1);
  });

  it("converts simple sing-box and Xray structured rules into profile rules", () => {
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify({
        route: {
          final: "Proxy",
          rules: [
            {
              domain_suffix: ["example.com"],
              outbound: "DIRECT",
              action: "route"
            }
          ]
        }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "sing-box"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify({
        routing: {
          rules: [
            {
              domain: ["geosite:cn"],
              outboundTag: "DIRECT",
              type: "field"
            }
          ]
        }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "xray"
    });

    expect(singBoxPreview.rules.map((rule) => rule.rule)).toEqual([
      "DOMAIN-SUFFIX,example.com,DIRECT"
    ]);
    expect(singBoxPreview.modules).toEqual([
      expect.objectContaining({
        content: { route: { final: "Proxy" } },
        format: "sing-box",
        type: "rule-provider"
      })
    ]);
    expect(xrayPreview.rules).toEqual([
      expect.objectContaining({ content: {}, format: "common", rule: "GEOSITE,cn,DIRECT" })
    ]);
  });

  it("keeps complex sing-box and Xray rules native instead of widening their meaning", () => {
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify({
        route: {
          rules: [
            {
              domain_suffix: ["example.com"],
              invert: true,
              outbound: "Proxy",
              port: [443]
            },
            { mode: "or", rules: [{ domain_suffix: ["logical.example"], outbound: "Proxy" }], type: "logical" },
            {
              domain_suffix: ["private.example"],
              ip_is_private: true,
              outbound: "direct"
            }
          ]
        }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "sing-box unsupported"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify({
        routing: {
          rules: [
            {
              attrs: "attrs[':method'] == 'GET'",
              domain: ["geosite:cn"],
              ip: ["geoip:private"],
              outboundTag: "direct",
              port: "443",
              type: "field"
            },
            {
              balancerTag: "Proxy",
              domain: ["domain:example.com"],
              type: "field"
            },
            {
              domain: ["full:custom.example"],
              outboundTag: "my-proxy",
              type: "field"
            }
          ]
        }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "xray unsupported"
    });

    expect(singBoxPreview.rules).toEqual([
      expect.objectContaining({ format: "sing-box", content: expect.objectContaining({ invert: true }) }),
      expect.objectContaining({ format: "sing-box", content: expect.objectContaining({ type: "logical" }) }),
      expect.objectContaining({ format: "sing-box", content: expect.objectContaining({ ip_is_private: true }) })
    ]);
    expect(singBoxPreview.issues.some((issue) => issue.message.includes("已保留为 sing-box 原生规则"))).toBe(true);
    expect(xrayPreview.rules).toEqual([
      expect.objectContaining({ format: "xray", content: expect.objectContaining({ attrs: "attrs[':method'] == 'GET'" }) }),
      expect.objectContaining({ format: "xray", content: expect.objectContaining({ balancerTag: "Proxy" }) }),
      expect.objectContaining({ format: "xray", content: expect.objectContaining({ outboundTag: "my-proxy" }) })
    ]);
    expect(xrayPreview.issues.some((issue) => issue.message.includes("已保留为 Xray 原生规则"))).toBe(true);
  });

  it("normalizes direct and block policies when importing simple native rules", () => {
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify({ route: { rules: [{ action: "reject", domain_suffix: ["ads.example"] }] } }),
      defaultStrategy: "Proxy",
      description: "",
      format: "sing-box",
      name: "sing-box reject"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify({ routing: { rules: [{ domain: ["full:direct.example"], outboundTag: "direct", type: "field" }] } }),
      defaultStrategy: "Proxy",
      description: "",
      format: "xray",
      name: "xray direct"
    });

    expect(singBoxPreview.rules).toEqual([
      expect.objectContaining({ format: "common", rule: "DOMAIN-SUFFIX,ads.example,REJECT" })
    ]);
    expect(xrayPreview.rules).toEqual([
      expect.objectContaining({ format: "common", rule: "DOMAIN,direct.example,DIRECT" })
    ]);
  });

  it("keeps sing-box rules with custom outbound targets native", () => {
    const preview = buildImportPreview({
      content: JSON.stringify({
        route: {
          rules: [
            {
              action: "route",
              domain_suffix: ["custom.example"],
              outbound: "manual-selector"
            }
          ]
        }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "sing-box",
      name: "sing-box custom outbound"
    });

    expect(preview.rules).toEqual([
      expect.objectContaining({
        content: expect.objectContaining({ outbound: "manual-selector" }),
        format: "sing-box"
      })
    ]);
    expect(preview.issues.some((issue) => issue.message.includes("自定义 outbound=manual-selector"))).toBe(true);
  });
});
