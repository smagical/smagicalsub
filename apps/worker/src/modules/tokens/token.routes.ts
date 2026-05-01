import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createSubscribeTokenSchema, failure, success, updateSubscribeTokenSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { AppContext } from "../../env";
import { ownerScope, type OwnerScope } from "../../lib/auth-scope";
import { listResponse } from "../../lib/list-response";
import { findProfileById } from "../profiles/profile.repository";
import { deleteGeneratedSubscriptionCache } from "../subscribe/subscribe-cache";
import {
  createSubscribeToken,
  deleteSubscribeToken,
  listSubscribeTokens,
  resetSubscribeToken,
  updateSubscribeToken
} from "./token.repository";

export const tokenRoutes = new Hono<AppContext>();
const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

tokenRoutes.get("/", async (c) => {
  const tokens = await listSubscribeTokens(c.env.DB, ownerScope(c.var.authUser));
  return c.json(success(listResponse(tokens)));
});

tokenRoutes.post("/", zValidator("json", createSubscribeTokenSchema), async (c) => {
  const input = c.req.valid("json");
  const scope = ownerScope(c.var.authUser);
  const invalidProfile = await validateProfileBinding(c.env.DB, input.profile_id, scope);

  if (invalidProfile) {
    return invalidProfile;
  }

  const token = await createSubscribeToken(c.env.DB, input, scope.ownerId);
  return c.json(success(token), 201);
});

tokenRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateSubscribeTokenSchema), async (c) => {
  const input = c.req.valid("json");
  const scope = ownerScope(c.var.authUser);
  const invalidProfile = await validateProfileBinding(c.env.DB, input.profile_id, scope);

  if (invalidProfile) {
    return invalidProfile;
  }

  const token = await updateSubscribeToken(c.env.DB, c.req.valid("param").id, input, scope);

  if (!token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCache(c.env.KV, token.token);
  return c.json(success(token));
});

tokenRoutes.post("/:id/reset", zValidator("param", idParamSchema), async (c) => {
  const result = await resetSubscribeToken(c.env.DB, c.req.valid("param").id, ownerScope(c.var.authUser));

  if (!result?.token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCache(c.env.KV, result.oldToken);
  return c.json(success(result.token));
});

tokenRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const token = await deleteSubscribeToken(c.env.DB, c.req.valid("param").id, ownerScope(c.var.authUser));

  if (!token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCache(c.env.KV, token.token);
  return c.json(success({ id: token.id }));
});

async function validateProfileBinding(db: D1Database, profileId: string | null | undefined, scope: OwnerScope) {
  if (!profileId) {
    return null;
  }

  const profile = await findProfileById(db, profileId, scope);

  if (!profile) {
    return Response.json(failure({ code: "PROFILE_NOT_FOUND", message: "配置档不存在" }), { status: 404 });
  }

  return null;
}
