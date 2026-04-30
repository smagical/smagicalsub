import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../env";

type CountRow = {
  value: number;
};

export const dashboardRoutes = new Hono<{ Bindings: Env }>();

dashboardRoutes.get("/", async (c) => {
  const [sources, nodes, profiles, tokens] = await Promise.all([
    count(c.env.DB, "subscription_sources"),
    count(c.env.DB, "nodes"),
    count(c.env.DB, "profiles"),
    count(c.env.DB, "subscribe_tokens")
  ]);

  return c.json(
    success({
      totals: {
        sources,
        nodes,
        profiles,
        tokens
      },
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

async function count(db: D1Database, table: string) {
  const row = await db.prepare(`SELECT COUNT(*) AS value FROM ${table}`).first<CountRow>();
  return row?.value ?? 0;
}
