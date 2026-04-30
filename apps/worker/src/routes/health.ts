import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../env";

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get("/", (c) => {
  return c.json(
    success({
      status: "ok",
      env: c.env.APP_ENV ?? "unknown",
      timestamp: new Date().toISOString()
    })
  );
});
