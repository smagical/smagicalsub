import { Hono } from "hono";
import { renderClashConfig } from "@smagicalsub/clash";
import type { Env } from "../env";

type TokenRow = {
  id: string;
  token: string;
  name: string;
  profile_id: string | null;
};

type NodeRow = {
  id: string;
  name: string;
  protocol: string;
  config_json: string;
};

export const subscribeRoutes = new Hono<{ Bindings: Env }>();

subscribeRoutes.get("/:token", async (c) => {
  const token = c.req.param("token");
  const cacheKey = `generated_sub:${token}`;
  const cached = await c.env.KV.get(cacheKey);

  if (cached) {
    return yaml(cached);
  }

  const tokenRow = await c.env.DB.prepare(
    `SELECT id, token, name, profile_id
     FROM subscribe_tokens
     WHERE token = ?1
       AND enabled = 1
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`
  )
    .bind(token)
    .first<TokenRow>();

  if (!tokenRow) {
    return new Response("Subscription token not found", { status: 404 });
  }

  const nodes = await c.env.DB.prepare(
    `SELECT id, name, protocol, config_json
     FROM nodes
     WHERE enabled = 1
     ORDER BY name ASC`
  ).all<NodeRow>();

  const body = renderClashConfig({
    profileName: tokenRow.name,
    nodes: nodes.results ?? []
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
