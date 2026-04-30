import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createSubscriptionSourceSchema, success } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { createSource, listSources } from "./source.repository";

export const sourceRoutes = new Hono<{ Bindings: Env }>();

sourceRoutes.get("/", async (c) => {
  const sources = await listSources(c.env.DB);
  return c.json(success(listResponse(sources)));
});

sourceRoutes.post("/", zValidator("json", createSubscriptionSourceSchema), async (c) => {
  const source = await createSource(c.env.DB, c.req.valid("json"));
  return c.json(success(source), 201);
});

