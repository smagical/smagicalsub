import type { AuthUserDto, SessionDto } from "@smagicalsub/shared";
import { randomToken, sha256Base64Url } from "./password";
import { toAuthUser } from "./user.repository";

const sessionTtlSeconds = 60 * 60 * 24 * 30;
type SessionRow = Pick<SessionDto, "created_at" | "expires_at" | "id"> & { token_hash: string };
type DeleteUserSessionResult = "current" | "deleted" | "not-found";

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
  const tokenHash = await sessionTokenHash(token);
  const row = await db
    .prepare(
      `SELECT users.id, users.email, users.name, users.role
       FROM sessions
       INNER JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?1 AND sessions.expires_at > CURRENT_TIMESTAMP`
    )
    .bind(tokenHash)
    .first<AuthUserDto>();

  return row ? toAuthUser(row) : null;
}

export async function refreshSessionByToken(db: D1Database, token: string) {
  await db
    .prepare(
      `UPDATE sessions
       SET expires_at = ?1
       WHERE token_hash = ?2 AND expires_at > CURRENT_TIMESTAMP`
    )
    .bind(toSqlTimestamp(new Date(Date.now() + sessionTtlSeconds * 1000)), await sessionTokenHash(token))
    .run();
}

export async function listUserSessions(db: D1Database, userId: string, currentToken: string): Promise<SessionDto[]> {
  const currentHash = await sessionTokenHash(currentToken);
  const result = await db
    .prepare(
      `SELECT id, token_hash, expires_at, created_at
       FROM sessions
       WHERE user_id = ?1 AND expires_at > CURRENT_TIMESTAMP
       ORDER BY CASE WHEN token_hash = ?2 THEN 0 ELSE 1 END, created_at DESC`
    )
    .bind(userId, currentHash)
    .all<SessionRow>();

  // token_hash 只在 Worker 内部用于标记当前会话，不返回给前端。
  return (result.results ?? []).map((session) => toSessionDto(session, currentHash));
}

export async function deleteUserSession(
  db: D1Database,
  userId: string,
  sessionId: string,
  currentToken: string
): Promise<DeleteUserSessionResult> {
  const currentHash = await sessionTokenHash(currentToken);
  const session = await db
    .prepare(`SELECT token_hash FROM sessions WHERE id = ?1 AND user_id = ?2 AND expires_at > CURRENT_TIMESTAMP`)
    .bind(sessionId, userId)
    .first<{ token_hash: string }>();

  if (!session) {
    return "not-found";
  }

  // 后端兜底禁止删除当前会话，避免前端绕过按钮禁用后让用户自锁。
  if (session.token_hash === currentHash) {
    return "current";
  }

  await db.prepare(`DELETE FROM sessions WHERE id = ?1 AND user_id = ?2`).bind(sessionId, userId).run();
  return "deleted";
}

export async function deleteSessionByToken(db: D1Database, token: string) {
  await db.prepare(`DELETE FROM sessions WHERE token_hash = ?1`).bind(await sessionTokenHash(token)).run();
}

export async function deleteSessionsByUserId(db: D1Database, userId: string) {
  await db.prepare(`DELETE FROM sessions WHERE user_id = ?1`).bind(userId).run();
}

export async function deleteOtherSessionsByToken(db: D1Database, userId: string, token: string) {
  await db
    .prepare(`DELETE FROM sessions WHERE user_id = ?1 AND token_hash != ?2`)
    .bind(userId, await sha256Base64Url(token))
    .run();
}

export function sessionTokenHash(token: string) {
  return sha256Base64Url(token);
}

function toSqlTimestamp(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function toSessionDto(session: SessionRow, currentHash: string): SessionDto {
  return {
    created_at: session.created_at,
    current: session.token_hash === currentHash,
    expires_at: session.expires_at,
    id: session.id
  };
}
