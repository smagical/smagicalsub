import YAML from "yaml";
import { beforeAll, describe, expect, it } from "vitest";
import { ensureSubscriptionSchema, fetchSubscription, seedSubscriptionFixture } from "./subscribe-fixtures";

beforeAll(async () => {
  await ensureSubscriptionSchema();
});

describe("subscription output endpoint", () => {
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
