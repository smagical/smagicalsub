import { Hono } from "hono";
import { normalizeSubscriptionFormat, renderSubscription, type SubscriptionFormat } from "@smagicalsub/clash";
import type { Env } from "../../env";
import { listEnabledRenderableNodes } from "../nodes/node.repository";
import { findActiveSubscribeToken, markSubscribeTokenUsed } from "../tokens/token.repository";
import { generatedSubscriptionCacheKey } from "./subscribe-cache";

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

  // 必须先校验令牌再读 KV，避免停用/删除后的 token 继续命中短期缓存。
  const cacheKey = generatedSubscriptionCacheKey(format, token);
  const cached = await c.env.KV.get(cacheKey);

  if (cached) {
    c.executionCtx.waitUntil(recordSubscriptionAccess(c.env.DB, tokenRow.id, c.req));
    return subscriptionResponse(cached, format);
  }

  const nodes = await listEnabledRenderableNodes(c.env.DB);
  const body = renderSubscription({
    format,
    profileName: tokenRow.name,
    nodes
  });

  const ttl = Number(c.env.SUBSCRIPTION_CACHE_TTL_SECONDS ?? 300);
  await c.env.KV.put(cacheKey, body, {
    expirationTtl: Number.isFinite(ttl) ? ttl : 300
  });

  // 访问日志不阻塞订阅响应，失败也不影响客户端获取订阅内容。
  c.executionCtx.waitUntil(recordSubscriptionAccess(c.env.DB, tokenRow.id, c.req));

  return subscriptionResponse(body, format);
});

function recordSubscriptionAccess(db: D1Database, tokenId: string, request: SubscriptionRequest) {
  return Promise.all([
    markSubscribeTokenUsed(db, tokenId),
    db
      .prepare(
        `INSERT INTO access_logs (id, token_id, path, ip, user_agent)
         VALUES (?1, ?2, ?3, ?4, ?5)`
      )
      .bind(
        crypto.randomUUID(),
        tokenId,
        request.path,
        request.header("CF-Connecting-IP") ?? null,
        request.header("User-Agent") ?? null
      )
      .run()
  ]);
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
      return "application/json; charset=utf-8";
    case "v2rayn":
    case "plain":
      return "text/plain; charset=utf-8";
  }
}
