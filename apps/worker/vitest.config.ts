import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: "./src/index.ts",
      miniflare: {
        compatibilityDate: "2026-04-29",
        compatibilityFlags: ["nodejs_compat"],
        bindings: {
          ADMIN_TOKEN: "secret",
          APP_ENV: "test",
          SUBSCRIPTION_CACHE_TTL_SECONDS: "300"
        },
        d1Databases: ["DB"],
        kvNamespaces: ["KV"]
      }
    })
  ],
  test: {
    include: ["../../tests/worker/**/*.test.ts"]
  }
});
