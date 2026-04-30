import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/db/src/schema.ts",
  out: "./apps/web/migrations",
  dialect: "sqlite",
  strict: true,
  verbose: true
});

