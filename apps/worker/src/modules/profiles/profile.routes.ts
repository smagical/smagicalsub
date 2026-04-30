import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createProfileSchema, failure, success, updateProfileSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { deleteGeneratedSubscriptionCache } from "../subscribe/subscribe-cache";
import { listSubscribeTokenValuesByProfileId } from "../tokens/token.repository";
import { createProfile, deleteProfile, listProfiles, updateProfile } from "./profile.repository";

export const profileRoutes = new Hono<{ Bindings: Env }>();
const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

profileRoutes.get("/", async (c) => {
  const profiles = await listProfiles(c.env.DB);
  return c.json(success(listResponse(profiles)));
});

profileRoutes.post("/", zValidator("json", createProfileSchema), async (c) => {
  const profile = await createProfile(c.env.DB, c.req.valid("json"));
  return c.json(success(profile), 201);
});

profileRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateProfileSchema), async (c) => {
  const profileId = c.req.valid("param").id;
  const profile = await updateProfile(c.env.DB, profileId, c.req.valid("json"));

  if (!profile) {
    return c.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), 404);
  }

  await deleteProfileSubscriptionCaches(c.env, profileId);
  return c.json(success(profile));
});

profileRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const profileId = c.req.valid("param").id;
  const tokenValues = await listSubscribeTokenValuesByProfileId(c.env.DB, profileId);
  const deleted = await deleteProfile(c.env.DB, profileId);

  if (!deleted) {
    return c.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), 404);
  }

  await Promise.all(tokenValues.map((token) => deleteGeneratedSubscriptionCache(c.env.KV, token)));
  return c.json(success({ id: profileId }));
});

async function deleteProfileSubscriptionCaches(env: Env, profileId: string) {
  const tokenValues = await listSubscribeTokenValuesByProfileId(env.DB, profileId);
  await Promise.all(tokenValues.map((token) => deleteGeneratedSubscriptionCache(env.KV, token)));
}
