import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { AppContext } from "../../env";
import { ownerScope } from "../../lib/auth-scope";
import { listResponse } from "../../lib/list-response";
import { listAccessLogs } from "./access-log.repository";

export const accessLogRoutes = new Hono<AppContext>();

accessLogRoutes.get("/", async (c) => {
  const logs = await listAccessLogs(c.env.DB, ownerScope(c.var.authUser));
  return c.json(success(listResponse(logs)));
});
