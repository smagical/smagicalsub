import type { Context } from "hono";

type LogLevel = "error" | "info" | "warn";

const requestIds = new WeakMap<Context, string>();

export function requestId(c: Context) {
  const existing = requestIds.get(c);
  if (existing) {
    return existing;
  }

  const id = c.req.header("CF-Ray") ?? c.req.header("X-Request-ID") ?? crypto.randomUUID();
  requestIds.set(c, id);
  return id;
}

export function logEvent(c: Context, level: LogLevel, event: string, detail: Record<string, unknown> = {}) {
  const payload = {
    event,
    level,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    requestId: requestId(c),
    timestamp: new Date().toISOString(),
    ...detail
  };

  console[level](JSON.stringify(payload));
}

export function errorDetail(error: unknown) {
  if (error instanceof Error) {
    return {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack
    };
  }

  return {
    errorMessage: String(error),
    errorName: "UnknownError"
  };
}
