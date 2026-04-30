export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  APP_ENV?: string;
  SUBSCRIPTION_CACHE_TTL_SECONDS?: string;
}

