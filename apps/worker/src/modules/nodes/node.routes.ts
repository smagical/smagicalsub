import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createNodeSchema, failure, importNodesSchema, nodeBatchActionSchema, success, updateNodeSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { AppContext, Env } from "../../env";
import { ownerScope, type OwnerScope } from "../../lib/auth-scope";
import { listResponse } from "../../lib/list-response";
import { deleteGeneratedSubscriptionCaches } from "../subscribe/subscribe-cache";
import { listSubscribeTokenValues } from "../tokens/token.repository";
import {
  appendNodesGroups,
  deleteNodes,
  setNodesEnabled,
  setNodesGroups
} from "./node-batch.repository";
import {
  createManualNode,
  deleteNode,
  importManualNodes,
  listNodeGroups,
  listNodes,
  updateNode
} from "./node.repository";

export const nodeRoutes = new Hono<AppContext>();
const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

nodeRoutes.get("/", async (c) => {
  const nodes = await listNodes(c.env.DB, ownerScope(c.var.authUser));
  return c.json(success(listResponse(nodes)));
});

nodeRoutes.get("/groups", async (c) => {
  const groups = await listNodeGroups(c.env.DB, ownerScope(c.var.authUser));
  return c.json(success({ groups }));
});

nodeRoutes.post("/", zValidator("json", createNodeSchema), async (c) => {
  const scope = ownerScope(c.var.authUser);
  const result = await createManualNode(c.env.DB, c.req.valid("json"), scope.ownerId);

  if (!result) {
    return c.json(failure({ code: "NODE_PARSE_FAILED", message: "节点链接解析失败" }), 400);
  }

  await deleteAllSubscriptionCaches(c.env, scope);
  return c.json(success(result), result.deduped ? 200 : 201);
});

nodeRoutes.post("/import", zValidator("json", importNodesSchema), async (c) => {
  const input = c.req.valid("json");
  const scope = ownerScope(c.var.authUser);
  const imports = input.items.map((item) => ({
    enabled: input.enabled,
    groups: input.groups,
    line: item.line,
    uri: item.uri
  }));
  const result = await importManualNodes(c.env.DB, imports, scope.ownerId);

  if (result.created.length > 0 || result.deduped.length > 0) {
    await deleteAllSubscriptionCaches(c.env, scope);
  }

  return c.json(success({ total: input.items.length, ...result }), result.created.length > 0 || result.deduped.length > 0 ? 201 : 400);
});

nodeRoutes.post("/batch", zValidator("json", nodeBatchActionSchema), async (c) => {
  const input = c.req.valid("json");
  const scope = ownerScope(c.var.authUser);
  const affected = await applyNodeBatch(c.env.DB, input, scope);

  if (affected > 0) {
    await deleteAllSubscriptionCaches(c.env, scope);
  }

  return c.json(success({ affected }));
});

nodeRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateNodeSchema), async (c) => {
  const scope = ownerScope(c.var.authUser);
  const node = await updateNode(c.env.DB, c.req.valid("param").id, c.req.valid("json"), scope);

  if (node === undefined) {
    return c.json(failure({ code: "NODE_PARSE_FAILED", message: "节点链接解析失败" }), 400);
  }

  if (!node) {
    return c.json(failure({ code: "NODE_NOT_FOUND", message: "节点不存在" }), 404);
  }

  await deleteAllSubscriptionCaches(c.env, scope);
  return c.json(success(node));
});

nodeRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const scope = ownerScope(c.var.authUser);
  const deleted = await deleteNode(c.env.DB, c.req.valid("param").id, scope);

  if (deleted.status === "not-found") {
    return c.json(failure({ code: "NODE_NOT_FOUND", message: "节点不存在" }), 404);
  }

  if (deleted.status === "source-owned") {
    return c.json(failure({ code: "NODE_SOURCE_OWNED", message: "订阅源节点不能直接删除，请删除订阅源或刷新来源" }), 409);
  }

  await deleteAllSubscriptionCaches(c.env, scope);
  return c.json(success({ id: c.req.valid("param").id, status: deleted.status }));
});

async function deleteAllSubscriptionCaches(env: Env, scope: OwnerScope) {
  const tokenValues = await listSubscribeTokenValues(env.DB, scope);
  await deleteGeneratedSubscriptionCaches(env.KV, tokenValues);
}

async function applyNodeBatch(db: D1Database, input: z.infer<typeof nodeBatchActionSchema>, scope: OwnerScope) {
  switch (input.action) {
    case "enable":
      return setNodesEnabled(db, input.ids, true, scope);
    case "disable":
      return setNodesEnabled(db, input.ids, false, scope);
    case "delete":
      return deleteNodes(db, input.ids, scope);
    case "set-groups":
      return setNodesGroups(db, input.ids, input.groups ?? [], scope);
    case "append-groups":
      return appendNodesGroups(db, input.ids, input.groups ?? [], scope);
  }

  return 0;
}
