import { Hono } from "hono";
import { normalizeSubscriptionFormat, renderSubscription, type SubscriptionFormat } from "@smagicalsub/clash";
import type { Env } from "../../env";
import { listEnabledRenderableNodes } from "../nodes/node.repository";
import { findActiveSubscribeToken } from "../tokens/token.repository";

export const subscribeRoutes = new Hono<{ Bindings: Env }>();

subscribeRoutes.get("/:token", async (c) => {
  const token = c.req.param("token");
  const format = normalizeSubscriptionFormat(c.req.query("format") ?? c.req.query("target") ?? c.req.query("type"));
  const cacheKey = `generated_sub:${format}:${token}`;
  const cached = await c.env.KV.get(cacheKey);

  if (cached) {
    return subscriptionResponse(cached, format);
  }

  const tokenRow = await findActiveSubscribeToken(c.env.DB, token);

  if (!tokenRow) {
    return new Response("Subscription token not found", { status: 404 });
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

  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      `INSERT INTO access_logs (id, token_id, path, ip, user_agent)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
      .bind(
        crypto.randomUUID(),
        tokenRow.id,
        c.req.path,
        c.req.header("CF-Connecting-IP") ?? null,
        c.req.header("User-Agent") ?? null
      )
      .run()
  );

  return subscriptionResponse(body, format);
});

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
