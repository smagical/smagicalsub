import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createProfileRuleSchema,
  createProfileSchema,
  failure,
  success,
  updateProfileRuleSchema,
  updateProfileSchema
} from "@smagicalsub/shared";
import { z } from "zod";
import type { AppContext } from "../../env";
import { ownerScope } from "../../lib/auth-scope";
import { listResponse } from "../../lib/list-response";
import { deleteGeneratedSubscriptionCache } from "../subscribe/subscribe-cache";
import { listSubscribeTokenValuesByProfileId } from "../tokens/token.repository";
import { deleteProfileSubscriptionCaches } from "./profile-cache";
import { createProfileRule, deleteProfileRule, listProfileRules, updateProfileRule } from "./profile-rule.repository";
import { createProfile, deleteProfile, findProfileById, listProfiles, updateProfile } from "./profile.repository";

export const profileRoutes = new Hono<AppContext>();
const idParamSchema = z.object({
  id: z.string().trim().min(1)
});
const ruleParamSchema = idParamSchema.extend({
  ruleId: z.string().trim().min(1)
});

profileRoutes.get("/", async (c) => {
  const profiles = await listProfiles(c.env.DB, ownerScope(c.var.authUser));
  return c.json(success(listResponse(profiles)));
});

profileRoutes.post("/", zValidator("json", createProfileSchema), async (c) => {
  const scope = ownerScope(c.var.authUser);
  const profile = await createProfile(c.env.DB, c.req.valid("json"), scope.ownerId);
  return c.json(success(profile), 201);
});

profileRoutes.get("/:id/rules", zValidator("param", idParamSchema), async (c) => {
  const profileId = c.req.valid("param").id;
  const scope = ownerScope(c.var.authUser);

  if (!(await findProfileById(c.env.DB, profileId, scope))) {
    return c.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), 404);
  }

  const rules = await listProfileRules(c.env.DB, profileId);
  return c.json(success(listResponse(rules)));
});

profileRoutes.post("/:id/rules", zValidator("param", idParamSchema), zValidator("json", createProfileRuleSchema), async (c) => {
  const profileId = c.req.valid("param").id;
  const scope = ownerScope(c.var.authUser);

  if (!(await findProfileById(c.env.DB, profileId, scope))) {
    return c.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), 404);
  }

  const rule = await createProfileRule(c.env.DB, profileId, c.req.valid("json"));
  await deleteProfileSubscriptionCaches(c.env, profileId, scope);

  return c.json(success(rule), 201);
});

profileRoutes.patch(
  "/:id/rules/:ruleId",
  zValidator("param", ruleParamSchema),
  zValidator("json", updateProfileRuleSchema),
  async (c) => {
    const { id, ruleId } = c.req.valid("param");
    const scope = ownerScope(c.var.authUser);

    if (!(await findProfileById(c.env.DB, id, scope))) {
      return c.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), 404);
    }

    const rule = await updateProfileRule(c.env.DB, id, ruleId, c.req.valid("json"));

    if (!rule) {
      return c.json(failure({ code: "PROFILE_RULE_NOT_FOUND", message: "配置档规则不存在" }), 404);
    }

    await deleteProfileSubscriptionCaches(c.env, id, scope);
    return c.json(success(rule));
  }
);

profileRoutes.delete("/:id/rules/:ruleId", zValidator("param", ruleParamSchema), async (c) => {
  const { id, ruleId } = c.req.valid("param");
  const scope = ownerScope(c.var.authUser);

  if (!(await findProfileById(c.env.DB, id, scope))) {
    return c.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), 404);
  }

  const deleted = await deleteProfileRule(c.env.DB, id, ruleId);

  if (!deleted) {
    return c.json(failure({ code: "PROFILE_RULE_NOT_FOUND", message: "配置档规则不存在" }), 404);
  }

  await deleteProfileSubscriptionCaches(c.env, id, scope);
  return c.json(success({ id: ruleId }));
});

profileRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateProfileSchema), async (c) => {
  const profileId = c.req.valid("param").id;
  const scope = ownerScope(c.var.authUser);
  const profile = await updateProfile(c.env.DB, profileId, c.req.valid("json"), scope);

  if (!profile) {
    return c.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), 404);
  }

  await deleteProfileSubscriptionCaches(c.env, profileId, scope);
  return c.json(success(profile));
});

profileRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const profileId = c.req.valid("param").id;
  const scope = ownerScope(c.var.authUser);
  const tokenValues = await listSubscribeTokenValuesByProfileId(c.env.DB, profileId, scope);
  const deleted = await deleteProfile(c.env.DB, profileId, scope);

  if (!deleted) {
    return c.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), 404);
  }

  await Promise.all(tokenValues.map((token) => deleteGeneratedSubscriptionCache(c.env.KV, token)));
  return c.json(success({ id: profileId }));
});
