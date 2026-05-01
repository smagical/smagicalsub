import { Hono } from "hono";
import { logger } from "hono/logger";
import type { MiddlewareHandler } from "hono";
import { failure } from "@smagicalsub/shared";
import type { Env } from "./env";
import { onError, notFound } from "./middleware/error";
import { accessLogRoutes } from "./modules/access-logs/access-log.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { healthRoutes } from "./routes/health";
import { nodeRoutes } from "./modules/nodes/node.routes";
import { profileRoutes } from "./modules/profiles/profile.routes";
import { sourceRoutes } from "./modules/sources/source.routes";
import { subscribeRoutes } from "./modules/subscribe/subscribe.routes";
import { tokenRoutes } from "./modules/tokens/token.routes";

const requireAdminToken: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const expectedToken = c.env.ADMIN_TOKEN?.trim();

  if (!expectedToken) {
    await next();
    return;
  }

  // 生产环境只校验管理 API，公开订阅入口继续由订阅令牌保护。
  if (adminTokenFromRequest(c.req.header("Authorization"), c.req.header("X-Admin-Token")) !== expectedToken) {
    return c.json(failure({ code: "UNAUTHORIZED", message: "需要管理员令牌" }), 401);
  }

  await next();
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.route("/api/health", healthRoutes);
app.use("/api/*", requireAdminToken);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/sources", sourceRoutes);
app.route("/api/nodes", nodeRoutes);
app.route("/api/profiles", profileRoutes);
app.route("/api/tokens", tokenRoutes);
app.route("/api/logs", accessLogRoutes);
app.route("/sub", subscribeRoutes);

app.onError(onError);
app.notFound(notFound);

export default app;

function adminTokenFromRequest(authorization: string | undefined, headerToken: string | undefined) {
  if (headerToken?.trim()) {
    return headerToken.trim();
  }

  const [scheme, token] = authorization?.split(/\s+/, 2) ?? [];
  return scheme?.toLowerCase() === "bearer" ? token?.trim() : undefined;
}
