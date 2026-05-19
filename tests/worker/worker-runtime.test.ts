import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";

const testEnv = env as typeof env & { DB: D1Database };

beforeAll(async () => {
  await testEnv.DB.batch([
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      protected INTEGER NOT NULL DEFAULT 0,
      password_hash TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS subscription_sources (
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
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS nodes (
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
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS node_sources (
      node_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (node_id, source_id)
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,
      owner_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      default_strategy TEXT NOT NULL DEFAULT 'Proxy',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS profile_rules (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      format TEXT NOT NULL DEFAULT 'common',
      rule TEXT NOT NULL,
      content_json TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS profile_modules (
      id TEXT PRIMARY KEY NOT NULL,
      owner_id TEXT,
      profile_id TEXT,
      name TEXT NOT NULL,
      format TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'advanced-override',
      content_json TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS subscribe_tokens (
      id TEXT PRIMARY KEY NOT NULL,
      owner_id TEXT,
      profile_id TEXT,
      token TEXT NOT NULL UNIQUE,
      custom_path TEXT,
      node_ids_json TEXT NOT NULL DEFAULT '[]',
      name TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      last_used_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS subscribe_token_modules (
      token_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      format TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'advanced-override',
      PRIMARY KEY (token_id, format, type)
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS refresh_jobs (
      id TEXT PRIMARY KEY NOT NULL,
      source_id TEXT,
      status TEXT NOT NULL,
      message TEXT,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      finished_at TEXT
    )`),
    testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS access_logs (
      id TEXT PRIMARY KEY NOT NULL,
      token_id TEXT,
      path TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
  ]);
});

beforeAll(async () => {
  const columns = await testEnv.DB.prepare(`PRAGMA table_info(nodes)`).all<{ name: string }>();
  const columnNames = new Set((columns.results ?? []).map((row) => row.name));

  if (!columnNames.has("manual")) {
    await testEnv.DB.prepare(`ALTER TABLE nodes ADD COLUMN manual INTEGER NOT NULL DEFAULT 0`).run();
  }
});

describe("worker runtime", () => {
  it("serves health from the Workers runtime", async () => {
    const response = await SELF.fetch("https://example.com/api/health");
    const payload = (await response.json()) as { ok: boolean; data: { authRequired: boolean; env: string; migrationsReady: boolean; setupAvailable: boolean; status: string } };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      data: expect.objectContaining({
        authRequired: true,
        env: "test",
        migrationsReady: true,
        setupAvailable: true,
        status: "ok"
      })
    });
  });

  it("serves public site settings and protects updates", async () => {
    const publicResponse = await SELF.fetch("https://example.com/api/site-settings");
    const publicPayload = (await publicResponse.json()) as { ok: boolean; data: { siteSubtitle: string } };

    expect(publicResponse.status).toBe(200);
    expect(publicPayload.data.siteSubtitle).toBe("多格式订阅管理");

    const blockedResponse = await SELF.fetch("https://example.com/api/site-settings", { method: "PATCH" });

    expect(blockedResponse.status).toBe(401);
  });

  it("updates site settings with the admin token", async () => {
    const response = await SELF.fetch("https://example.com/api/site-settings", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer secret",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ siteName: "自定义订阅台", titleImageUrl: "https://example.com/logo.png" })
    });
    const payload = (await response.json()) as { ok: boolean; data: { siteName: string; titleImageUrl: string } };

    expect(response.status).toBe(200);
    expect(payload.data).toEqual(expect.objectContaining({ siteName: "自定义订阅台", titleImageUrl: "https://example.com/logo.png" }));
  });

  it("keeps setup open but blocks bootstrap when any core table is missing", async () => {
    await testEnv.DB.prepare("DROP TABLE sessions").run();

    try {
      const setupStatusResponse = await SELF.fetch("https://example.com/api/setup/status");
      const setupStatusPayload = (await setupStatusResponse.json()) as {
        data: { available: boolean; bootstrapRequired: boolean; resources: { migrations: boolean }; steps: Array<{ key: string; ok: boolean }> };
      };
      const healthResponse = await SELF.fetch("https://example.com/api/health");
      const healthPayload = (await healthResponse.json()) as { data: { migrationsReady: boolean; setupAvailable: boolean } };
      const authStatusResponse = await SELF.fetch("https://example.com/api/auth/status");
      const authStatusPayload = (await authStatusResponse.json()) as { data: { bootstrapRequired: boolean } };
      const bootstrapResponse = await SELF.fetch("https://example.com/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bootstrapToken: "secret", email: "blocked@example.com", name: "Blocked", password: "password123" })
      });
      const bootstrapPayload = (await bootstrapResponse.json()) as { error: { code: string } };
      const migrationsStep = setupStatusPayload.data.steps.find((step) => step.key === "migrations");

      expect(setupStatusResponse.status).toBe(200);
      expect(setupStatusPayload.data).toEqual(expect.objectContaining({ available: true, bootstrapRequired: true }));
      expect(setupStatusPayload.data.resources.migrations).toBe(false);
      expect(migrationsStep?.ok).toBe(false);
      expect(healthResponse.status).toBe(200);
      expect(healthPayload.data).toEqual(expect.objectContaining({ migrationsReady: false, setupAvailable: true }));
      expect(authStatusResponse.status).toBe(200);
      expect(authStatusPayload.data.bootstrapRequired).toBe(true);
      expect(bootstrapResponse.status).toBe(409);
      expect(bootstrapPayload.error.code).toBe("SETUP_NOT_READY");
    } finally {
      await testEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`).run();
    }
  });

  it("bootstraps the first admin, logs in, and serves current user", async () => {
    const setupStatusResponse = await SELF.fetch("https://example.com/api/setup/status");
    const setupStatusPayload = (await setupStatusResponse.json()) as { data: { available: boolean; bootstrapRequired: boolean; resources: { d1: boolean; kv: boolean; migrations: boolean } } };

    expect(setupStatusResponse.status).toBe(200);
    expect(setupStatusPayload.data).toEqual(
      expect.objectContaining({
        available: true,
        bootstrapRequired: true,
        resources: expect.objectContaining({ d1: true, kv: true, migrations: true })
      })
    );

    const bootstrapResponse = await SELF.fetch("https://example.com/api/auth/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bootstrapToken: "secret", email: "admin@example.com", name: "Admin", password: "password123" })
    });
    const bootstrapPayload = (await bootstrapResponse.json()) as { data: { token: string; user: { protected: number; role: string } } };

    expect(bootstrapResponse.status).toBe(201);
    expect(bootstrapPayload.data.user.role).toBe("admin");
    expect(bootstrapPayload.data.user.protected).toBe(1);

    const loginResponse = await SELF.fetch("https://example.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    });
    const loginPayload = (await loginResponse.json()) as { data: { token: string } };
    const meResponse = await SELF.fetch("https://example.com/api/auth/me", {
      headers: { Authorization: `Bearer ${loginPayload.data.token}` }
    });
    const mePayload = (await meResponse.json()) as { data: { email: string } };

    expect(loginResponse.status).toBe(200);
    expect(mePayload.data.email).toBe("admin@example.com");
  });

  it("redirects setup bootstrap to the main page and closes setup after initialization", async () => {
    const setupStatusResponse = await SELF.fetch("https://example.com/api/setup/status");
    const setupStatusPayload = (await setupStatusResponse.json()) as { data: { available: boolean; bootstrapRequired: boolean } };
    const bootstrapResponse = await SELF.fetch("https://example.com/api/setup/bootstrap", {
      body: new URLSearchParams({
        bootstrapToken: "secret",
        email: "ignored@example.com",
        name: "Ignored",
        password: "password123"
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      redirect: "manual"
    });

    expect(setupStatusPayload.data).toEqual(expect.objectContaining({ available: false, bootstrapRequired: false }));
    expect(bootstrapResponse.status).toBe(302);
    expect(bootstrapResponse.headers.get("location")).toBe("/");
  });

  it("keeps the bootstrap admin protected from edits and deletion", async () => {
    const adminToken = await loginToken("admin@example.com", "password123");
    const headers = { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" };
    const usersResponse = await SELF.fetch("https://example.com/api/users", { headers });
    const usersPayload = (await usersResponse.json()) as { data: { items: Array<{ id: string; protected: number }> } };
    const protectedAdmin = usersPayload.data.items.find((user) => user.protected === 1);

    expect(protectedAdmin).toBeDefined();

    const patchResponse = await SELF.fetch(`https://example.com/api/users/${protectedAdmin?.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name: "Changed" })
    });
    const deleteResponse = await SELF.fetch(`https://example.com/api/users/${protectedAdmin?.id}`, {
      method: "DELETE",
      headers
    });

    expect(patchResponse.status).toBe(409);
    expect(deleteResponse.status).toBe(409);
  });

  it("lets an admin create users and blocks non-admin user management", async () => {
    const adminToken = await loginToken("admin@example.com", "password123");
    const createResponse = await SELF.fetch("https://example.com/api/users", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", name: "User", password: "password123", role: "user" })
    });
    const userToken = await loginToken("user@example.com", "password123");
    const blockedResponse = await SELF.fetch("https://example.com/api/users", {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    expect(createResponse.status).toBe(201);
    expect(blockedResponse.status).toBe(403);
  });

  it("rejects management API requests without the admin token", async () => {
    const response = await SELF.fetch("https://example.com/api/dashboard");
    const payload = (await response.json()) as { ok: boolean; error: { code: string } };

    expect(response.status).toBe(401);
    expect(payload).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "UNAUTHORIZED" })
    });
  });
});

async function loginToken(email: string, password: string) {
  const response = await SELF.fetch("https://example.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const payload = (await response.json()) as { data: { token: string } };

  return payload.data.token;
}
