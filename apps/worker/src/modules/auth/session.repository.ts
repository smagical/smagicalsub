import type { AuthUserDto } from "@smagicalsub/shared";
import { randomToken, sha256Base64Url } from "./password";
import { toAuthUser } from "./user.repository";

const sessionTtlSeconds = 60 * 60 * 24 * 30;

export async function createSession(db: D1Database, userId: string) {
  const token = randomToken("sess");
  const tokenHash = await sha256Base64Url(token);
  const expiresAt = toSqlTimestamp(new Date(Date.now() + sessionTtlSeconds * 1000));

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at)
       VALUES (?1, ?2, ?3, ?4)`
    )
    .bind(crypto.randomUUID(), userId, tokenHash, expiresAt)
    .run();

  return { token, expiresAt };
}

export async function findUserBySessionToken(db: D1Database, token: string): Promise<AuthUserDto | null> {
  const row = await db
    .prepare(
      `SELECT users.id, users.email, users.name, users.role
       FROM sessions
       INNER JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?1 AND sessions.expires_at > CURRENT_TIMESTAMP`
    )
    .bind(await sha256Base64Url(token))
    .first<AuthUserDto>();

  return row ? toAuthUser(row) : null;
}

export async function deleteSessionByToken(db: D1Database, token: string) {
  await db.prepare(`DELETE FROM sessions WHERE token_hash = ?1`).bind(await sha256Base64Url(token)).run();
}

export async function deleteSessionsByUserId(db: D1Database, userId: string) {
  await db.prepare(`DELETE FROM sessions WHERE user_id = ?1`).bind(userId).run();
}

function toSqlTimestamp(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
