import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { renderSubscription } from "@smagicalsub/subscription";
import { renderableNode } from "./fixtures";

describe("subscription renderer: inbound modules", () => {
  it("renders semantic inbound modules for Clash, sing-box and Xray", () => {
    const inboundContent = {
      allowLan: true,
      inboundType: "socks",
      listen: "0.0.0.0",
      port: 10808,
      sniff: true,
      tag: "socks-in",
      udp: true
    };
    const clash = YAML.parse(renderSubscription({
      format: "clash",
      profileName: "Default",
      modules: [{ content: inboundContent, format: "clash", type: "inbound" }],
      nodes: [renderableNode()]
    }).replace(/^#.*\n/, "")) as Record<string, unknown>;
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [{ content: inboundContent, format: "sing-box", type: "inbound" }],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>> };
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [{ content: inboundContent, format: "xray", type: "inbound" }],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>> };

    expect(clash["allow-lan"]).toBe(true);
    expect(clash["bind-address"]).toBe("0.0.0.0");
    expect(clash["socks-port"]).toBe(10808);
    expect(singBox.inbounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ listen: "0.0.0.0", listen_port: 10808, type: "socks", udp: true })
    ]));
    expect(xray.inbounds).toEqual([expect.objectContaining({ listen: "0.0.0.0", port: 10808, protocol: "socks" })]);
  });

  it("preserves Xray inbound settings and sniffing module objects", () => {
    const xray = JSON.parse(renderSubscription({
      format: "xray",
      profileName: "Default",
      modules: [
        {
          content: {
            inboundType: "socks",
            listen: "127.0.0.1",
            port: 10808,
            settings: { auth: "noauth", udp: true },
            sniffing: {
              destOverride: ["http", "tls"],
              enabled: true,
              metadataOnly: false
            },
            tag: "socks-in"
          },
          format: "xray",
          type: "inbound"
        }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<{ settings: Record<string, unknown>; sniffing: Record<string, unknown> }> };

    expect(xray.inbounds[0]?.settings).toEqual({ auth: "noauth", udp: true });
    expect(xray.inbounds[0]?.sniffing).toEqual({
      destOverride: ["http", "tls"],
      enabled: true,
      metadataOnly: false
    });
  });

  it("preserves sing-box inbound module object fields", () => {
    const singBox = JSON.parse(renderSubscription({
      format: "sing-box",
      profileName: "Default",
      modules: [
        {
          content: {
            listen_port: 2081,
            listen: "127.0.0.1",
            sniff: true,
            tag: "mixed-in",
            type: "socks",
            users: [{ password: "pass", username: "user" }]
          },
          format: "sing-box",
          type: "inbound"
        }
      ],
      nodes: [renderableNode()]
    })) as { inbounds: Array<Record<string, unknown>> };

    expect(singBox.inbounds).toEqual([
      expect.objectContaining({
        listen: "127.0.0.1",
        listen_port: 2081,
        tag: "mixed-in",
        type: "socks",
        users: [{ password: "pass", username: "user" }]
      })
    ]);
    expect(singBox.inbounds[0]).not.toHaveProperty("inboundType");
    expect(singBox.inbounds[0]).not.toHaveProperty("port");
  });
});
