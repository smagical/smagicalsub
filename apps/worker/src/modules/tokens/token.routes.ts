import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createSubscribeTokenSchema, failure, success, updateSubscribeTokenSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { AppContext } from "../../env";
import { ownerScope, type OwnerScope } from "../../lib/auth-scope";
import { listResponse } from "../../lib/list-response";
import { countNodesByIds } from "../nodes/node.repository";
import { findProfileById } from "../profiles/profile.repository";
import { deleteGeneratedSubscriptionCacheKeys } from "../subscribe/subscribe-cache";
import {
  createSubscribeToken,
  deleteSubscribeToken,
  findSubscribeTokenPathConflict,
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
  const invalidNodes = await validateNodeScope(c.env.DB, input.node_ids, scope);

  if (invalidNodes) {
    return invalidNodes;
  }
  const pathConflict = await validateCustomPath(c.env.DB, input.custom_path);

  if (pathConflict) {
    return pathConflict;
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
  const invalidNodes = await validateNodeScope(c.env.DB, input.node_ids, scope);

  if (invalidNodes) {
    return invalidNodes;
  }
  const pathConflict = await validateCustomPath(c.env.DB, input.custom_path, c.req.valid("param").id);

  if (pathConflict) {
    return pathConflict;
  }

  const token = await updateSubscribeToken(c.env.DB, c.req.valid("param").id, input, scope);

  if (!token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCacheKeys(c.env.KV, [token.token, token.custom_path]);
  return c.json(success(token));
});

tokenRoutes.post("/:id/reset", zValidator("param", idParamSchema), async (c) => {
  const result = await resetSubscribeToken(c.env.DB, c.req.valid("param").id, ownerScope(c.var.authUser));

  if (!result?.token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCacheKeys(c.env.KV, [result.oldToken, result.oldCustomPath, result.token.token, result.token.custom_path]);
  return c.json(success(result.token));
});

tokenRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const token = await deleteSubscribeToken(c.env.DB, c.req.valid("param").id, ownerScope(c.var.authUser));

  if (!token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCacheKeys(c.env.KV, [token.token, token.custom_path]);
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

async function validateNodeScope(db: D1Database, nodeIds: string[] | undefined, scope: OwnerScope) {
  if (!nodeIds?.length) {
    return null;
  }

  const expectedCount = new Set(nodeIds).size;
  const actualCount = await countNodesByIds(db, nodeIds, scope);

  if (actualCount !== expectedCount) {
    return Response.json(failure({ code: "NODE_SCOPE_INVALID", message: "订阅节点范围包含不可用节点" }), { status: 404 });
  }

  return null;
}

async function validateCustomPath(db: D1Database, customPath: string | null | undefined, excludingId?: string) {
  if (!customPath?.trim()) {
    return null;
  }

  const conflictId = await findSubscribeTokenPathConflict(db, customPath.trim(), excludingId);

  if (conflictId) {
    return Response.json(failure({ code: "TOKEN_PATH_CONFLICT", message: "订阅路径已被其他令牌使用" }), { status: 409 });
  }

  return null;
}
