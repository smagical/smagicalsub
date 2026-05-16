import { describe, expect, it } from "vitest";
import { buildImportPreview } from "../../../apps/web/src/features/profiles/profileImport";

describe("profile import preview: inbounds and format detection", () => {
  it("preserves Xray inbound settings and sniffing objects when importing", () => {
    const preview = buildImportPreview({
      content: JSON.stringify({
        inbounds: [
          {
            listen: "127.0.0.1",
            port: 10808,
            protocol: "socks",
            settings: { auth: "noauth", udp: true },
            sniffing: {
              destOverride: ["http", "tls"],
              enabled: true,
              metadataOnly: false
            },
            tag: "socks-in"
          }
        ],
        routing: { rules: [] }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "xray",
      name: "xray inbound"
    });

    expect(preview.modules).toEqual([
      expect.objectContaining({
        content: expect.objectContaining({
          settings: { auth: "noauth", udp: true },
          sniffing: {
            destOverride: ["http", "tls"],
            enabled: true,
            metadataOnly: false
          }
        }),
        format: "xray",
        type: "inbound"
      })
    ]);
  });

  it("preserves sing-box inbound objects when importing", () => {
    const preview = buildImportPreview({
      content: JSON.stringify({
        inbounds: [
          {
            listen: "127.0.0.1",
            listen_port: 2080,
            sniff: true,
            tag: "mixed-in",
            type: "mixed",
            users: [{ password: "pass", username: "user" }]
          }
        ],
        route: { rules: [] }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "sing-box",
      name: "sing-box inbound"
    });

    expect(preview.modules).toEqual([
      expect.objectContaining({
        content: expect.objectContaining({
          type: "mixed",
          users: [{ password: "pass", username: "user" }]
        }),
        format: "sing-box",
        type: "inbound"
      })
    ]);
  });

  it("uses the selected import format for ambiguous DNS-only configs", () => {
    const dnsOnly = JSON.stringify({ dns: { servers: ["https://dns.example/dns-query"] } });
    const autoPreview = buildImportPreview({
      content: dnsOnly,
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "auto"
    });
    const singBoxPreview = buildImportPreview({
      content: dnsOnly,
      defaultStrategy: "Proxy",
      description: "",
      format: "sing-box",
      name: "sing-box"
    });
    const xrayPreview = buildImportPreview({
      content: dnsOnly,
      defaultStrategy: "Proxy",
      description: "",
      format: "xray",
      name: "xray"
    });

    expect(autoPreview.modules).toHaveLength(0);
    expect(singBoxPreview.modules.map((module) => `${module.format}:${module.type}`)).toEqual(["sing-box:dns"]);
    expect(xrayPreview.modules.map((module) => `${module.format}:${module.type}`)).toEqual(["xray:dns"]);
  });

  it("detects advanced-only sing-box and Xray configs", () => {
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify({
        experimental: { clash_api: { external_controller: "127.0.0.1:9090" } },
        outbounds: [{ tag: "direct", type: "direct" }]
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "advanced sing-box"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify({
        api: { services: ["StatsService"], tag: "api" },
        outbounds: [{ protocol: "freedom", tag: "direct" }],
        stats: {}
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "auto",
      name: "advanced xray"
    });

    expect(singBoxPreview.sourceLabel).toBe("sing-box JSON");
    expect(singBoxPreview.modules).toEqual([
      expect.objectContaining({ format: "sing-box", type: "advanced-override" })
    ]);
    expect(xrayPreview.sourceLabel).toBe("Xray JSON");
    expect(xrayPreview.modules).toEqual([
      expect.objectContaining({ format: "xray", type: "advanced-override" })
    ]);
  });
});
