import { Hono } from "hono";
import { logger } from "hono/logger";
import type { AppContext } from "./env";
import { requireAuth } from "./middleware/admin-auth";
import { onError, notFound } from "./middleware/error";
import { accessLogRoutes } from "./modules/access-logs/access-log.routes";
import { authRoutes, publicAuthRoutes } from "./modules/auth/auth.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { healthRoutes } from "./routes/health";
import { nodeRoutes } from "./modules/nodes/node.routes";
import { profileRoutes } from "./modules/profiles/profile.routes";
import { publicSettingsRoutes, settingsRoutes } from "./modules/settings/settings.routes";
import { sourceRoutes } from "./modules/sources/source.routes";
import { refreshDueSources } from "./modules/sources/source.service";
import { subscribeRoutes } from "./modules/subscribe/subscribe.routes";
import { tokenRoutes } from "./modules/tokens/token.routes";
import { userRoutes } from "./modules/users/user.routes";

const app = new Hono<AppContext>();

app.use("*", logger());
app.route("/api/health", healthRoutes);
app.route("/api/auth", publicAuthRoutes);
app.route("/api/site-settings", publicSettingsRoutes);
app.use("/api/*", requireAuth);
app.route("/api/auth", authRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/site-settings", settingsRoutes);
app.route("/api/sources", sourceRoutes);
app.route("/api/nodes", nodeRoutes);
app.route("/api/profiles", profileRoutes);
app.route("/api/tokens", tokenRoutes);
app.route("/api/users", userRoutes);
app.route("/api/logs", accessLogRoutes);
app.route("/sub", subscribeRoutes);

app.onError(onError);
app.notFound(notFound);

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(refreshDueSources(env));
  }
} satisfies ExportedHandler<AppContext["Bindings"]>;
