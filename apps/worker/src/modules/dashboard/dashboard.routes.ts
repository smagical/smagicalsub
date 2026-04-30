import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { getDashboardTotals } from "./dashboard.repository";

export const dashboardRoutes = new Hono<{ Bindings: Env }>();

dashboardRoutes.get("/", async (c) => {
  const totals = await getDashboardTotals(c.env.DB);

  return c.json(
    success({
      totals,
      recentEvents: [
        {
          id: "worker-online",
          title: "Worker API 已连接",
          status: "success",
          time: new Date().toISOString()
        }
      ]
    })
  );
});

