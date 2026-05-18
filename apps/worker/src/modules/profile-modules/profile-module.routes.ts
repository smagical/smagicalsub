import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createProfileModuleSchema, failure, success, updateProfileModuleSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { AppContext } from "../../env";
import { ownerScope } from "../../lib/auth-scope";
import { listResponse } from "../../lib/list-response";
import { findProfileById } from "../profiles/profile.repository";
import { deleteGeneratedSubscriptionCacheKeys } from "../subscribe/subscribe-cache";
import { listSubscribeTokenValues } from "../tokens/token.repository";
import { createProfileModule, deleteProfileModule, listProfileModules, updateProfileModule } from "./profile-module.repository";

export const profileModuleRoutes = new Hono<AppContext>();
const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

profileModuleRoutes.get("/", async (c) => {
  const modules = await listProfileModules(c.env.DB, ownerScope(c.var.authUser));
  return c.json(success(listResponse(modules)));
});

profileModuleRoutes.post("/", zValidator("json", createProfileModuleSchema), async (c) => {
  const input = c.req.valid("json");
  const scope = ownerScope(c.var.authUser);
  const invalidProfile = await validateProfileBinding(c.env.DB, profileBindingFor(input), scope);

  if (invalidProfile) {
    return invalidProfile;
  }

  const module = await createProfileModule(c.env.DB, input, scope.ownerId);
  await clearSubscriptionCaches(c.env, scope);

  return c.json(success(module), 201);
});

profileModuleRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateProfileModuleSchema), async (c) => {
  const input = c.req.valid("json");
  const scope = ownerScope(c.var.authUser);
  const invalidProfile = await validateProfileBinding(c.env.DB, profileBindingFor(input), scope);

  if (invalidProfile) {
    return invalidProfile;
  }

  const module = await updateProfileModule(c.env.DB, c.req.valid("param").id, input, scope);

  if (!module) {
    return c.json(failure({ code: "PROFILE_MODULE_NOT_FOUND", message: "配置模块不存在" }), 404);
  }

  await clearSubscriptionCaches(c.env, scope);
  return c.json(success(module));
});

profileModuleRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const scope = ownerScope(c.var.authUser);
  const module = await deleteProfileModule(c.env.DB, c.req.valid("param").id, scope);

  if (!module) {
    return c.json(failure({ code: "PROFILE_MODULE_NOT_FOUND", message: "配置模块不存在" }), 404);
  }

  await clearSubscriptionCaches(c.env, scope);
  return c.json(success({ id: module.id }));
});

async function validateProfileBinding(db: D1Database, profileId: string | null | undefined, scope: ReturnType<typeof ownerScope>) {
  if (!profileId) {
    return null;
  }

  const profile = await findProfileById(db, profileId, scope);

  if (!profile) {
    return Response.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), { status: 404 });
  }

  return null;
}

function profileBindingFor(input: { is_default?: boolean; profile_id?: string | null }) {
  return input.is_default ? null : input.profile_id;
}

async function clearSubscriptionCaches(env: AppContext["Bindings"], scope: ReturnType<typeof ownerScope>) {
  const tokenValues = await listSubscribeTokenValues(env.DB, scope);
  await deleteGeneratedSubscriptionCacheKeys(env.KV, tokenValues);
}
