import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { listProfiles } from "./profile.repository";

export const profileRoutes = new Hono<{ Bindings: Env }>();

profileRoutes.get("/", async (c) => {
  const profiles = await listProfiles(c.env.DB);
  return c.json(success(listResponse(profiles)));
});

