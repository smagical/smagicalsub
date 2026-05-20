import { Hono } from "hono";
import { normalizeSubscriptionFormat, renderSubscription, type SubscriptionFormat } from "@smagicalsub/subscription";
import type { Env } from "../../env";
import { listEnabledRenderableNodesByIds } from "../nodes/node.repository";
import { listResolvedModulesForSubscription } from "../profile-modules/profile-module.repository";
import { listEnabledProfileRules } from "../profiles/profile-rule.repository";
import { findActiveSubscribeToken } from "../tokens/token.repository";
import { generatedSubscriptionCacheKey } from "./subscribe-cache";
import { recordSubscriptionMetric } from "./subscription-metrics.repository";

export const subscribeRoutes = new Hono<{ Bindings: Env }>();
type SubscriptionRequest = {
  path: string;
  header: (name: string) => string | undefined;
};

subscribeRoutes.get("/:token", async (c) => {
  const token = c.req.param("token");
  // 兼容不同客户端/转换器的查询习惯：format、target、type 都可指定输出格式。
  const format = normalizeSubscriptionFormat(c.req.query("format") ?? c.req.query("target") ?? c.req.query("type"));
  const tokenRow = await findActiveSubscribeToken(c.env.DB, token);

  if (!tokenRow) {
    return new Response("Subscription token not found", { status: 404 });
  }

  if (tokenRow.profile_id && (!tokenRow.profile_name || tokenRow.profile_enabled !== 1)) {
    c.executionCtx.waitUntil(recordSubscriptionAccess(c.env.DB, tokenRow, c.req, "blocked"));
    return new Response("Subscription profile not available", { status: 404 });
  }

  // 必须先校验令牌再读 KV，避免停用/删除后的 token 继续命中短期缓存。
  const cacheKey = generatedSubscriptionCacheKey(format, token);
  const cached = await c.env.KV.get(cacheKey);

  if (cached) {
    c.executionCtx.waitUntil(recordSubscriptionAccess(c.env.DB, tokenRow, c.req, "cached"));
    return subscriptionResponse(cached, format);
  }

  const nodes = await listEnabledRenderableNodesByIds(c.env.DB, tokenRow.owner_id, tokenRow.node_ids);
  const profileName = tokenRow.profile_name ?? tokenRow.name;
  const defaultStrategy = tokenRow.profile_default_strategy ?? "Proxy";
  const profileRules = tokenRow.profile_id ? await listEnabledProfileRules(c.env.DB, tokenRow.profile_id) : [];
  const modules = isModuleAwareFormat(format)
    ? await listResolvedModulesForSubscription({
        db: c.env.DB,
        format,
        moduleBindings: tokenRow.module_bindings,
        ownerId: tokenRow.owner_id,
        profileId: tokenRow.profile_id
      })
    : [];
  const body = renderSubscription({
    format,
    profileName,
    defaultStrategy,
    modules,
    profileRules,
    nodes
  });

  const ttl = Number(c.env.SUBSCRIPTION_CACHE_TTL_SECONDS ?? 300);
  await c.env.KV.put(cacheKey, body, {
    expirationTtl: Number.isFinite(ttl) ? ttl : 300
  });

  // 访问日志不阻塞订阅响应，失败也不影响客户端获取订阅内容。
  c.executionCtx.waitUntil(recordSubscriptionAccess(c.env.DB, tokenRow, c.req, "success"));

  return subscriptionResponse(body, format);
});

function recordSubscriptionAccess(
  db: D1Database,
  token: { id: string; owner_id: string | null },
  request: SubscriptionRequest,
  outcome: "blocked" | "cached" | "success"
) {
  return recordSubscriptionMetric(db, {
    ownerId: token.owner_id,
    outcome,
    path: request.path,
    request,
    tokenId: token.id
  });
}

function isModuleAwareFormat(format: SubscriptionFormat): format is "clash" | "sing-box" | "xray" {
  return format === "clash" || format === "sing-box" || format === "xray";
}

function subscriptionResponse(body: string, format: SubscriptionFormat) {
  return new Response(body, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": contentType(format)
    }
  });
}

function contentType(format: SubscriptionFormat) {
  switch (format) {
    case "clash":
      return "text/yaml; charset=utf-8";
    case "sing-box":
    case "xray":
      return "application/json; charset=utf-8";
    case "base64":
    case "plain":
      return "text/plain; charset=utf-8";
  }
}
