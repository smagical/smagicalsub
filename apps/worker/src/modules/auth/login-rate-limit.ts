import type { Env } from "../../env";
import { sha256Base64Url } from "./password";

const maxLoginFailures = 5;
const loginWindowSeconds = 15 * 60;
const lockSeconds = 15 * 60;

type LoginFailureState = {
  count: number;
  lockedUntil?: number;
};

export async function loginRateLimitStatus(env: Env, email: string, ip: string | null) {
  const state = await readFailureState(env, email, ip);
  const now = unixSeconds();

  return {
    locked: Boolean(state.lockedUntil && state.lockedUntil > now),
    retryAfter: state.lockedUntil && state.lockedUntil > now ? state.lockedUntil - now : 0
  };
}

export async function recordLoginFailure(env: Env, email: string, ip: string | null) {
  const state = await readFailureState(env, email, ip);
  const count = state.count + 1;
  const lockedUntil = count >= maxLoginFailures ? unixSeconds() + lockSeconds : state.lockedUntil;

  await env.KV.put(await rateLimitKey(email, ip), JSON.stringify({ count, lockedUntil }), {
    expirationTtl: lockedUntil ? lockSeconds : loginWindowSeconds
  });
}

export async function clearLoginFailures(env: Env, email: string, ip: string | null) {
  await env.KV.delete(await rateLimitKey(email, ip));
}

async function readFailureState(env: Env, email: string, ip: string | null): Promise<LoginFailureState> {
  const raw = await env.KV.get(await rateLimitKey(email, ip));

  if (!raw) {
    return { count: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LoginFailureState>;
    return { count: Number(parsed.count) || 0, lockedUntil: Number(parsed.lockedUntil) || undefined };
  } catch {
    return { count: 0 };
  }
}

async function rateLimitKey(email: string, ip: string | null) {
  const scope = `${email.trim().toLowerCase()}:${ip ?? "unknown"}`;
  return `auth:login-fail:${await sha256Base64Url(scope)}`;
}

function unixSeconds() {
  return Math.floor(Date.now() / 1000);
}
