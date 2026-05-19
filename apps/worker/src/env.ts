import type { AuthUserDto } from "@smagicalsub/shared";

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ADMIN_TOKEN?: string;
  APP_ENV?: string;
  APP_LOG_LEVEL?: "0" | "1" | "2" | "3" | string;
  SETUP_MODE?: "auto" | "disabled" | "enabled" | string;
  SUBSCRIPTION_CACHE_TTL_SECONDS?: string;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    authUser: AuthUserDto;
  };
};
