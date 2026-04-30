import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createNodeSchema, failure, success, updateNodeSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { deleteGeneratedSubscriptionCaches } from "../subscribe/subscribe-cache";
import { listSubscribeTokenValues } from "../tokens/token.repository";
import { createManualNode, deleteNode, listNodeGroups, listNodes, updateNode } from "./node.repository";

export const nodeRoutes = new Hono<{ Bindings: Env }>();
const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

nodeRoutes.get("/", async (c) => {
  const nodes = await listNodes(c.env.DB);
  return c.json(success(listResponse(nodes)));
});

nodeRoutes.get("/groups", async (c) => {
  const groups = await listNodeGroups(c.env.DB);
  return c.json(success({ groups }));
});

nodeRoutes.post("/", zValidator("json", createNodeSchema), async (c) => {
  const node = await createManualNode(c.env.DB, c.req.valid("json"));

  if (!node) {
    return c.json(failure({ code: "NODE_PARSE_FAILED", message: "节点链接解析失败" }), 400);
  }

  await deleteAllSubscriptionCaches(c.env);
  return c.json(success(node), 201);
});

nodeRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateNodeSchema), async (c) => {
  const node = await updateNode(c.env.DB, c.req.valid("param").id, c.req.valid("json"));

  if (!node) {
    return c.json(failure({ code: "NODE_NOT_FOUND", message: "节点不存在" }), 404);
  }

  await deleteAllSubscriptionCaches(c.env);
  return c.json(success(node));
});

nodeRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const deleted = await deleteNode(c.env.DB, c.req.valid("param").id);

  if (!deleted) {
    return c.json(failure({ code: "NODE_NOT_FOUND", message: "节点不存在" }), 404);
  }

  await deleteAllSubscriptionCaches(c.env);
  return c.json(success({ id: c.req.valid("param").id }));
});

async function deleteAllSubscriptionCaches(env: Env) {
  const tokenValues = await listSubscribeTokenValues(env.DB);
  await deleteGeneratedSubscriptionCaches(env.KV, tokenValues);
}
