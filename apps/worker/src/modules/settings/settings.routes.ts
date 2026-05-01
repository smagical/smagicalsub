import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { success, updateSiteSettingsSchema } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { getSiteSettings, updateSiteSettings } from "./settings.repository";

export const publicSettingsRoutes = new Hono<{ Bindings: Env }>();
export const settingsRoutes = new Hono<{ Bindings: Env }>();

publicSettingsRoutes.get("/", async (c) => {
  const settings = await getSiteSettings(c.env.KV);
  return c.json(success(settings));
});

settingsRoutes.patch("/", zValidator("json", updateSiteSettingsSchema), async (c) => {
  const settings = await updateSiteSettings(c.env.KV, c.req.valid("json"));
  return c.json(success(settings));
});
