import type { MiddlewareHandler } from "hono";
import { failure } from "@smagicalsub/shared";
import type { Env } from "../env";

export const requireAdminToken: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const expectedToken = c.env.ADMIN_TOKEN?.trim();

  if (!expectedToken) {
    await next();
    return;
  }

  // 生产环境只校验管理 API，公开订阅入口继续由订阅令牌保护。
  if (!isAdminTokenAuthorized(expectedToken, c.req.header("Authorization"), c.req.header("X-Admin-Token"))) {
    return c.json(failure({ code: "UNAUTHORIZED", message: "需要管理员令牌" }), 401);
  }

  await next();
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

  const [scheme, token] = authorization?.split(/\s+/, 2) ?? [];
  return scheme?.toLowerCase() === "bearer" ? token?.trim() : undefined;
}
