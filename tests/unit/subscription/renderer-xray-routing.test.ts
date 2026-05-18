import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { renderableNode } from "./fixtures";

describe("subscription renderer: Xray routing", () => {
  it("routes Xray common rules to group balancers", () => {
    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules: ["DOMAIN-SUFFIX,example.com,Group: hk"],
      nodes: [renderableNode()]
    });
    const parsed = JSON.parse(output) as {
      routing: { balancers: Array<Record<string, unknown>>; rules: Array<Record<string, unknown>> };
    };

    expect(parsed.routing.balancers).toEqual(expect.arrayContaining([
      expect.objectContaining({ selector: ["node:"], tag: "Proxy" }),
      expect.objectContaining({ selector: ["node:0:HK"], tag: "Group: hk" })
    ]));
    expect(parsed.routing.rules).toEqual([
      expect.objectContaining({ domain: ["domain:example.com"], balancerTag: "Group: hk" }),
      expect.objectContaining({ balancerTag: "Proxy", network: "tcp,udp" })
    ]);
  });

  it("uses collision-resistant Xray node tags for adjacent group names", () => {
    const secondNode = {
      ...renderableNode(),
      id: "node-2",
      name: "HK2",
      groups: ["hk2"],
      config_json: JSON.stringify({
        type: "ss",
        server: "example-2.com",
        port: 8388,
        cipher: "aes-256-gcm",
        password: "pass-2"
      })
    };
    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      defaultStrategy: "Proxy",
      nodes: [renderableNode(), secondNode]
    });
    const parsed = JSON.parse(output) as { routing: { balancers: Array<Record<string, unknown>> } };

    expect(parsed.routing.balancers).toEqual(expect.arrayContaining([
      expect.objectContaining({ selector: ["node:0:HK"], tag: "Group: hk" }),
      expect.objectContaining({ selector: ["node:1:HK2"], tag: "Group: hk2" })
    ]));
  });

  it("does not route Xray rules to missing group balancers", () => {
    const unsupportedNode = {
      id: "node-tuic",
      name: "TUIC",
      protocol: "tuic",
      groups: ["tuic"],
      config_json: JSON.stringify({
        type: "tuic",
        server: "tuic.example.com",
        port: 443,
        uuid: "00000000-0000-0000-0000-000000000000"
      })
    };
    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      defaultStrategy: "Proxy",
      nodes: [renderableNode(), unsupportedNode],
      rules: ["DOMAIN-SUFFIX,tuic.example,Group: tuic"]
    });
    const parsed = JSON.parse(output) as { routing: { balancers: Array<Record<string, unknown>>; rules: Array<Record<string, unknown>> } };

    expect(parsed.routing.balancers).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: "Group: tuic" })
    ]));
    expect(parsed.routing.rules[0]).toEqual(expect.objectContaining({
      balancerTag: "Proxy",
      domain: ["domain:tuic.example"]
    }));
  });

  it("maps Xray rules that target a node name to the generated node tag", () => {
    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      defaultStrategy: "Proxy",
      nodes: [renderableNode()],
      rules: ["DOMAIN-SUFFIX,node.example,HK"]
    });
    const parsed = JSON.parse(output) as { routing: { rules: Array<Record<string, unknown>> } };

    expect(parsed.routing.rules[0]).toEqual(expect.objectContaining({
      domain: ["domain:node.example"],
      outboundTag: "node:0:HK"
    }));
  });

  it("falls back to direct when Xray has no nodes", () => {
    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      defaultStrategy: "Proxy",
      nodes: [],
      rules: ["MATCH,Proxy"]
    });
    const parsed = JSON.parse(output) as {
      outbounds: Array<Record<string, unknown>>;
      routing: { balancers: Array<Record<string, unknown>>; rules: Array<Record<string, unknown>> };
    };

    expect(parsed.outbounds).toEqual([
      expect.objectContaining({ protocol: "freedom", tag: "direct" }),
      expect.objectContaining({ protocol: "blackhole", tag: "block" })
    ]);
    expect(parsed.routing.balancers).toEqual([
      expect.objectContaining({ selector: ["direct"], tag: "Proxy" })
    ]);
    expect(parsed.routing.rules).toEqual([
      expect.objectContaining({ balancerTag: "Proxy", network: "tcp,udp" })
    ]);
  });
});
