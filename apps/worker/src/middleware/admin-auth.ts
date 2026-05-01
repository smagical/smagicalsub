import type { MiddlewareHandler } from "hono";
import { failure, type AuthUserDto } from "@smagicalsub/shared";
import type { AppContext } from "../env";
import { findUserBySessionToken, refreshSessionByToken } from "../modules/auth/session.repository";

const adminTokenUser: AuthUserDto = {
  id: "admin-token",
  email: "admin-token@local",
  name: "Admin Token",
  role: "admin"
};

export const requireAuth: MiddlewareHandler<AppContext> = async (c, next) => {
  const expectedToken = c.env.ADMIN_TOKEN?.trim();
  const requestToken = adminTokenFromRequest(c.req.header("Authorization"), c.req.header("X-Admin-Token"));

  if (expectedToken && requestToken === expectedToken) {
    c.set("authUser", adminTokenUser);
    await next();
    return;
  }

  if (requestToken) {
    const sessionUser = await findUserBySessionToken(c.env.DB, requestToken);

    if (sessionUser) {
      c.set("authUser", sessionUser);
      c.executionCtx.waitUntil(refreshSessionByToken(c.env.DB, requestToken));
      await next();
      return;
    }
  }

  return c.json(failure({ code: "UNAUTHORIZED", message: "需要登录" }), 401);
};

export const requireAdminRole: MiddlewareHandler<AppContext> = async (c, next) => {
  if (c.var.authUser.role !== "admin") {
    return c.json(failure({ code: "FORBIDDEN", message: "需要管理员权限" }), 403);
  }

  return next();
};

export function isAdminTokenAuthorized(
  expectedToken: string,
  authorization: string | undefined,
  headerToken: string | undefined
) {
  const normalizedExpected = expectedToken.trim();

  if (!normalizedExpected) {
    return true;
  }

  return adminTokenFromRequest(authorization, headerToken) === normalizedExpected;
}

export function adminTokenFromRequest(authorization: string | undefined, headerToken: string | undefined) {
  if (headerToken?.trim()) {
    return headerToken.trim();
  }

  return bearerTokenFromRequest(authorization);
}

export function bearerTokenFromRequest(authorization: string | undefined) {
  const [scheme, token] = authorization?.split(/\s+/, 2) ?? [];
  return scheme?.toLowerCase() === "bearer" ? token?.trim() : undefined;
}
