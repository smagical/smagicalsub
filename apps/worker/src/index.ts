import { Hono } from "hono";
import { logger } from "hono/logger";
import type { Env } from "./env";
import { requireAdminToken } from "./middleware/admin-auth";
import { onError, notFound } from "./middleware/error";
import { accessLogRoutes } from "./modules/access-logs/access-log.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { healthRoutes } from "./routes/health";
import { nodeRoutes } from "./modules/nodes/node.routes";
import { profileRoutes } from "./modules/profiles/profile.routes";
import { sourceRoutes } from "./modules/sources/source.routes";
import { subscribeRoutes } from "./modules/subscribe/subscribe.routes";
import { tokenRoutes } from "./modules/tokens/token.routes";

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
