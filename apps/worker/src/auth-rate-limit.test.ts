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

describe("auth rate limit", () => {
  it("limits repeated login failures for the same email and ip", async () => {
    const email = `limited-${crypto.randomUUID()}@example.com`;
    await createUser(email);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(await loginStatus(email, "wrong-password")).toBe(401);
    }

    expect(await loginStatus(email, "password123")).toBe(429);
    expect(await loginStatus(`other-${crypto.randomUUID()}@example.com`, "password123")).toBe(401);
  });
});

async function createUser(email: string) {
  const response = await SELF.fetch("https://example.com/api/users", {
    method: "POST",
    headers: { Authorization: "Bearer secret", "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: "Limited User", password: "password123", role: "user" })
  });

  expect(response.status).toBe(201);
}

async function loginStatus(email: string, password: string) {
  const response = await SELF.fetch("https://example.com/api/auth/login", {
    method: "POST",
    headers: { "CF-Connecting-IP": "203.0.113.10", "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  return response.status;
}
