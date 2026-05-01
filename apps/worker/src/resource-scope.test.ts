import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";

const testEnv = env as typeof env & { DB: D1Database };
const adminHeaders = { Authorization: "Bearer secret", "Content-Type": "application/json" };

beforeAll(async () => {
  await testEnv.DB.batch(schemaStatements().map((sql) => testEnv.DB.prepare(sql)));
});

describe("resource owner scope", () => {
  it("hides another user's sources and dashboard totals", async () => {
    const suffix = crypto.randomUUID();
    const ownerToken = await createUserAndLogin(`owner-${suffix}@example.com`);
    const otherToken = await createUserAndLogin(`other-${suffix}@example.com`);
    const source = await postJson<{ id: string }>(ownerToken, "/api/sources", {
      enabled: true,
      name: "Owner source",
      url: "https://example.com/sub.txt"
    });

    const otherSources = await getJson<{ items: Array<{ id: string }> }>(otherToken, "/api/sources");
    const ownerDashboard = await getJson<{ totals: { sources: number } }>(ownerToken, "/api/dashboard");
    const otherDashboard = await getJson<{ totals: { sources: number } }>(otherToken, "/api/dashboard");
    const blockedPatch = await SELF.fetch(`https://example.com/api/sources/${source.id}`, {
      method: "PATCH",
      headers: authJsonHeaders(otherToken),
      body: JSON.stringify({ name: "Blocked source" })
    });

    expect(otherSources.items).toEqual([]);
    expect(ownerDashboard.totals.sources).toBe(1);
    expect(otherDashboard.totals.sources).toBe(0);
    expect(blockedPatch.status).toBe(404);
  });

  it("blocks binding a token to another user's profile", async () => {
    const suffix = crypto.randomUUID();
    const ownerToken = await createUserAndLogin(`profile-owner-${suffix}@example.com`);
    const otherToken = await createUserAndLogin(`profile-other-${suffix}@example.com`);
    const profile = await postJson<{ id: string }>(ownerToken, "/api/profiles", {
      default_strategy: "Proxy",
      enabled: true,
      name: "Owner profile"
    });
    const response = await SELF.fetch("https://example.com/api/tokens", {
      method: "POST",
      headers: authJsonHeaders(otherToken),
      body: JSON.stringify({ enabled: true, name: "Invalid token", profile_id: profile.id })
    });
    const payload = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("PROFILE_NOT_FOUND");
  });
});

async function createUserAndLogin(email: string) {
  const password = "password123";
  const response = await SELF.fetch("https://example.com/api/users", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, name: email, password, role: "user" })
  });

  expect(response.status).toBe(201);
  return loginToken(email, password);
}

async function loginToken(email: string, password: string) {
  const payload = await postPublicJson<{ token: string }>("/api/auth/login", { email, password });
  return payload.token;
}

async function getJson<T>(token: string, path: string) {
  const response = await SELF.fetch(`https://example.com${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const payload = (await response.json()) as { data: T };
  expect(response.status).toBe(200);
  return payload.data;
}

async function postJson<T>(token: string, path: string, body: unknown) {
  const response = await SELF.fetch(`https://example.com${path}`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as { data: T };

  expect(response.status).toBeLessThan(300);
  return payload.data;
}

async function postPublicJson<T>(path: string, body: unknown) {
  const response = await SELF.fetch(`https://example.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as { data: T };

  expect(response.status).toBe(200);
  return payload.data;
}

function authJsonHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function schemaStatements() {
  return [
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT, role TEXT NOT NULL DEFAULT 'user', password_hash TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS subscription_sources (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, name TEXT NOT NULL, url TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, last_status TEXT, last_error TEXT, last_fetched_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, source_id TEXT, name TEXT NOT NULL, protocol TEXT NOT NULL, server TEXT, port INTEGER, tags TEXT NOT NULL DEFAULT '[]', config_json TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, name TEXT NOT NULL, description TEXT, default_strategy TEXT NOT NULL DEFAULT 'Proxy', enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS profile_rules (id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL, position INTEGER NOT NULL, rule TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS subscribe_tokens (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, profile_id TEXT, token TEXT NOT NULL UNIQUE, name TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, expires_at TEXT, last_used_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS refresh_jobs (id TEXT PRIMARY KEY NOT NULL, source_id TEXT, status TEXT NOT NULL, message TEXT, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, finished_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS access_logs (id TEXT PRIMARY KEY NOT NULL, token_id TEXT, path TEXT NOT NULL, ip TEXT, user_agent TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  ];
}
