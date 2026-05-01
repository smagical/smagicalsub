import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { normalizeSubscriptionFormat, parseNodeUri, parseSubscription, renderSubscription } from "./index";
import type { RenderableNode } from "./index";

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
    expect(normalizeSubscriptionFormat("raw")).toBe("plain");
    expect(normalizeSubscriptionFormat(undefined)).toBe("clash");
  });

  it("renders plain and v2rayN subscriptions from the raw uri", () => {
    const input = { profileName: "Default", nodes: [renderableNode()] };

    expect(renderSubscription({ ...input, format: "plain" })).toBe(ssUri);
    expect(atob(renderSubscription({ ...input, format: "v2rayn" }))).toBe(`${ssUri}\n`);
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

  it("renders sing-box JSON with selector and outbound", () => {
    const output = renderSubscription({
      format: "sing-box",
      profileName: "Default",
      defaultStrategy: "Proxy",
      nodes: [renderableNode()]
    });
    const parsed = JSON.parse(output) as { outbounds: Array<Record<string, unknown>> };

    expect(parsed.outbounds).toEqual([
      expect.objectContaining({ type: "selector", tag: "Proxy" }),
      expect.objectContaining({ type: "selector", tag: "Group: hk" }),
      expect.objectContaining({ type: "shadowsocks", tag: "HK" }),
      expect.objectContaining({ type: "direct", tag: "direct" })
    ]);
  });
});
