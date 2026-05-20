import type { Context } from "hono";
import type { AppContext } from "../env";

type LogLevel = "error" | "info" | "warn";
type AppLogLevel = 0 | 1 | 2 | 3;
type CachedRuntimeLogLevel = {
  expiresAt: number;
  level: AppLogLevel;
};

const logLevelWeight: Record<LogLevel, AppLogLevel> = {
  error: 1,
  warn: 2,
  info: 3
};

const requestIds = new WeakMap<Context, string>();
let cachedRuntimeLogLevel: CachedRuntimeLogLevel | null = null;
const runtimeLogLevelTtlMs = 60_000;
const siteSettingsKey = "settings:site";

export function requestId(c: Context) {
  const existing = requestIds.get(c);
  if (existing) {
    return existing;
  }

  const id = c.req.header("CF-Ray") ?? c.req.header("X-Request-ID") ?? crypto.randomUUID();
  requestIds.set(c, id);
  return id;
}

export function logEvent(c: Context<AppContext>, level: LogLevel, event: string, detail: Record<string, unknown> = {}) {
  const write = (configuredLevel: AppLogLevel) => {
    if (logLevelWeight[level] > configuredLevel) {
      return;
    }

    writeLog(c, level, event, detail);
  };

  if (bootstrapLogEnabled(event, detail)) {
    write(3);
    return;
  }

  c.executionCtx.waitUntil(runtimeLogLevel(c.env.KV).then(write));
}

export function invalidateRuntimeLogLevelCache() {
  cachedRuntimeLogLevel = null;
}

function writeLog(c: Context<AppContext>, level: LogLevel, event: string, detail: Record<string, unknown>) {
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

async function runtimeLogLevel(kv: KVNamespace): Promise<AppLogLevel> {
  if (cachedRuntimeLogLevel && cachedRuntimeLogLevel.expiresAt > Date.now()) {
    return cachedRuntimeLogLevel.level;
  }

  const level = await kv
    .get(siteSettingsKey)
    .then((raw) => parseRuntimeLogLevel(raw))
    .catch(() => 0 as AppLogLevel);

  cachedRuntimeLogLevel = {
    expiresAt: Date.now() + runtimeLogLevelTtlMs,
    level
  };

  return level;
}

function parseRuntimeLogLevel(raw: string | null): AppLogLevel {
  if (!raw) {
    return 0;
  }

  try {
    const parsed = JSON.parse(raw) as { logLevel?: unknown };
    return normalizeLogLevel(parsed.logLevel);
  } catch {
    return 0;
  }
}

function normalizeLogLevel(value: unknown): AppLogLevel {
  return value === "1" || value === "2" || value === "3" ? Number(value) as AppLogLevel : 0;
}

function bootstrapLogEnabled(event: string, detail: Record<string, unknown>) {
  if (event === "setup.status") {
    return detail.bootstrapRequired === true;
  }

  if (!String(event).includes(".bootstrap.")) {
    return false;
  }

  if (event.endsWith(".closed") || (event.endsWith(".start") && detail.bootstrapRequired === false)) {
    return false;
  }

  return true;
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
