import type { Context } from "hono";
import type { AppContext } from "../env";

type LogLevel = "error" | "info" | "warn";
type AppLogLevel = 0 | 1 | 2 | 3;

const logLevelWeight: Record<LogLevel, AppLogLevel> = {
  error: 1,
  warn: 2,
  info: 3
};

const legacyLogLevels: Record<string, AppLogLevel> = {
  error: 1,
  info: 3,
  silent: 0,
  warn: 2
};

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

function appLogLevel(c: Context<AppContext>): AppLogLevel {
  const configuredLevel = c.env.APP_LOG_LEVEL?.trim().toLowerCase();
  if (configuredLevel === "0" || configuredLevel === "1" || configuredLevel === "2" || configuredLevel === "3") {
    return Number(configuredLevel) as AppLogLevel;
  }

  if (configuredLevel && configuredLevel in legacyLogLevels) {
    return legacyLogLevels[configuredLevel];
  }

  return 0;
}

export function logEvent(c: Context<AppContext>, level: LogLevel, event: string, detail: Record<string, unknown> = {}) {
  if (logLevelWeight[level] > appLogLevel(c)) {
    return;
  }

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
