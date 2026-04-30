import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createSubscribeTokenSchema, failure, success, updateSubscribeTokenSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { deleteGeneratedSubscriptionCache } from "../subscribe/subscribe-cache";
import {
  createSubscribeToken,
  deleteSubscribeToken,
  listSubscribeTokens,
  resetSubscribeToken,
  updateSubscribeToken
} from "./token.repository";

export const tokenRoutes = new Hono<{ Bindings: Env }>();
const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

tokenRoutes.get("/", async (c) => {
  const tokens = await listSubscribeTokens(c.env.DB);
  return c.json(success(listResponse(tokens)));
});

tokenRoutes.post("/", zValidator("json", createSubscribeTokenSchema), async (c) => {
  const token = await createSubscribeToken(c.env.DB, c.req.valid("json"));
  return c.json(success(token), 201);
});

tokenRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateSubscribeTokenSchema), async (c) => {
  const token = await updateSubscribeToken(c.env.DB, c.req.valid("param").id, c.req.valid("json"));

  if (!token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCache(c.env.KV, token.token);
  return c.json(success(token));
});

tokenRoutes.post("/:id/reset", zValidator("param", idParamSchema), async (c) => {
  const result = await resetSubscribeToken(c.env.DB, c.req.valid("param").id);

  if (!result?.token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCache(c.env.KV, result.oldToken);
  return c.json(success(result.token));
});

tokenRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const token = await deleteSubscribeToken(c.env.DB, c.req.valid("param").id);

  if (!token) {
    return c.json(failure({ code: "TOKEN_NOT_FOUND", message: "订阅令牌不存在" }), 404);
  }

  await deleteGeneratedSubscriptionCache(c.env.KV, token.token);
  return c.json(success({ id: token.id }));
});
