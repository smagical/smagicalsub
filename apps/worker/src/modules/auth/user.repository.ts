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

export async function listUsers(db: D1Database) {
  const result = await db.prepare(`${userSelectSql} ORDER BY created_at DESC`).all<UserDto>();
  return result.results ?? [];
}

export async function findUserById(db: D1Database, id: string) {
  return db.prepare(`${userSelectSql} WHERE id = ?1`).bind(id).first<UserDto>();
}

export async function findUserByEmail(db: D1Database, email: string) {
  return db
    .prepare(`SELECT id, email, name, role, password_hash, created_at, updated_at FROM users WHERE lower(email) = lower(?1)`)
    .bind(email)
    .first<UserDto & { password_hash: string | null }>();
}

export async function createUser(db: D1Database, input: CreateUserInput) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO users (id, email, name, role, password_hash)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .bind(id, input.email.trim().toLowerCase(), input.name.trim(), input.role, await hashPassword(input.password))
    .run();

  return findUserById(db, id);
}

export async function updateUser(db: D1Database, id: string, input: UpdateUserInput) {
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
  await db
    .prepare(`UPDATE users SET password_hash = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2`)
    .bind(await hashPassword(password), id)
    .run();

  return findUserById(db, id);
}

export async function deleteUser(db: D1Database, id: string) {
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

const userSelectSql = `SELECT id, email, name, role, created_at, updated_at FROM users`;
