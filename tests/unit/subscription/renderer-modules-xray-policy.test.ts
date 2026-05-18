import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { renderableNode } from "./fixtures";

describe("subscription renderer: Xray and policy modules", () => {
  it("renders Xray observatory modules", () => {
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [
        {
          content: {
            observatory: { probeURL: "https://www.google.com/generate_204", subjectSelector: ["node:"] },
            policy: { levels: { "0": { statsUserUplink: true } } }
          },
          format: "xray",
          type: "observatory"
        }
      ],
      nodes: [renderableNode()]
    })) as { observatory: Record<string, unknown>; policy: Record<string, unknown> };

    expect(xray.observatory).toEqual(expect.objectContaining({ subjectSelector: ["node:"] }));
    expect(xray.policy).toEqual(expect.objectContaining({ levels: expect.any(Object) }));
  });

  it("renders Xray routing modules from rule-provider content", () => {
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      rules: ["DOMAIN-SUFFIX,common.example,Proxy"],
      modules: [
        {
          content: {
            rules: [
              {
                domain: ["geosite:private"],
                outboundTag: "direct",
                type: "field"
              }
            ]
          },
          format: "xray",
          type: "rule-provider"
        }
      ],
      nodes: [renderableNode()]
    })) as { routing: { rules: Array<Record<string, unknown>> } };

    expect(xray.routing.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: ["domain:common.example"], balancerTag: "Proxy" }),
      expect.objectContaining({ domain: ["geosite:private"], outboundTag: "direct" })
    ]));
  });

  it("renders policy-group modules for Clash, sing-box and Xray", () => {
    const clash = YAML.parse(renderSubscription({
      format: "clash",
      profileName: "Default",
      modules: [{
        content: {
          "proxy-groups": [
            { name: "Auto", proxies: ["HK"], type: "url-test", url: "http://www.gstatic.com/generate_204" }
          ]
        },
        format: "clash",
        type: "policy-group"
      }],
      nodes: [renderableNode()]
    }).replace(/^#.*\n/, "")) as { "proxy-groups": Array<Record<string, unknown>> };
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [{
        content: { outbounds: [{ outbounds: ["HK", "direct"], tag: "Manual", type: "selector" }] },
        format: "sing-box",
        type: "policy-group"
      }],
      nodes: [renderableNode()]
    })) as { outbounds: Array<Record<string, unknown>> };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [{
        content: { routing: { balancers: [{ selector: ["node:"], tag: "Manual" }] } },
        format: "xray",
        type: "policy-group"
      }],
      nodes: [renderableNode()]
    })) as { routing: { balancers: Array<Record<string, unknown>> } };

    expect(clash["proxy-groups"]).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Auto", proxies: ["HK"], type: "url-test" })
    ]));
    expect(singBox.outbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ outbounds: ["HK", "direct"], tag: "Manual", type: "selector" })
    ]));
    expect(xray.routing.balancers).toEqual(expect.arrayContaining([
      expect.objectContaining({ selector: ["node:"], tag: "Manual" })
    ]));
  });
});
