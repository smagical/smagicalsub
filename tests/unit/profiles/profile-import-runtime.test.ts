import { describe, expect, it } from "vitest";
import { buildImportPreview } from "../../../apps/web/src/features/profiles/profileImport";

describe("profile import preview: runtime containers", () => {
  it("does not import runtime node containers as advanced overrides", () => {
    const clashPreview = buildImportPreview({
      content: [
        "mode: rule",
        "proxies:",
        "  - name: Imported",
        "    type: ss",
        "    server: imported.example.com",
        "    port: 8388",
        "proxy-groups:",
        "  - name: ImportedGroup",
        "    type: select",
        "    proxies:",
        "      - Imported",
        "rules:",
        "  - MATCH,Proxy"
      ].join("\n"),
      defaultStrategy: "Proxy",
      description: "",
      format: "clash",
      name: "clash runtime"
    });
    const singBoxPreview = buildImportPreview({
      content: JSON.stringify({
        endpoints: [{ tag: "wg-endpoint", type: "wireguard" }],
        experimental: { clash_api: { external_controller: "127.0.0.1:9090" } },
        outbounds: [{ tag: "imported", type: "shadowsocks" }],
        route: { rules: [] }
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "sing-box",
      name: "sing-box runtime"
    });
    const xrayPreview = buildImportPreview({
      content: JSON.stringify({
        outbounds: [{ protocol: "freedom", tag: "imported" }],
        routing: { rules: [] },
        stats: {}
      }),
      defaultStrategy: "Proxy",
      description: "",
      format: "xray",
      name: "xray runtime"
    });

    expect(clashPreview.modules.at(-1)?.content).toEqual({ mode: "rule" });
    expect(singBoxPreview.modules.at(-1)?.content).toEqual({
      experimental: { clash_api: { external_controller: "127.0.0.1:9090" } }
    });
    expect(xrayPreview.modules.at(-1)?.content).toEqual({ stats: {} });
  });
});
