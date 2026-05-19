import { env, SELF } from "cloudflare:test";
import { expect } from "vitest";

export const testEnv = env as typeof env & { DB: D1Database; KV: KVNamespace };

export type SubscriptionFixture = {
  moduleIds: {
    clashDns: string;
    singBoxDns: string;
    xrayDns: string;
  };
  nodeIds: {
    ss: string;
    vless: string;
  };
  path: string;
  profileId: string;
  ssUri: string;
  token: string;
  tokenId: string;
  vlessUri: string;
};

type SeedSubscriptionOptions = {
  enabled?: boolean;
  expiresAt?: string | null;
  profileEnabled?: boolean;
};

export async function ensureSubscriptionSchema() {
  await testEnv.DB.batch(subscriptionSchemaStatements().map((sql) => testEnv.DB.prepare(sql)));
  await ensureNodeSourceSchema();
}

export async function fetchSubscription(path: string, format: string, expectedStatus = 200) {
  const response = await SELF.fetch(`https://example.com/sub/${path}?format=${format}`, {
    headers: {
      "CF-Connecting-IP": "203.0.113.1",
      "User-Agent": "subscribe-output-test"
    }
  });

  expect(response.status).toBe(expectedStatus);
  return response;
}

export async function seedSubscriptionFixture(options: SeedSubscriptionOptions = {}): Promise<SubscriptionFixture> {
  const suffix = crypto.randomUUID();
  const profileId = `profile_${suffix}`;
  const tokenId = `token_${suffix}`;
  const path = `custom-${suffix}`;
  const token = `raw-${suffix}`;
  const ssUri = `ss://${btoa("aes-256-gcm:pass@hk.example.com:8388")}#HK`;
  const vlessUri = "vless://00000000-0000-0000-0000-000000000000@vless.example.com:443?security=tls&sni=vless.example.com&type=ws&host=edge.example.com&path=%2Fws#VLESS";
  const nodeIds = {
    ss: `node_ss_${suffix}`,
    vless: `node_vless_${suffix}`
  };
  const moduleIds = {
    clashDns: `module_clash_${suffix}`,
    singBoxDns: `module_singbox_${suffix}`,
    xrayDns: `module_xray_${suffix}`
  };

  await testEnv.DB.batch([
    testEnv.DB.prepare(
      `INSERT INTO profiles (id, owner_id, name, default_strategy, enabled)
       VALUES (?1, NULL, ?2, 'Proxy', ?3)`
    ).bind(profileId, "Endpoint profile", options.profileEnabled === false ? 0 : 1),
    testEnv.DB.prepare(
      `INSERT INTO profile_rules (id, profile_id, position, format, rule, content_json, enabled)
       VALUES (?1, ?2, 10, 'common', 'DOMAIN-SUFFIX,example.com,DIRECT', '{}', 1)`
    ).bind(`rule_${suffix}`, profileId),
    nodeInsert(nodeIds.ss, "HK", "ss", "hk.example.com", 8388, ["HK"], {
      type: "ss",
      server: "hk.example.com",
      port: 8388,
      cipher: "aes-256-gcm",
      password: "pass",
      __rawUri: ssUri
    }),
    nodeInsert(nodeIds.vless, "VLESS", "vless", "vless.example.com", 443, ["VLESS"], {
      type: "vless",
      server: "vless.example.com",
      port: 443,
      uuid: "00000000-0000-0000-0000-000000000000",
      security: "tls",
      tls: true,
      sni: "vless.example.com",
      network: "ws",
      "ws-opts": { path: "/ws", headers: { Host: "edge.example.com" } },
      __rawUri: vlessUri
    }),
    moduleInsert(moduleIds.clashDns, "clash", "dns", {
      enhancedMode: "fake-ip",
      servers: ["https://dns.example/dns-query"]
    }),
    moduleInsert(moduleIds.singBoxDns, "sing-box", "dns", {
      servers: ["fakeip", "https://dns.example/dns-query"]
    }),
    moduleInsert(moduleIds.xrayDns, "xray", "dns", {
      queryStrategy: "UseIPv4",
      servers: ["https://dns.example/dns-query"]
    }),
    testEnv.DB.prepare(
      `INSERT INTO subscribe_tokens (id, owner_id, profile_id, token, custom_path, node_ids_json, name, enabled, expires_at)
       VALUES (?1, NULL, ?2, ?3, ?4, ?5, 'Endpoint token', ?6, ?7)`
    ).bind(
      tokenId,
      profileId,
      token,
      path,
      JSON.stringify([nodeIds.ss, nodeIds.vless]),
      options.enabled === false ? 0 : 1,
      options.expiresAt ?? null
    ),
    bindingInsert(tokenId, moduleIds.clashDns, "clash", "dns"),
    bindingInsert(tokenId, moduleIds.singBoxDns, "sing-box", "dns"),
    bindingInsert(tokenId, moduleIds.xrayDns, "xray", "dns")
  ]);

  return { moduleIds, nodeIds, path, profileId, ssUri, token, tokenId, vlessUri };
}

export async function accessLogCount(tokenId: string) {
  const row = await testEnv.DB
    .prepare(`SELECT COUNT(*) AS count FROM access_logs WHERE token_id = ?1`)
    .bind(tokenId)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

export async function tokenLastUsedAt(tokenId: string) {
  const row = await testEnv.DB
    .prepare(`SELECT last_used_at FROM subscribe_tokens WHERE id = ?1`)
    .bind(tokenId)
    .first<{ last_used_at: string | null }>();

  return row?.last_used_at ?? null;
}

export async function waitForAccessLogCount(tokenId: string, expected: number) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const count = await accessLogCount(tokenId);

    if (count >= expected) {
      return count;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return accessLogCount(tokenId);
}

function nodeInsert(id: string, name: string, protocol: string, server: string, port: number, groups: string[], config: Record<string, unknown>) {
  return testEnv.DB.prepare(
    `INSERT INTO nodes (id, owner_id, source_id, manual, name, protocol, server, port, tags, config_json, enabled)
     VALUES (?1, NULL, NULL, 1, ?2, ?3, ?4, ?5, ?6, ?7, 1)`
  ).bind(id, name, protocol, server, port, JSON.stringify(groups), JSON.stringify(config));
}

function moduleInsert(id: string, format: string, type: string, content: Record<string, unknown>) {
  return testEnv.DB.prepare(
    `INSERT INTO profile_modules (id, owner_id, profile_id, name, format, type, content_json, enabled, is_default)
     VALUES (?1, NULL, NULL, ?2, ?3, ?4, ?5, 1, 0)`
  ).bind(id, `${format} ${type}`, format, type, JSON.stringify(content));
}

function bindingInsert(tokenId: string, moduleId: string, format: string, type: string) {
  return testEnv.DB.prepare(
    `INSERT INTO subscribe_token_modules (token_id, module_id, format, type)
     VALUES (?1, ?2, ?3, ?4)`
  ).bind(tokenId, moduleId, format, type);
}

function subscriptionSchemaStatements() {
  return [
    `CREATE TABLE IF NOT EXISTS subscription_sources (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, name TEXT NOT NULL, url TEXT NOT NULL, groups TEXT NOT NULL DEFAULT '[]', enabled INTEGER NOT NULL DEFAULT 1, refresh_interval_minutes INTEGER NOT NULL DEFAULT 0, next_refresh_at TEXT, last_status TEXT, last_error TEXT, last_fetched_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, source_id TEXT, manual INTEGER NOT NULL DEFAULT 0, name TEXT NOT NULL, protocol TEXT NOT NULL, server TEXT, port INTEGER, tags TEXT NOT NULL DEFAULT '[]', config_json TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS node_sources (node_id TEXT NOT NULL, source_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (node_id, source_id))`,
    `CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, name TEXT NOT NULL, description TEXT, default_strategy TEXT NOT NULL DEFAULT 'Proxy', enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS profile_rules (id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL, position INTEGER NOT NULL, format TEXT NOT NULL DEFAULT 'common', rule TEXT NOT NULL, content_json TEXT NOT NULL DEFAULT '{}', enabled INTEGER NOT NULL DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS profile_modules (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, profile_id TEXT, name TEXT NOT NULL, format TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'advanced-override', content_json TEXT NOT NULL DEFAULT '{}', enabled INTEGER NOT NULL DEFAULT 1, is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS subscribe_tokens (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, profile_id TEXT, token TEXT NOT NULL UNIQUE, custom_path TEXT, node_ids_json TEXT NOT NULL DEFAULT '[]', name TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, expires_at TEXT, last_used_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS subscribe_token_modules (token_id TEXT NOT NULL, module_id TEXT NOT NULL, format TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'advanced-override', PRIMARY KEY (token_id, format, type))`,
    `CREATE TABLE IF NOT EXISTS access_logs (id TEXT PRIMARY KEY NOT NULL, token_id TEXT, path TEXT NOT NULL, ip TEXT, user_agent TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  ];
}

async function ensureNodeSourceSchema() {
  const columns = await testEnv.DB.prepare(`PRAGMA table_info(nodes)`).all<{ name: string }>();
  const columnNames = new Set((columns.results ?? []).map((row) => row.name));

  if (!columnNames.has("manual")) {
    await testEnv.DB.prepare(`ALTER TABLE nodes ADD COLUMN manual INTEGER NOT NULL DEFAULT 0`).run();
  }
}
