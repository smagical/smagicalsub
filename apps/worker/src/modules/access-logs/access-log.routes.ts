import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { listAccessLogs } from "./access-log.repository";

export const accessLogRoutes = new Hono<{ Bindings: Env }>();

accessLogRoutes.get("/", async (c) => {
  const logs = await listAccessLogs(c.env.DB);
  return c.json(success(listResponse(logs)));
});
