import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { parseSubscription } from "@smagicalsub/subscription";
import { createManualNode, deleteNode } from "../../apps/worker/src/modules/nodes/node.repository";
import { replaceSourceNodes } from "../../apps/worker/src/modules/sources/source-node.repository";
import { deleteSource } from "../../apps/worker/src/modules/sources/source.repository";

const testEnv = env as typeof env & { DB: D1Database };

beforeAll(async () => {
  await testEnv.DB.batch([
    testEnv.DB.prepare(
      `CREATE TABLE IF NOT EXISTS subscription_sources (
        id TEXT PRIMARY KEY NOT NULL,
        owner_id TEXT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        groups TEXT NOT NULL DEFAULT '[]',
        enabled INTEGER NOT NULL DEFAULT 1,
        refresh_interval_minutes INTEGER NOT NULL DEFAULT 0,
        next_refresh_at TEXT,
        last_status TEXT,
        last_error TEXT,
        last_fetched_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ),
    testEnv.DB.prepare(
      `CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY NOT NULL,
        owner_id TEXT,
        source_id TEXT,
        manual INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL,
        protocol TEXT NOT NULL,
        server TEXT,
        port INTEGER,
        tags TEXT NOT NULL DEFAULT '[]',
        config_json TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ),
    testEnv.DB.prepare(
      `CREATE TABLE IF NOT EXISTS node_sources (
        node_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (node_id, source_id)
      )`
    )
  ]);
  await ensureManualColumn();
});

describe("source node groups", () => {
  it("applies source groups to all refreshed nodes and merges duplicate node groups", async () => {
    const sourceId = await createSourceFixture("Group Merge");
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
    const rows = await listNodesForSource<{ tags: string }>(sourceId, `SELECT nodes.tags FROM nodes INNER JOIN node_sources ON node_sources.node_id = nodes.id WHERE node_sources.source_id = ?1`);

    expect(count).toBe(1);
    expect(rows.results).toHaveLength(1);
    expect(JSON.parse(rows.results?.[0]?.tags ?? "[]")).toEqual(["Proxy", "Media", "Default"]);
  });

  it("keeps existing user groups when a refreshed duplicate is replaced", async () => {
    const sourceId = await createSourceFixture("Group Keep");
    const node = {
      name: "SG",
      protocol: "ss",
      server: "sg.example.com",
      port: 8388,
      rawUri: "ss://sg#SG",
      config: { type: "ss", server: "sg.example.com", port: 8388, cipher: "aes-256-gcm", password: "pass" }
    };

    await replaceSourceNodes(testEnv.DB, sourceId, [node], null, ["Proxy"]);
    await testEnv.DB
      .prepare(`UPDATE nodes SET tags = ?1 WHERE id IN (SELECT node_id FROM node_sources WHERE source_id = ?2)`)
      .bind(JSON.stringify(["Custom;Media"]), sourceId)
      .run();
    await replaceSourceNodes(testEnv.DB, sourceId, [node], null, ["Proxy"]);

    const row = await testEnv.DB
      .prepare(`SELECT nodes.tags FROM nodes INNER JOIN node_sources ON node_sources.node_id = nodes.id WHERE node_sources.source_id = ?1`)
      .bind(sourceId)
      .first<{ tags: string }>();

    expect(JSON.parse(row?.tags ?? "[]")).toEqual(["Proxy", "Custom", "Media"]);
  });

  it("stores mixed parsed subscription content with source groups and deduplicated nodes", async () => {
    const sourceId = await createSourceFixture("Mixed Content");
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
      .prepare(
        `SELECT nodes.name, nodes.protocol, nodes.tags, nodes.config_json
         FROM nodes
         INNER JOIN node_sources ON node_sources.node_id = nodes.id
         WHERE node_sources.source_id = ?1
         ORDER BY nodes.protocol ASC`
      )
      .bind(sourceId)
      .all<{ config_json: string; name: string; protocol: string; tags: string }>();

    expect(count).toBe(2);
    expect(rows.results).toHaveLength(2);
    expect(rows.results?.map((row) => row.protocol)).toEqual(["ss", "trojan"]);
    expect(JSON.parse(rows.results?.[0]?.tags ?? "[]")).toEqual(["Proxy", "Media", "Default"]);
    expect(JSON.parse(rows.results?.[0]?.config_json ?? "{}")).toEqual(expect.objectContaining({ __rawUri: ssUri }));
  });

  it("deduplicates the same node across sources and deletes only orphaned source nodes", async () => {
    const sourceA = await createSourceFixture("Source A");
    const sourceB = await createSourceFixture("Source B");
    const uri = ssUri("shared.example.com", "Shared");
    const nodes = parseSubscription(uri);

    await replaceSourceNodes(testEnv.DB, sourceA, nodes, null, ["A"]);
    await replaceSourceNodes(testEnv.DB, sourceB, nodes, null, ["B"]);

    expect(await nodeCountByServer("shared.example.com")).toBe(1);
    expect(await sourceLinkCount(sourceA)).toBe(1);
    expect(await sourceLinkCount(sourceB)).toBe(1);

    await deleteSource(testEnv.DB, sourceA);
    expect(await nodeCountByServer("shared.example.com")).toBe(1);
    expect(await sourceLinkCount(sourceB)).toBe(1);

    await deleteSource(testEnv.DB, sourceB);
    expect(await nodeCountByServer("shared.example.com")).toBe(0);
  });

  it("keeps a subscribed node when manual source is removed, then deletes it when the last source is removed", async () => {
    const sourceId = await createSourceFixture("Manual Mirror");
    const uri = ssUri("manual-shared.example.com", "Manual Shared");
    const manual = await createManualNode(testEnv.DB, { enabled: true, groups: ["Manual"], uri }, null);

    expect(manual?.deduped).toBe(false);

    await replaceSourceNodes(testEnv.DB, sourceId, parseSubscription(uri), null, ["Source"]);
    const linked = await testEnv.DB
      .prepare(`SELECT id, manual FROM nodes WHERE server = ?1`)
      .bind("manual-shared.example.com")
      .first<{ id: string; manual: number }>();

    expect(await nodeCountByServer("manual-shared.example.com")).toBe(1);
    expect(linked?.manual).toBe(1);
    expect(await sourceLinkCount(sourceId)).toBe(1);

    const deleteResult = await deleteNode(testEnv.DB, linked?.id ?? "");
    const afterManualDelete = await testEnv.DB
      .prepare(`SELECT manual FROM nodes WHERE server = ?1`)
      .bind("manual-shared.example.com")
      .first<{ manual: number }>();

    expect(deleteResult.status).toBe("manual-detached");
    expect(afterManualDelete?.manual).toBe(0);
    expect(await nodeCountByServer("manual-shared.example.com")).toBe(1);

    await deleteSource(testEnv.DB, sourceId);
    expect(await nodeCountByServer("manual-shared.example.com")).toBe(0);
  });
});

async function ensureManualColumn() {
  const columns = await testEnv.DB.prepare(`PRAGMA table_info(nodes)`).all<{ name: string }>();
  const columnNames = new Set((columns.results ?? []).map((row) => row.name));

  if (!columnNames.has("manual")) {
    await testEnv.DB.prepare(`ALTER TABLE nodes ADD COLUMN manual INTEGER NOT NULL DEFAULT 0`).run();
  }
}

async function createSourceFixture(name: string) {
  const id = crypto.randomUUID();

  await testEnv.DB
    .prepare(`INSERT INTO subscription_sources (id, owner_id, name, url, groups, enabled) VALUES (?1, NULL, ?2, ?3, '[]', 1)`)
    .bind(id, name, `https://${id}.example.com/sub`)
    .run();

  return id;
}

async function listNodesForSource<T>(sourceId: string, sql: string) {
  return testEnv.DB.prepare(sql).bind(sourceId).all<T>();
}

async function nodeCountByServer(server: string) {
  const row = await testEnv.DB.prepare(`SELECT COUNT(*) AS count FROM nodes WHERE server = ?1`).bind(server).first<{ count: number }>();
  return row?.count ?? 0;
}

async function sourceLinkCount(sourceId: string) {
  const row = await testEnv.DB.prepare(`SELECT COUNT(*) AS count FROM node_sources WHERE source_id = ?1`).bind(sourceId).first<{ count: number }>();
  return row?.count ?? 0;
}

function ssUri(server: string, name: string) {
  return `ss://${btoa(`aes-256-gcm:pass@${server}:8388`)}#${encodeURIComponent(name)}`;
}
