import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createSubscriptionSourceSchema, failure, success, updateSubscriptionSourceSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { deleteGeneratedSubscriptionCaches } from "../subscribe/subscribe-cache";
import { listSubscribeTokenValues } from "../tokens/token.repository";
import { createSource, deleteSource, listSources, updateSource } from "./source.repository";
import { refreshEnabledSources, refreshSource } from "./source.service";

export const sourceRoutes = new Hono<{ Bindings: Env }>();
const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

sourceRoutes.get("/", async (c) => {
  const sources = await listSources(c.env.DB);
  return c.json(success(listResponse(sources)));
});

sourceRoutes.post("/", zValidator("json", createSubscriptionSourceSchema), async (c) => {
  const source = await createSource(c.env.DB, c.req.valid("json"));
  return c.json(success(source), 201);
});

sourceRoutes.post("/refresh", async (c) => {
  const result = await refreshEnabledSources(c.env);

  if (result.success > 0) {
    await deleteAllSubscriptionCaches(c.env);
  }

  return c.json(success(result));
});

sourceRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateSubscriptionSourceSchema), async (c) => {
  const source = await updateSource(c.env.DB, c.req.valid("param").id, c.req.valid("json"));

  if (!source) {
    return c.json(failure({ code: "SOURCE_NOT_FOUND", message: "订阅源不存在" }), 404);
  }

  await deleteAllSubscriptionCaches(c.env);
  return c.json(success(source));
});

sourceRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const deleted = await deleteSource(c.env.DB, c.req.valid("param").id);

  if (!deleted) {
    return c.json(failure({ code: "SOURCE_NOT_FOUND", message: "订阅源不存在" }), 404);
  }

  await deleteAllSubscriptionCaches(c.env);
  return c.json(success({ id: c.req.valid("param").id }));
});

sourceRoutes.post("/:id/refresh", zValidator("param", idParamSchema), async (c) => {
  const result = await refreshSource(c.env, c.req.valid("param").id);

  if (!result) {
    return c.json(failure({ code: "SOURCE_NOT_FOUND", message: "订阅源不存在" }), 404);
  }

  if (result.status === "failed") {
    return c.json(failure({ code: "SOURCE_REFRESH_FAILED", message: "订阅源刷新失败" }), 502);
  }

  await deleteAllSubscriptionCaches(c.env);
  return c.json(success(result));
});

async function deleteAllSubscriptionCaches(env: Env) {
  const tokenValues = await listSubscribeTokenValues(env.DB);
  await deleteGeneratedSubscriptionCaches(env.KV, tokenValues);
}
