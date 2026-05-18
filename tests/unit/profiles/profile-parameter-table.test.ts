import { describe, expect, it } from "vitest";
import { buildConfigParameterRows, updateJsonContent } from "../../../apps/web/src/features/profiles/profileParameterUtils";

describe("profile parameter table", () => {
  it("updates nested object values by path and returns json text", () => {
    const next = updateJsonContent(
      JSON.stringify({
        dns: {
          enable: true,
          servers: ["https://dns.example/dns-query"],
          strategy: "ipv4_only"
        }
      }),
      ["dns", "strategy"],
      "prefer_ipv4"
    );

    expect(next).toContain('"strategy": "prefer_ipv4"');
    expect(next).toContain('"enable": true');
  });

  it("updates array values by path and preserves nested structure", () => {
    const next = updateJsonContent(
      {
        dns: {
          servers: [{ address: "https://dns.example/dns-query", detour: "direct" }]
        }
      },
      ["dns", "servers", 0, "detour"],
      "proxy"
    );

    expect(next).toContain('"detour": "proxy"');
  });

  it("builds editable rows with path segments", () => {
    const rows = buildConfigParameterRows(
      {
        route: {
          final: "Proxy",
          rules: [{ outbound: "direct" }]
        }
      },
      "sing-box",
      "dns"
    );

    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "route.final",
        pathSegments: ["route", "final"],
        value: "Proxy"
      }),
      expect.objectContaining({
        path: "route.rules[0].outbound",
        pathSegments: ["route", "rules", 0, "outbound"],
        value: "direct"
      })
    ]));
  });
});
