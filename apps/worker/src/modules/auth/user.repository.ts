import type { AuthUserDto, CreateUserInput, UpdateUserInput, UserDto, UserRole } from "@smagicalsub/shared";
import { hashPassword } from "./password";

export async function countUsers(db: D1Database) {
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM users`).first<{ count: number }>();
  return row?.count ?? 0;
}

export async function countAdmins(db: D1Database) {
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM users WHERE role = 'admin'`).first<{ count: number }>();
  return row?.count ?? 0;
}

export async function ensureUserProtectedColumn(db: D1Database) {
  await db.prepare(`ALTER TABLE users ADD COLUMN protected INTEGER NOT NULL DEFAULT 0`).run().catch(ignoreDuplicateColumn);
  await db
    .prepare(
      `UPDATE users
       SET protected = 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = (
         SELECT id FROM users
         WHERE role = 'admin'
         ORDER BY created_at ASC
         LIMIT 1
       )
       AND NOT EXISTS (
         SELECT 1 FROM users
         WHERE role = 'admin' AND protected = 1
       )`
    )
    .run();
}

export async function listUsers(db: D1Database) {
  await ensureUserProtectedColumn(db);
  const result = await db.prepare(`${userSelectSql} ORDER BY protected DESC, created_at DESC`).all<UserDto>();
  return result.results ?? [];
}

export async function findUserById(db: D1Database, id: string) {
  await ensureUserProtectedColumn(db);
  return db.prepare(`${userSelectSql} WHERE id = ?1`).bind(id).first<UserDto>();
}

export async function findUserByEmail(db: D1Database, email: string) {
  await ensureUserProtectedColumn(db);
  return db
    .prepare(`SELECT id, email, name, role, protected, password_hash, created_at, updated_at FROM users WHERE lower(email) = lower(?1)`)
    .bind(email)
    .first<UserDto & { password_hash: string | null }>();
}

export async function createUser(db: D1Database, input: CreateUserInput, protectedUser = false) {
  await ensureUserProtectedColumn(db);
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO users (id, email, name, role, protected, password_hash)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(id, input.email.trim().toLowerCase(), input.name.trim(), input.role, protectedUser ? 1 : 0, await hashPassword(input.password))
    .run();

  return findUserById(db, id);
}

export async function deleteUserById(db: D1Database, id: string) {
  await db.prepare(`DELETE FROM users WHERE id = ?1`).bind(id).run();
}

export async function updateUser(db: D1Database, id: string, input: UpdateUserInput) {
  await ensureUserProtectedColumn(db);
  const current = await findUserById(db, id);

  if (!current) {
    return null;
  }

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  await db
    .prepare(
      `UPDATE users
       SET email = ?1, name = ?2, role = ?3, password_hash = COALESCE(?4, password_hash), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?5`
    )
    .bind(
      input.email?.trim().toLowerCase() ?? current.email,
      input.name?.trim() ?? current.name,
      input.role ?? current.role,
      passwordHash ?? null,
      id
    )
    .run();

  return findUserById(db, id);
}

export async function updateUserPassword(db: D1Database, id: string, password: string) {
  await ensureUserProtectedColumn(db);
  await db
    .prepare(`UPDATE users SET password_hash = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2`)
    .bind(await hashPassword(password), id)
    .run();

  return findUserById(db, id);
}

export async function deleteUser(db: D1Database, id: string) {
  await ensureUserProtectedColumn(db);
  const current = await findUserById(db, id);

  if (!current) {
    return null;
  }

  await db.prepare(`DELETE FROM users WHERE id = ?1`).bind(id).run();
  return current;
}

export function toAuthUser(user: Pick<UserDto, "email" | "id" | "name" | "role">): AuthUserDto {
  return { email: user.email, id: user.id, name: user.name, role: user.role as UserRole };
}

const userSelectSql = `SELECT id, email, name, role, protected, created_at, updated_at FROM users`;

function ignoreDuplicateColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (!message.toLowerCase().includes("duplicate column")) {
    throw error;
  }
}
