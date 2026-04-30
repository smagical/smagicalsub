import { Hono } from "hono";
import { logger } from "hono/logger";
import type { Env } from "./env";
import { onError, notFound } from "./middleware/error";
import { dashboardRoutes } from "./routes/dashboard";
import { healthRoutes } from "./routes/health";
import { sourceRoutes } from "./routes/sources";
import { subscribeRoutes } from "./routes/subscribe";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.route("/api/health", healthRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/sources", sourceRoutes);
app.route("/sub", subscribeRoutes);

app.onError(onError);
app.notFound(notFound);

export default app;

