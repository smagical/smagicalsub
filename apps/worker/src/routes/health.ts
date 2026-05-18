import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { AppContext } from "../env";
import { countUsers } from "../modules/auth/user.repository";

export const healthRoutes = new Hono<AppContext>();

healthRoutes.get("/", async (c) => {
  const userCount = await countUsers(c.env.DB);

  return c.json(
    success({
      authRequired: userCount > 0 || Boolean(c.env.ADMIN_TOKEN?.trim()),
      status: "ok",
      env: c.env.APP_ENV ?? "unknown",
      timestamp: new Date().toISOString()
    })
  );
});
