import { describe, expect, it } from "vitest";
import { parseNodeUri, renderSubscription } from "@smagicalsub/subscription";
import { nodeFromUri, renderableNode, representativeUriSamples } from "./fixtures";

describe("subscription renderer: sing-box routes", () => {
  it("keeps sing-box group selectors available for common rules", () => {
    const output = renderSubscription({
      format: "sing-box",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules: ["DOMAIN-SUFFIX,example.com,Group: hk"],
      nodes: [renderableNode()]
    });
    const parsed = JSON.parse(output) as { outbounds: Array<Record<string, unknown>>; route: { rules: Array<Record<string, unknown>> } };

    expect(parsed.outbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: "Proxy", type: "selector" }),
      expect.objectContaining({ tag: "Group: hk", type: "selector" })
    ]));
    expect(parsed.route.rules).toEqual([
      expect.objectContaining({ domain_suffix: ["example.com"], outbound: "Group: hk" }),
      expect.objectContaining({ network: ["tcp", "udp"], outbound: "Proxy" })
    ]);
  });


  it("keeps non-numeric port expressions as ranges instead of rendering NaN", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules: ["DST-PORT,geosite:cn,Proxy"],
      nodes: [renderableNode()]
    })) as { route: { rules: Array<Record<string, unknown>> } };

    expect(singBox.route.rules[0]).toEqual(expect.objectContaining({
      action: "route",
      outbound: "Proxy",
      port_range: ["geosite:cn"]
    }));
    expect(JSON.stringify(singBox)).not.toContain("NaN");
  });
});
