import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { listNodes } from "./node.repository";

export const nodeRoutes = new Hono<{ Bindings: Env }>();

nodeRoutes.get("/", async (c) => {
  const nodes = await listNodes(c.env.DB);
  return c.json(success(listResponse(nodes)));
});

