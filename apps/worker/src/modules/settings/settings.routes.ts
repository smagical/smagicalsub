import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { success, updateSiteSettingsSchema } from "@smagicalsub/shared";
import type { AppContext } from "../../env";
import { requireAdminRole } from "../../middleware/admin-auth";
import { getSiteSettings, updateSiteSettings } from "./settings.repository";

export const publicSettingsRoutes = new Hono<AppContext>();
export const settingsRoutes = new Hono<AppContext>();

publicSettingsRoutes.get("/", async (c) => {
  const settings = await getSiteSettings(c.env.KV);
  return c.json(success(settings));
});

settingsRoutes.use("*", requireAdminRole);

settingsRoutes.patch("/", zValidator("json", updateSiteSettingsSchema), async (c) => {
  const settings = await updateSiteSettings(c.env.KV, c.req.valid("json"));
  return c.json(success(settings));
});
