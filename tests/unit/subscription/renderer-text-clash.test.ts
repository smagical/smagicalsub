import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { normalizeSubscriptionFormat, renderSubscription } from "@smagicalsub/subscription";
import { nodeFromUri, renderableNode, representativeUriSamples, ssUri } from "./fixtures";

describe("subscription renderer: text and Clash", () => {
  it("normalizes common format aliases", () => {
    expect(normalizeSubscriptionFormat("base64")).toBe("base64");
    expect(normalizeSubscriptionFormat("v2rayn")).toBe("base64");
    expect(normalizeSubscriptionFormat("singbox")).toBe("sing-box");
    expect(normalizeSubscriptionFormat("xray-core")).toBe("xray");
    expect(normalizeSubscriptionFormat("raw")).toBe("plain");
    expect(normalizeSubscriptionFormat(undefined)).toBe("clash");
  });

  it("renders plain and Base64 subscriptions from the raw uri", () => {
    const input = { profileName: "Default", nodes: [renderableNode()] };

    expect(renderSubscription({ ...input, format: "plain" })).toBe(ssUri);
    expect(atob(renderSubscription({ ...input, format: "base64" }))).toBe(`${ssUri}\n`);
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

  it("renders representative parsed URI samples to Clash proxy entries", () => {
    const nodes = representativeUriSamples.map((sample) => nodeFromUri(sample.uri));
    const output = renderSubscription({
      format: "clash",
      profileName: "URI Matrix",
      nodes
    });
    const parsed = YAML.parse(output.replace(/^#.*\n/, "")) as { proxies: Array<Record<string, unknown>> };

    expect(parsed.proxies.map((proxy) => proxy.type)).toEqual(expect.arrayContaining([
      "anytls",
      "hysteria",
      "hysteria2",
      "http",
      "naive",
      "shadowtls",
      "snell",
      "socks5",
      "ss",
      "ssr",
      "ssh",
      "trojan",
      "tuic",
      "vless",
      "vmess",
      "wireguard"
    ]));
    expect(parsed.proxies.find((proxy) => proxy.name === "VLESS")).toEqual(expect.objectContaining({
      flow: "xtls-rprx-vision",
      network: "grpc",
      security: "reality"
    }));
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
});
