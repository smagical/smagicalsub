import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createSubscriptionSourceSchema, success } from "@smagicalsub/shared";
import type { Env } from "../env";

type SourceRow = {
  id: string;
  name: string;
  url: string;
  enabled: number;
  last_status: string | null;
  last_error: string | null;
  last_fetched_at: string | null;
  created_at: string;
  updated_at: string;
};

export const sourceRoutes = new Hono<{ Bindings: Env }>();

sourceRoutes.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT id, name, url, enabled, last_status, last_error, last_fetched_at, created_at, updated_at
     FROM subscription_sources
     ORDER BY created_at DESC`
  ).all<SourceRow>();

  return c.json(success({ items: result.results ?? [] }));
});

sourceRoutes.post("/", zValidator("json", createSubscriptionSourceSchema), async (c) => {
  const input = c.req.valid("json");
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO subscription_sources (id, name, url, enabled)
     VALUES (?1, ?2, ?3, ?4)`
  )
    .bind(id, input.name, input.url, input.enabled ? 1 : 0)
    .run();

  return c.json(
    success({
      id,
      ...input
    }),
    201
  );
});
