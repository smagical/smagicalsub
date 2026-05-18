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
    )`)
  ]);
});

describe("worker runtime", () => {
  it("serves health from the Workers runtime", async () => {
    const response = await SELF.fetch("https://example.com/api/health");
    const payload = (await response.json()) as { ok: boolean; data: { authRequired: boolean; env: string; status: string } };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      data: expect.objectContaining({
        authRequired: true,
        env: "test",
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
