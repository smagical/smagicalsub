import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { AppContext } from "../../env";
import { ownerScope } from "../../lib/auth-scope";
import { getDashboardTotals, getRecentDashboardEvents } from "./dashboard.repository";

export const dashboardRoutes = new Hono<AppContext>();

dashboardRoutes.get("/", async (c) => {
  const scope = ownerScope(c.var.authUser);
  const [totals, recentEvents] = await Promise.all([getDashboardTotals(c.env.DB, scope), getRecentDashboardEvents(c.env.DB, scope)]);

  return c.json(
    success({
      totals,
      recentEvents
    })
  );
});
