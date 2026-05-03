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
    const staleExpiry = sqlTimestamp(new Date(Date.now() + 60 * 60 * 1000));

    await setSessionExpiry(tokenHash, staleExpiry);
    const response = await SELF.fetch("https://example.com/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(response.status).toBe(200);
    expect(await sessionExpiry(tokenHash)).not.toBe(staleExpiry);
  });

  it("lists active sessions and revokes another session", async () => {
    const email = `sessions-${crypto.randomUUID()}@example.com`;
    await createUser(email);
    const currentToken = await loginToken(email);
    const otherToken = await loginToken(email);

    const sessions = await listSessions(currentToken);
    expect(sessions).toHaveLength(2);

    const currentSession = sessions.find((session) => session.current);
    const otherSession = sessions.find((session) => !session.current);
    expect(currentSession).toBeTruthy();
    expect(otherSession).toBeTruthy();

    expect(await deleteSessionStatus(currentToken, currentSession?.id ?? "")).toBe(409);
    expect(await deleteSessionStatus(currentToken, otherSession?.id ?? "")).toBe(200);
    expect(await meStatus(otherToken)).toBe(401);
    expect(await meStatus(currentToken)).toBe(200);
  });
});

type SessionListPayload = {
  data: {
    items: Array<{ current: boolean; id: string }>;
  };
};

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

async function listSessions(token: string) {
  const response = await SELF.fetch("https://example.com/api/auth/sessions", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = (await response.json()) as SessionListPayload;

  expect(response.status).toBe(200);
  return payload.data.items;
}

async function deleteSessionStatus(token: string, sessionId: string) {
  const response = await SELF.fetch(`https://example.com/api/auth/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.status;
}

async function meStatus(token: string) {
  const response = await SELF.fetch("https://example.com/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.status;
}

function sqlTimestamp(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
