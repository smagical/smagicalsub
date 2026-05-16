import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { parseSubscription } from "@smagicalsub/subscription";
import { replaceSourceNodes } from "../../apps/worker/src/modules/sources/source-node.repository";

const testEnv = env as typeof env & { DB: D1Database };

beforeAll(async () => {
  await testEnv.DB.batch([
    testEnv.DB.prepare(
      `CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY NOT NULL,
        owner_id TEXT,
        source_id TEXT,
        name TEXT NOT NULL,
        protocol TEXT NOT NULL,
        server TEXT,
        port INTEGER,
        tags TEXT NOT NULL DEFAULT '[]',
        config_json TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
  ]);
});

describe("source node groups", () => {
  it("applies source groups to all refreshed nodes and merges duplicate node groups", async () => {
    const sourceId = crypto.randomUUID();
    const node = {
      name: "HK",
      protocol: "ss",
      server: "example.com",
      port: 8388,
      rawUri: "ss://example#HK",
      config: { type: "ss", server: "example.com", port: 8388, cipher: "aes-256-gcm", password: "pass" }
    };

    const count = await replaceSourceNodes(
      testEnv.DB,
      sourceId,
      [
        node,
        {
          ...node,
          name: "HK Duplicate",
          rawUri: "ss://example#HK-Duplicate"
        }
      ],
      null,
      ["Proxy,Media", "Default"]
    );
    const rows = await testEnv.DB.prepare(`SELECT tags FROM nodes WHERE source_id = ?1`).bind(sourceId).all<{ tags: string }>();

    expect(count).toBe(1);
    expect(rows.results).toHaveLength(1);
    expect(JSON.parse(rows.results?.[0]?.tags ?? "[]")).toEqual(["Proxy", "Media", "Default"]);
  });

  it("keeps existing user groups when a refreshed duplicate is replaced", async () => {
    const sourceId = crypto.randomUUID();
    const node = {
      name: "SG",
      protocol: "ss",
      server: "sg.example.com",
      port: 8388,
      rawUri: "ss://sg#SG",
      config: { type: "ss", server: "sg.example.com", port: 8388, cipher: "aes-256-gcm", password: "pass" }
    };

    await replaceSourceNodes(testEnv.DB, sourceId, [node], null, ["Proxy"]);
    await testEnv.DB.prepare(`UPDATE nodes SET tags = ?1 WHERE source_id = ?2`).bind(JSON.stringify(["Custom;Media"]), sourceId).run();
    await replaceSourceNodes(testEnv.DB, sourceId, [node], null, ["Proxy"]);

    const row = await testEnv.DB.prepare(`SELECT tags FROM nodes WHERE source_id = ?1`).bind(sourceId).first<{ tags: string }>();

    expect(JSON.parse(row?.tags ?? "[]")).toEqual(["Proxy", "Custom", "Media"]);
  });

  it("stores mixed parsed subscription content with source groups and deduplicated nodes", async () => {
    const sourceId = crypto.randomUUID();
    const ssUri = `ss://${btoa("aes-256-gcm:pass@mixed.example.com:8388")}#Mixed`;
    const renamedDuplicateUri = `ss://${btoa("aes-256-gcm:pass@mixed.example.com:8388")}#Mixed-Duplicate`;
    const trojanUri = "trojan://secret@trojan.example.com:443#Trojan";
    const nodes = parseSubscription([
      ssUri,
      "bad://node",
      btoa(`${renamedDuplicateUri}\n${trojanUri}`)
    ].join("\n"));

    const count = await replaceSourceNodes(testEnv.DB, sourceId, nodes, null, ["Proxy,Media", "Default"]);
    const rows = await testEnv.DB
      .prepare(`SELECT name, protocol, tags, config_json FROM nodes WHERE source_id = ?1 ORDER BY protocol ASC`)
      .bind(sourceId)
      .all<{ config_json: string; name: string; protocol: string; tags: string }>();

    expect(count).toBe(2);
    expect(rows.results).toHaveLength(2);
    expect(rows.results?.map((row) => row.protocol)).toEqual(["ss", "trojan"]);
    expect(JSON.parse(rows.results?.[0]?.tags ?? "[]")).toEqual(["Proxy", "Media", "Default"]);
    expect(JSON.parse(rows.results?.[0]?.config_json ?? "{}")).toEqual(expect.objectContaining({ __rawUri: ssUri }));
  });
});
