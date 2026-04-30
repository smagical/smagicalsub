import { Hono } from "hono";
import { success } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { listResponse } from "../../lib/list-response";
import { listSubscribeTokens } from "./token.repository";

export const tokenRoutes = new Hono<{ Bindings: Env }>();

tokenRoutes.get("/", async (c) => {
  const tokens = await listSubscribeTokens(c.env.DB);
  return c.json(success(listResponse(tokens)));
});

