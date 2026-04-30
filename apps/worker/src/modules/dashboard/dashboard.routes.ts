import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { getDashboardTotals, getRecentDashboardEvents } from "./dashboard.repository";

export const dashboardRoutes = new Hono<{ Bindings: Env }>();

dashboardRoutes.get("/", async (c) => {
  const [totals, recentEvents] = await Promise.all([getDashboardTotals(c.env.DB), getRecentDashboardEvents(c.env.DB)]);

  return c.json(
    success({
      totals,
      recentEvents
    })
  );
});
