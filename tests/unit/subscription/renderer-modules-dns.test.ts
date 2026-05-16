import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { renderableNode } from "./fixtures";

describe("subscription renderer: DNS modules", () => {
  it("merges advanced override modules into generated configs", () => {
    const clash = YAML.parse(renderSubscription({
      format: "clash",
      profileName: "Default",
      modules: [{ content: { dns: { enable: true, nameserver: ["https://dns.example/dns-query"] } }, format: "clash", type: "advanced-override" }],
      nodes: [renderableNode()]
    }).replace(/^#.*\n/, "")) as Record<string, unknown>;
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [{ content: { dns: { servers: [{ address: "https://dns.example/dns-query", tag: "remote" }] } }, format: "sing-box", type: "advanced-override" }],
      nodes: [renderableNode()]
    })) as { dns: { servers: Array<Record<string, unknown>> } };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [{ content: { dns: { servers: ["1.1.1.1"] }, log: { loglevel: "debug" } }, format: "xray", type: "advanced-override" }],
      nodes: [renderableNode()]
    })) as { dns: { servers: string[] }; log: { loglevel: string } };

    expect(clash.dns).toEqual({ enable: true, nameserver: ["https://dns.example/dns-query"] });
    expect(singBox.dns.servers).toEqual([expect.objectContaining({ tag: "remote" })]);
    expect(xray.dns.servers).toEqual(["1.1.1.1"]);
    expect(xray.log.loglevel).toBe("debug");
  });

  it("renders semantic DNS modules for Clash, sing-box and Xray", () => {
    const dnsContent = {
      enable: true,
      enhancedMode: "fake-ip",
      fakeIp: true,
      fakeIpFilter: ["*.lan"],
      fallback: ["https://backup.example/dns-query"],
      servers: ["https://dns.example/dns-query"],
      strategy: "prefer_ipv4"
    };
    const clash = YAML.parse(renderSubscription({
      format: "clash",
      profileName: "Default",
      modules: [{ content: dnsContent, format: "clash", type: "dns" }],
      nodes: [renderableNode()]
    }).replace(/^#.*\n/, "")) as { dns: Record<string, unknown> };
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [{ content: dnsContent, format: "sing-box", type: "dns" }],
      nodes: [renderableNode()]
    })) as { dns: { fakeip: { enabled: boolean }; final: string; servers: Array<Record<string, unknown>>; strategy: string } };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [{ content: dnsContent, format: "xray", type: "dns" }],
      nodes: [renderableNode()]
    })) as { dns: { queryStrategy: string; servers: string[] } };

    expect(clash.dns).toEqual(expect.objectContaining({
      enable: true,
      fallback: ["https://backup.example/dns-query"],
      "enhanced-mode": "fake-ip",
      nameserver: ["https://dns.example/dns-query"]
    }));
    expect(singBox.dns.servers).toEqual([expect.objectContaining({ path: "/dns-query", server: "dns.example", tag: "dns-1", type: "https" })]);
    expect(singBox.dns.final).toBe("dns-1");
    expect(singBox.dns.fakeip.enabled).toBe(true);
    expect(singBox.dns.strategy).toBe("prefer_ipv4");
    expect(xray.dns.servers).toEqual(["https://dns.example/dns-query"]);
    expect(xray.dns.queryStrategy).toBeUndefined();
  });

  it("renders sing-box fakeip as a DNS server for current sing-box configs", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [{
        content: {
          fakeIp: true,
          final: "dns-1",
          servers: ["fakeip", "https://dns.example/dns-query"]
        },
        format: "sing-box",
        type: "dns"
      }],
      nodes: [renderableNode()]
    })) as { dns: { fakeip?: Record<string, unknown>; servers: Array<Record<string, unknown>> } };

    expect(singBox.dns.fakeip).toBeUndefined();
    expect(singBox.dns.servers).toEqual([
      expect.objectContaining({ tag: "dns-1", type: "fakeip" }),
      expect.objectContaining({ server: "dns.example", tag: "dns-2", type: "https" })
    ]);
  });

  it("preserves format-specific DNS server objects", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [{
        content: {
          servers: [
            { address: "https://dns.example/dns-query", detour: "direct", tag: "remote" },
            { server: "tls-dns.example", server_port: 853, tag: "tls-remote", type: "tls" }
          ],
          strategy: "prefer_ipv4"
        },
        format: "sing-box",
        type: "dns"
      }],
      nodes: [renderableNode()]
    })) as { dns: { final: string; servers: Array<Record<string, unknown>>; strategy: string } };
    const xrayOutput = renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [{
        content: {
          queryStrategy: "UseIPv4",
          servers: [
            {
              address: "https://dns.example/dns-query",
              domains: ["geosite:private"],
              skipFallback: true
            }
          ]
        },
        format: "xray",
        type: "dns"
      }],
      nodes: [renderableNode()]
    });
    const xray = JSON.parse(xrayOutput) as { dns: { queryStrategy: string; servers: Array<Record<string, unknown>> } };

    expect(singBox.dns.servers).toEqual([
      expect.objectContaining({ detour: "direct", path: "/dns-query", server: "dns.example", tag: "remote", type: "https" }),
      expect.objectContaining({ server: "tls-dns.example", server_port: 853, tag: "tls-remote", type: "tls" })
    ]);
    expect(singBox.dns.final).toBe("remote");
    expect(singBox.dns.strategy).toBe("prefer_ipv4");
    expect(xrayOutput).not.toContain("[object Object]");
    expect(xray.dns.servers).toEqual([expect.objectContaining({
      address: "https://dns.example/dns-query",
      domains: ["geosite:private"],
      skipFallback: true
    })]);
    expect(xray.dns.queryStrategy).toBe("UseIPv4");
  });

  it("keeps DNS strategy values format-specific", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [{ content: { servers: ["https://dns.example/dns-query"], strategy: "prefer_ipv6" }, format: "common", type: "dns" }],
      nodes: [renderableNode()]
    })) as { dns: { strategy?: string } };
    const xrayFromSingBoxStrategy = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [{ content: { servers: ["https://dns.example/dns-query"], strategy: "prefer_ipv6" }, format: "common", type: "dns" }],
      nodes: [renderableNode()]
    })) as { dns: { queryStrategy?: string } };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [{ content: { queryStrategy: "UseSystem", servers: ["https://dns.example/dns-query"] }, format: "xray", type: "dns" }],
      nodes: [renderableNode()]
    })) as { dns: { queryStrategy?: string } };

    expect(singBox.dns.strategy).toBe("prefer_ipv6");
    expect(xrayFromSingBoxStrategy.dns.queryStrategy).toBeUndefined();
    expect(xray.dns.queryStrategy).toBe("UseSystem");
  });
});
