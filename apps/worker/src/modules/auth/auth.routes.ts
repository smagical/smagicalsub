import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bootstrapAdminSchema, failure, loginSchema, success } from "@smagicalsub/shared";
import type { AppContext } from "../../env";
import { bearerTokenFromRequest } from "../../middleware/admin-auth";
import { verifyPassword } from "./password";
import { createSession, deleteSessionByToken } from "./session.repository";
import { countUsers, createUser, findUserByEmail } from "./user.repository";

export const publicAuthRoutes = new Hono<AppContext>();
export const authRoutes = new Hono<AppContext>();

publicAuthRoutes.get("/status", async (c) => {
  const userCount = await countUsers(c.env.DB);

  return c.json(
    success({
      authRequired: userCount > 0 || Boolean(c.env.ADMIN_TOKEN?.trim()),
      bootstrapRequired: userCount === 0,
      bootstrapRequiresToken: Boolean(c.env.ADMIN_TOKEN?.trim())
    })
  );
});

publicAuthRoutes.post("/bootstrap", zValidator("json", bootstrapAdminSchema), async (c) => {
  if ((await countUsers(c.env.DB)) > 0) {
    return c.json(failure({ code: "BOOTSTRAP_CLOSED", message: "首个管理员已经创建" }), 409);
  }

  const input = c.req.valid("json");
  const expectedToken = c.env.ADMIN_TOKEN?.trim();

  if (expectedToken && input.bootstrapToken !== expectedToken) {
    return c.json(failure({ code: "UNAUTHORIZED", message: "初始化令牌不正确" }), 401);
  }

  const user = await createUser(c.env.DB, { ...input, role: "admin" });
  if (!user) {
    return c.json(failure({ code: "BOOTSTRAP_FAILED", message: "管理员创建失败" }), 500);
  }

  const session = await createSession(c.env.DB, user.id);

  return c.json(success({ ...session, user }), 201);
});

publicAuthRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const input = c.req.valid("json");
  const user = await findUserByEmail(c.env.DB, input.email);

  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    return c.json(failure({ code: "INVALID_CREDENTIALS", message: "邮箱或密码不正确" }), 401);
  }

  const session = await createSession(c.env.DB, user.id);
  return c.json(success({ ...session, user: { email: user.email, id: user.id, name: user.name, role: user.role } }));
});

publicAuthRoutes.post("/logout", async (c) => {
  const token = bearerTokenFromRequest(c.req.header("Authorization"));

  if (token) {
    await deleteSessionByToken(c.env.DB, token);
  }

  return c.json(success({ ok: true }));
});

authRoutes.get("/me", (c) => c.json(success(c.var.authUser)));
