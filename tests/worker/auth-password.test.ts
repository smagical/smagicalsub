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

describe("auth password", () => {
  it("lets a logged-in user change password and keeps the current session", async () => {
    const email = `password-${crypto.randomUUID()}@example.com`;
    await createUser(email, "password123");
    const token = await loginToken(email, "password123");
    const response = await SELF.fetch("https://example.com/api/auth/password", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "password123", newPassword: "password456" })
    });

    expect(response.status).toBe(200);
    expect(await loginStatus(email, "password123")).toBe(401);
    expect(await loginStatus(email, "password456")).toBe(200);
    expect(await meStatus(token)).toBe(200);
  });

  it("lets the admin token recover an admin password and revokes old sessions", async () => {
    const email = `admin-recover-${crypto.randomUUID()}@example.com`;
    await createUser(email, "password123", "admin");
    const token = await loginToken(email, "password123");
    const response = await SELF.fetch("https://example.com/api/auth/recover-admin-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminToken: "secret", email, password: "password456" })
    });

    expect(response.status).toBe(200);
    expect(await loginStatus(email, "password123")).toBe(401);
    expect(await loginStatus(email, "password456")).toBe(200);
    expect(await meStatus(token)).toBe(401);
  });

  it("does not recover a non-admin password", async () => {
    const email = `user-recover-${crypto.randomUUID()}@example.com`;
    await createUser(email, "password123", "user");
    const response = await SELF.fetch("https://example.com/api/auth/recover-admin-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminToken: "secret", email, password: "password456" })
    });

    expect(response.status).toBe(404);
    expect(await loginStatus(email, "password123")).toBe(200);
    expect(await loginStatus(email, "password456")).toBe(401);
  });

  it("rejects admin password recovery with the wrong admin token", async () => {
    const email = `wrong-recover-${crypto.randomUUID()}@example.com`;
    await createUser(email, "password123", "admin");
    const response = await SELF.fetch("https://example.com/api/auth/recover-admin-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminToken: "wrong-token", email, password: "password456" })
    });

    expect(response.status).toBe(401);
    expect(await loginStatus(email, "password123")).toBe(200);
    expect(await loginStatus(email, "password456")).toBe(401);
  });
});

async function createUser(email: string, password: string, role = "user") {
  const response = await SELF.fetch("https://example.com/api/users", {
    method: "POST",
    headers: { Authorization: "Bearer secret", "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: "Password User", password, role })
  });

  expect(response.status).toBe(201);
}

async function loginToken(email: string, password: string) {
  const response = await login(email, password);
  const payload = (await response.json()) as { data: { token: string } };

  return payload.data.token;
}

async function loginStatus(email: string, password: string) {
  return (await login(email, password)).status;
}

function login(email: string, password: string) {
  return SELF.fetch("https://example.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
}

async function meStatus(token: string) {
  const response = await SELF.fetch("https://example.com/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.status;
}
