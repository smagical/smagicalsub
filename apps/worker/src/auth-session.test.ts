import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { sessionTokenHash } from "./modules/auth/session.repository";

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

describe("auth session", () => {
  it("refreshes an active session after authenticated requests", async () => {
    const email = `session-${crypto.randomUUID()}@example.com`;
    await createUser(email);
    const token = await loginToken(email);
    const tokenHash = await sessionTokenHash(token);
    const staleExpiry = "2026-05-02 00:00:00";

    await setSessionExpiry(tokenHash, staleExpiry);
    const response = await SELF.fetch("https://example.com/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(response.status).toBe(200);
    expect(await sessionExpiry(tokenHash)).not.toBe(staleExpiry);
  });
});

async function createUser(email: string) {
  const response = await SELF.fetch("https://example.com/api/users", {
    method: "POST",
    headers: { Authorization: "Bearer secret", "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: "Session User", password: "password123", role: "user" })
  });

  expect(response.status).toBe(201);
}

async function loginToken(email: string) {
  const response = await SELF.fetch("https://example.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" })
  });
  const payload = (await response.json()) as { data: { token: string } };

  return payload.data.token;
}

async function setSessionExpiry(tokenHash: string, expiresAt: string) {
  await testEnv.DB.prepare(`UPDATE sessions SET expires_at = ?1 WHERE token_hash = ?2`).bind(expiresAt, tokenHash).run();
}

async function sessionExpiry(tokenHash: string) {
  const row = await testEnv.DB.prepare(`SELECT expires_at FROM sessions WHERE token_hash = ?1`).bind(tokenHash).first<{ expires_at: string }>();
  return row?.expires_at;
}
