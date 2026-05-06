import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { normalizeSubscriptionFormat, parseNodeUri, parseSubscription, renderSubscription } from "@smagicalsub/subscription";
import type { RenderableNode } from "@smagicalsub/subscription";

const ssUri = `ss://${btoa("aes-256-gcm:pass@example.com:8388")}#HK`;

function renderableNode(): RenderableNode {
  return {
    id: "node-1",
    name: "HK",
    protocol: "ss",
    groups: ["hk"],
    config_json: JSON.stringify({
      type: "ss",
      server: "example.com",
      port: 8388,
      cipher: "aes-256-gcm",
      password: "pass",
      __rawUri: ssUri
    })
  };
}

describe("subscription parser", () => {
  it("parses base64 subscriptions and skips invalid lines", () => {
    const nodes = parseSubscription(btoa(`${ssUri}\ninvalid://node\n`));

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      name: "HK",
      protocol: "ss",
      server: "example.com",
      port: 8388
    });
  });

  it("parses vmess json uri into the common node shape", () => {
    const uri = `vmess://${btoa(
      JSON.stringify({
        ps: "VMess",
        add: "vmess.example.com",
        port: "443",
        id: "00000000-0000-0000-0000-000000000000",
        aid: "0",
        net: "ws",
        host: "host.example.com",
        path: "/ws",
        tls: "tls"
      })
    )}`;

    expect(parseNodeUri(uri)).toMatchObject({
      name: "VMess",
      protocol: "vmess",
      server: "vmess.example.com",
      port: 443
    });
  });
});

describe("subscription renderer", () => {
  it("normalizes common format aliases", () => {
    expect(normalizeSubscriptionFormat("base64")).toBe("v2rayn");
    expect(normalizeSubscriptionFormat("singbox")).toBe("sing-box");
    expect(normalizeSubscriptionFormat("xray-core")).toBe("xray");
    expect(normalizeSubscriptionFormat("raw")).toBe("plain");
    expect(normalizeSubscriptionFormat(undefined)).toBe("clash");
  });

  it("renders plain and v2rayN subscriptions from the raw uri", () => {
    const input = { profileName: "Default", nodes: [renderableNode()] };

    expect(renderSubscription({ ...input, format: "plain" })).toBe(ssUri);
    expect(atob(renderSubscription({ ...input, format: "v2rayn" }))).toBe(`${ssUri}\n`);
  });

  it("deduplicates nodes with the same endpoint and credentials", () => {
    const duplicated = {
      ...renderableNode(),
      id: "node-2",
      name: "HK Duplicate",
      groups: ["backup"],
      config_json: JSON.stringify({
        type: "ss",
        server: "example.com",
        port: 8388,
        cipher: "aes-256-gcm",
        password: "pass",
        __rawUri: `${ssUri}-duplicate-name`
      })
    };
    const output = renderSubscription({
      format: "clash",
      profileName: "Default",
      nodes: [renderableNode(), duplicated]
    });
    const parsed = YAML.parse(output.replace(/^#.*\n/, "")) as { proxies: Array<{ name: string }>; "proxy-groups": Array<{ name: string; proxies: string[] }> };

    expect(parsed.proxies).toHaveLength(1);
    expect(parsed.proxies[0].name).toBe("HK");
    expect(parsed["proxy-groups"]).toEqual([
      expect.objectContaining({ name: "Proxy", proxies: ["Group: backup", "Group: hk"] }),
      expect.objectContaining({ name: "Group: backup", proxies: ["HK"] }),
      expect.objectContaining({ name: "Group: hk", proxies: ["HK"] })
    ]);
  });

  it("deduplicates raw subscriptions before rendering text formats", () => {
    const duplicated = {
      ...renderableNode(),
      id: "node-2",
      name: "HK Duplicate"
    };
    const output = renderSubscription({
      format: "plain",
      profileName: "Default",
      nodes: [renderableNode(), duplicated]
    });

    expect(output.split("\n")).toEqual([ssUri]);
  });

  it("renders Clash YAML with grouped proxies and fallback rule", () => {
    const output = renderSubscription({
      format: "clash",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules: ["DOMAIN-SUFFIX,example.com,Proxy"],
      nodes: [renderableNode()]
    });
    const parsed = YAML.parse(output.replace(/^#.*\n/, "")) as Record<string, unknown>;

    expect(parsed.proxies).toEqual([expect.objectContaining({ name: "HK", type: "ss" })]);
    expect(parsed["proxy-groups"]).toEqual([
      expect.objectContaining({ name: "Proxy", proxies: ["Group: hk"] }),
      expect.objectContaining({ name: "Group: hk", proxies: ["HK"] })
    ]);
    expect(parsed.rules).toEqual(["DOMAIN-SUFFIX,example.com,Proxy", "MATCH,Proxy"]);
  });

  it("renders ungrouped nodes under the default group", () => {
    const output = renderSubscription({
      format: "clash",
      profileName: "Default",
      defaultStrategy: "Proxy",
      nodes: [{ ...renderableNode(), groups: [] }]
    });
    const parsed = YAML.parse(output.replace(/^#.*\n/, "")) as { "proxy-groups": Array<{ name: string; proxies: string[] }> };

    expect(parsed["proxy-groups"]).toEqual([
      expect.objectContaining({ name: "Proxy", proxies: ["Group: 默认"] }),
      expect.objectContaining({ name: "Group: 默认", proxies: ["HK"] })
    ]);
  });

  it("renders sing-box JSON with selector and outbound", () => {
    const output = renderSubscription({
      format: "sing-box",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules: ["GEOSITE,cn,DIRECT", "GEOSITE,category-ads-all,REJECT"],
      nodes: [renderableNode()]
    });
    const parsed = JSON.parse(output) as { outbounds: Array<Record<string, unknown>>; route: { rules: Array<Record<string, unknown>> } };

    expect(parsed.outbounds).toEqual([
      expect.objectContaining({ type: "selector", tag: "Proxy" }),
      expect.objectContaining({ type: "selector", tag: "Group: hk" }),
      expect.objectContaining({ type: "shadowsocks", tag: "HK" }),
      expect.objectContaining({ type: "direct", tag: "direct" }),
      expect.objectContaining({ type: "block", tag: "block" })
    ]);
    expect(parsed.route.rules).toEqual([
      expect.objectContaining({ geosite: ["cn"], outbound: "direct" }),
      expect.objectContaining({ geosite: ["category-ads-all"], outbound: "block" }),
      expect.objectContaining({ network: ["tcp", "udp"], outbound: "Proxy" })
    ]);
  });

  it("renders Xray JSON with routing rules and proxy balancer", () => {
    const output = renderSubscription({
      format: "xray",
      profileName: "Default",
      defaultStrategy: "Proxy",
      rules: ["GEOSITE,cn,DIRECT", "GEOSITE,category-ads-all,REJECT"],
      nodes: [renderableNode()]
    });
    const parsed = JSON.parse(output) as {
      outbounds: Array<Record<string, unknown>>;
      routing: { balancers: Array<Record<string, unknown>>; rules: Array<Record<string, unknown>> };
    };

    expect(parsed.outbounds).toEqual([
      expect.objectContaining({ protocol: "shadowsocks", tag: "node:HK" }),
      expect.objectContaining({ protocol: "freedom", tag: "direct" }),
      expect.objectContaining({ protocol: "blackhole", tag: "block" })
    ]);
    expect(parsed.routing.balancers).toEqual([expect.objectContaining({ selector: ["node:"], tag: "Proxy" })]);
    expect(parsed.routing.rules).toEqual([
      expect.objectContaining({ domain: ["geosite:cn"], outboundTag: "direct" }),
      expect.objectContaining({ domain: ["geosite:category-ads-all"], outboundTag: "block" }),
      expect.objectContaining({ balancerTag: "Proxy", network: "tcp,udp" })
    ]);
  });
});
