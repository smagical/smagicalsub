import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bootstrapAdminSchema, changePasswordSchema, failure, loginSchema, recoverAdminPasswordSchema, success } from "@smagicalsub/shared";
import { z } from "zod";
import type { AppContext } from "../../env";
import { listResponse } from "../../lib/list-response";
import { bearerTokenFromRequest } from "../../middleware/admin-auth";
import { setupReadyForBootstrap, setupStatus } from "../setup/setup.routes";
import { clearLoginFailures, loginRateLimitStatus, recordLoginFailure } from "./login-rate-limit";
import { verifyPassword } from "./password";
import {
  createSession,
  deleteOtherSessionsByToken,
  deleteSessionByToken,
  deleteSessionsByUserId,
  deleteUserSession,
  listUserSessions
} from "./session.repository";
import { createUser, deleteUserById, findUserByEmail, updateUserPassword } from "./user.repository";

export const publicAuthRoutes = new Hono<AppContext>();
export const authRoutes = new Hono<AppContext>();
const idParamSchema = z.object({ id: z.string().trim().min(1) });

publicAuthRoutes.get("/status", async (c) => {
  const status = await setupStatus(c.env);

  return c.json(
    success({
      authRequired: status.resources.adminUser || status.resources.adminToken,
      bootstrapRequired: status.bootstrapRequired,
      bootstrapRequiresToken: status.bootstrapRequiresToken
    })
  );
});

publicAuthRoutes.post("/bootstrap", zValidator("json", bootstrapAdminSchema), async (c) => {
  const status = await setupStatus(c.env);

  if (!status.bootstrapRequired) {
    return c.json(failure({ code: "BOOTSTRAP_CLOSED", message: "首个管理员已经创建" }), 409);
  }

  if (!setupReadyForBootstrap(status)) {
    return c.json(failure({ code: "SETUP_NOT_READY", message: "D1、KV 或 D1 迁移尚未完成，请重新检测后再初始化" }), 409);
  }

  const input = c.req.valid("json");
  const expectedToken = c.env.ADMIN_TOKEN?.trim();

  if (expectedToken && input.bootstrapToken !== expectedToken) {
    return c.json(failure({ code: "UNAUTHORIZED", message: "初始化令牌不正确" }), 401);
  }

  let user;

  try {
    user = await createUser(c.env.DB, { ...input, role: "admin" }, true);
    if (!user) {
      return c.json(failure({ code: "BOOTSTRAP_FAILED", message: "管理员创建失败" }), 500);
    }

    const session = await createSession(c.env.DB, user.id);

    return c.json(success({ ...session, user }), 201);
  } catch (error) {
    console.error("bootstrap failed", error);

    if (user?.id) {
      await deleteUserById(c.env.DB, user.id).catch((cleanupError) => console.error("bootstrap cleanup failed", cleanupError));
    }

    return c.json(failure({ code: "BOOTSTRAP_FAILED", message: bootstrapFailureMessage(error) }), 500);
  }
});

publicAuthRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const input = c.req.valid("json");
  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const rateLimit = await loginRateLimitStatus(c.env, input.email, ip);

  if (rateLimit.locked) {
    return c.json(failure({ code: "LOGIN_RATE_LIMITED", message: "登录失败次数过多，请稍后再试" }), 429);
  }

  const user = await findUserByEmail(c.env.DB, input.email);

  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    await recordLoginFailure(c.env, input.email, ip);
    return c.json(failure({ code: "INVALID_CREDENTIALS", message: "邮箱或密码不正确" }), 401);
  }

  await clearLoginFailures(c.env, input.email, ip);
  const session = await createSession(c.env.DB, user.id);
  return c.json(success({ ...session, user: { email: user.email, id: user.id, name: user.name, role: user.role } }));
});

publicAuthRoutes.post("/recover-admin-password", zValidator("json", recoverAdminPasswordSchema), async (c) => {
  const input = c.req.valid("json");
  const expectedToken = c.env.ADMIN_TOKEN?.trim();

  if (!expectedToken) {
    return c.json(failure({ code: "RECOVERY_DISABLED", message: "未配置管理员恢复令牌" }), 404);
  }

  if (input.adminToken !== expectedToken) {
    return c.json(failure({ code: "UNAUTHORIZED", message: "管理员恢复令牌不正确" }), 401);
  }

  const user = await findUserByEmail(c.env.DB, input.email);
  if (!user || user.role !== "admin") {
    return c.json(failure({ code: "ADMIN_NOT_FOUND", message: "管理员账号不存在" }), 404);
  }

  await updateUserPassword(c.env.DB, user.id, input.password);
  await deleteSessionsByUserId(c.env.DB, user.id);

  return c.json(success({ ok: true }));
});

publicAuthRoutes.post("/logout", async (c) => {
  const token = bearerTokenFromRequest(c.req.header("Authorization"));

  if (token) {
    await deleteSessionByToken(c.env.DB, token);
  }

  return c.json(success({ ok: true }));
});

authRoutes.get("/me", (c) => c.json(success(c.var.authUser)));

authRoutes.get("/sessions", async (c) => {
  const token = bearerTokenFromRequest(c.req.header("Authorization")) ?? "";
  const sessions = await listUserSessions(c.env.DB, c.var.authUser.id, token);
  return c.json(success(listResponse(sessions)));
});

authRoutes.delete("/sessions/:id", zValidator("param", idParamSchema), async (c) => {
  const result = await deleteUserSession(
    c.env.DB,
    c.var.authUser.id,
    c.req.valid("param").id,
    bearerTokenFromRequest(c.req.header("Authorization")) ?? ""
  );

  if (result === "current") {
    return c.json(failure({ code: "CURRENT_SESSION", message: "不能撤销当前会话" }), 409);
  }

  if (result === "not-found") {
    return c.json(failure({ code: "SESSION_NOT_FOUND", message: "会话不存在或已过期" }), 404);
  }

  return c.json(success({ id: c.req.valid("param").id }));
});

authRoutes.post("/password", zValidator("json", changePasswordSchema), async (c) => {
  const user = await findUserByEmail(c.env.DB, c.var.authUser.email);
  const input = c.req.valid("json");

  if (!user || !(await verifyPassword(input.currentPassword, user.password_hash))) {
    return c.json(failure({ code: "INVALID_CURRENT_PASSWORD", message: "当前密码不正确" }), 401);
  }

  await updateUserPassword(c.env.DB, user.id, input.newPassword);
  await deleteOtherSessionsByToken(c.env.DB, user.id, bearerTokenFromRequest(c.req.header("Authorization")) ?? "");

  return c.json(success({ ok: true }));
});

function bootstrapFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.toLowerCase().includes("unique")) {
    return "管理员邮箱已存在，请换一个邮箱或刷新初始化状态";
  }

  if (message.toLowerCase().includes("pbkdf2") || message.toLowerCase().includes("derive")) {
    return "密码哈希失败，请稍后重试或降低密码复杂度后再试";
  }

  return "管理员初始化失败，请查看 Cloudflare 部署日志";
}
