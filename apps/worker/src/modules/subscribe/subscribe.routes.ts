import { Hono } from "hono";
import { renderClashConfig } from "@smagicalsub/clash";
import type { Env } from "../../env";
import { listEnabledRenderableNodes } from "../nodes/node.repository";
import { findActiveSubscribeToken } from "../tokens/token.repository";

export const subscribeRoutes = new Hono<{ Bindings: Env }>();

subscribeRoutes.get("/:token", async (c) => {
  const token = c.req.param("token");
  const cacheKey = `generated_sub:${token}`;
  const cached = await c.env.KV.get(cacheKey);

  if (cached) {
    return yaml(cached);
  }

  const tokenRow = await findActiveSubscribeToken(c.env.DB, token);

  if (!tokenRow) {
    return new Response("Subscription token not found", { status: 404 });
  }

  const nodes = await listEnabledRenderableNodes(c.env.DB);
  const body = renderClashConfig({
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

  return yaml(body);
});

function yaml(body: string) {
  return new Response(body, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": "text/yaml; charset=utf-8"
    }
  });
}

