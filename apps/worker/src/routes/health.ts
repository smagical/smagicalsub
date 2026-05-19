import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { AppContext } from "../env";
import { setupStatus } from "../modules/setup/setup.routes";

export const healthRoutes = new Hono<AppContext>();

healthRoutes.get("/", async (c) => {
  const setup = await setupStatus(c.env);

  return c.json(
    success({
      authRequired: setup.resources.adminUser || setup.resources.adminToken,
      bootstrapRequired: setup.bootstrapRequired,
      status: "ok",
      env: c.env.APP_ENV ?? "unknown",
      migrationsReady: setup.resources.migrations,
      setupAvailable: setup.available,
      timestamp: new Date().toISOString()
    })
  );
});
