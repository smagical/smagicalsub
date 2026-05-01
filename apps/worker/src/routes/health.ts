import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../env";

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get("/", (c) => {
  return c.json(
    success({
      authRequired: Boolean(c.env.ADMIN_TOKEN?.trim()),
      status: "ok",
      env: c.env.APP_ENV ?? "unknown",
      timestamp: new Date().toISOString()
    })
  );
});
