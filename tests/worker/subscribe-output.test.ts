import YAML from "yaml";
import { beforeAll, describe, expect, it } from "vitest";
import { ensureSubscriptionSchema, fetchSubscription, seedBareSubscriptionFixture, seedSubscriptionFixture } from "./subscribe-fixtures";

beforeAll(async () => {
  await ensureSubscriptionSchema();
});

describe("subscription output endpoint", () => {
  it("uses the built-in routing template when a token has no profile", async () => {
    const fixture = await seedBareSubscriptionFixture();
    const clash = YAML.parse(await (await fetchSubscription(fixture.path, "clash")).text()) as {
      "proxy-groups": Array<{ name: string; proxies: string[] }>;
      "rule-providers": Record<string, Record<string, unknown>>;
      rules: string[];
    };
    const singBox = await (await fetchSubscription(fixture.path, "sing-box")).json() as {
      route: { rule_set: Array<Record<string, unknown>>; rules: Array<Record<string, unknown>> };
    };
    const xray = await (await fetchSubscription(fixture.path, "xray")).json() as {
      routing: { rules: Array<Record<string, unknown>> };
    };
    const plain = await (await fetchSubscription(fixture.path, "plain")).text();

    expect(clash["rule-providers"]).toEqual(expect.objectContaining({
      cn: expect.objectContaining({ behavior: "classical", type: "http" }),
      gfw: expect.objectContaining({ behavior: "classical", type: "http" })
    }));
    expect(clash["proxy-groups"]).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "全部节点", proxies: ["Bare"] })
    ]));
    expect(clash.rules).toEqual(expect.arrayContaining([
      "GEOIP,private,DIRECT",
      "RULE-SET,cn,DIRECT",
      "RULE-SET,gfw,Proxy",
      "MATCH,Proxy"
    ]));
    expect(singBox.route.rule_set).toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: "geosite-category-ads-all", type: "remote" }),
      expect.objectContaining({ tag: "geosite-cn", type: "remote" }),
      expect.objectContaining({ tag: "geoip-cn", type: "remote" })
    ]));
    expect(singBox.route.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: "reject", rule_set: ["geosite-category-ads-all"] }),
      expect.objectContaining({ action: "route", rule_set: ["geosite-cn"], outbound: "direct" }),
      expect.objectContaining({ action: "route", rule_set: ["geosite-gfw"], outbound: "Proxy" })
    ]));
    expect(xray.routing.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: ["geosite:category-ads-all"], outboundTag: "block" }),
      expect.objectContaining({ domain: ["geosite:cn"], outboundTag: "direct" }),
      expect.objectContaining({ domain: ["geosite:gfw"], balancerTag: "Proxy" })
    ]));
    expect(plain).toBe(fixture.ssUri);
  });

  it("renders Clash, base64, plain, sing-box and Xray outputs from one token", async () => {
    const fixture = await seedSubscriptionFixture();
    const clashResponse = await fetchSubscription(fixture.path, "clash");
    const base64Response = await fetchSubscription(fixture.path, "base64");
    const plainResponse = await fetchSubscription(fixture.path, "plain");
    const singBoxResponse = await fetchSubscription(fixture.path, "sing-box");
    const xrayResponse = await fetchSubscription(fixture.path, "xray");

    expect(clashResponse.headers.get("Content-Type")).toContain("text/yaml");
    expect(base64Response.headers.get("Content-Type")).toContain("text/plain");
    expect(plainResponse.headers.get("Content-Type")).toContain("text/plain");
    expect(singBoxResponse.headers.get("Content-Type")).toContain("application/json");
    expect(xrayResponse.headers.get("Content-Type")).toContain("application/json");

    const clash = YAML.parse(await clashResponse.text()) as {
      dns: Record<string, unknown>;
      proxies: Array<Record<string, unknown>>;
      "proxy-groups": Array<{ name: string; proxies: string[] }>;
      rules: string[];
    };
    const base64Text = await base64Response.text();
    const plainText = await plainResponse.text();
    const singBox = await singBoxResponse.json() as {
      dns: { servers: Array<Record<string, unknown>> };
      outbounds: Array<Record<string, unknown>>;
      route: { rules: Array<Record<string, unknown>> };
    };
    const xray = await xrayResponse.json() as {
      dns: { queryStrategy: string; servers: string[] };
      outbounds: Array<Record<string, unknown>>;
      routing: { rules: Array<Record<string, unknown>> };
    };

    expect(clash.dns).toEqual(expect.objectContaining({
      "enhanced-mode": "fake-ip",
      nameserver: ["https://dns.example/dns-query"]
    }));
    expect(clash.proxies.map((proxy) => proxy.name)).toEqual(["HK", "VLESS"]);
    expect(clash["proxy-groups"]).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "全部节点", proxies: ["HK", "VLESS"] })
    ]));
    expect(clash.rules).toEqual(expect.arrayContaining(["DOMAIN-SUFFIX,example.com,DIRECT", "MATCH,Proxy"]));

    expect(atob(base64Text)).toContain(`${fixture.ssUri}\n`);
    expect(atob(base64Text)).toContain(`${fixture.vlessUri}\n`);
    expect(plainText).toContain(fixture.ssUri);
    expect(plainText).toContain(fixture.vlessUri);

    expect(singBox.dns.servers).toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: "dns-1", type: "fakeip" }),
      expect.objectContaining({ tag: "dns-2", type: "https" })
    ]));
    expect(singBox.outbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: "HK", type: "shadowsocks" }),
      expect.objectContaining({ tag: "VLESS", type: "vless" })
    ]));
    expect(singBox.route.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: "route", domain_suffix: ["example.com"], outbound: "direct" })
    ]));

    expect(xray.dns).toEqual(expect.objectContaining({
      queryStrategy: "UseIPv4",
      servers: ["https://dns.example/dns-query"]
    }));
    expect(xray.outbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ protocol: "shadowsocks", tag: "node:0:HK" }),
      expect.objectContaining({ protocol: "vless", tag: "node:1:VLESS" })
    ]));
    expect(xray.routing.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: ["domain:example.com"], outboundTag: "direct" })
    ]));
  });

  it("applies token-bound modules only to their matching output format", async () => {
    const fixture = await seedSubscriptionFixture();
    const clash = YAML.parse(await (await fetchSubscription(fixture.path, "clash")).text()) as Record<string, unknown>;
    const singBox = await (await fetchSubscription(fixture.path, "sing-box")).json() as Record<string, unknown>;
    const xray = await (await fetchSubscription(fixture.path, "xray")).json() as Record<string, unknown>;

    expect(clash.dns).toEqual(expect.objectContaining({
      "enhanced-mode": "fake-ip",
      nameserver: ["https://dns.example/dns-query"]
    }));
    expect(singBox.dns).toEqual(expect.objectContaining({
      servers: expect.arrayContaining([
        expect.objectContaining({ tag: "dns-1", type: "fakeip" }),
        expect.objectContaining({ server: "dns.example", type: "https" })
      ])
    }));
    expect(xray.dns).toEqual({
      queryStrategy: "UseIPv4",
      servers: ["https://dns.example/dns-query"]
    });
    expect(JSON.stringify(singBox)).not.toContain("enhanced-mode");
    expect(JSON.stringify(xray)).not.toContain("fakeip");
  });
});
