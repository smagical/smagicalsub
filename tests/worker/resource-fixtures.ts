import { env, SELF } from "cloudflare:test";
import { expect } from "vitest";

export const testEnv = env as typeof env & { DB: D1Database };

const adminHeaders = { Authorization: "Bearer secret", "Content-Type": "application/json" };

export async function ensureResourceSchema() {
  await testEnv.DB.batch(resourceSchemaStatements().map((sql) => testEnv.DB.prepare(sql)));
}

export async function createUserAndLogin(email: string) {
  const password = "password123";
  const response = await SELF.fetch("https://example.com/api/users", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, name: email, password, role: "user" })
  });

  expect(response.status).toBe(201);
  return loginToken(email, password);
}

export async function getJson<T>(token: string, path: string) {
  const response = await SELF.fetch(`https://example.com${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const payload = (await response.json()) as { data: T };
  expect(response.status).toBe(200);
  return payload.data;
}

export async function postJson<T>(token: string, path: string, body: unknown) {
  const response = await postRawJson(token, path, body);
  const payload = (await response.json()) as { data: T };

  expect(response.status).toBeLessThan(300);
  return payload.data;
}

export function postRawJson(token: string, path: string, body: unknown) {
  return SELF.fetch(`https://example.com${path}`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(body)
  });
}

export function patchRawJson(token: string, path: string, body: unknown) {
  return SELF.fetch(`https://example.com${path}`, {
    method: "PATCH",
    headers: authJsonHeaders(token),
    body: JSON.stringify(body)
  });
}

function authJsonHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function loginToken(email: string, password: string) {
  const payload = await postPublicJson<{ token: string }>("/api/auth/login", { email, password });
  return payload.token;
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

function resourceSchemaStatements() {
  return [
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT, role TEXT NOT NULL DEFAULT 'user', protected INTEGER NOT NULL DEFAULT 0, password_hash TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS subscription_sources (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, name TEXT NOT NULL, url TEXT NOT NULL, groups TEXT NOT NULL DEFAULT '[]', enabled INTEGER NOT NULL DEFAULT 1, refresh_interval_minutes INTEGER NOT NULL DEFAULT 0, next_refresh_at TEXT, last_status TEXT, last_error TEXT, last_fetched_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, source_id TEXT, name TEXT NOT NULL, protocol TEXT NOT NULL, server TEXT, port INTEGER, tags TEXT NOT NULL DEFAULT '[]', config_json TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, name TEXT NOT NULL, description TEXT, default_strategy TEXT NOT NULL DEFAULT 'Proxy', enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS profile_rules (id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL, position INTEGER NOT NULL, format TEXT NOT NULL DEFAULT 'common', rule TEXT NOT NULL, content_json TEXT NOT NULL DEFAULT '{}', enabled INTEGER NOT NULL DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS profile_modules (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, profile_id TEXT, name TEXT NOT NULL, format TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'advanced-override', content_json TEXT NOT NULL DEFAULT '{}', enabled INTEGER NOT NULL DEFAULT 1, is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS subscribe_tokens (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT, profile_id TEXT, token TEXT NOT NULL UNIQUE, custom_path TEXT, node_ids_json TEXT NOT NULL DEFAULT '[]', name TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, expires_at TEXT, last_used_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS subscribe_token_modules (token_id TEXT NOT NULL, module_id TEXT NOT NULL, format TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'advanced-override', PRIMARY KEY (token_id, format, type))`,
    `CREATE TABLE IF NOT EXISTS refresh_jobs (id TEXT PRIMARY KEY NOT NULL, source_id TEXT, status TEXT NOT NULL, message TEXT, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, finished_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS access_logs (id TEXT PRIMARY KEY NOT NULL, token_id TEXT, path TEXT NOT NULL, ip TEXT, user_agent TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  ];
}
