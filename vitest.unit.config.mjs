import { fileURLToPath, URL } from "node:url";

export default {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/web/src", import.meta.url))
    }
  },
  test: {
    include: ["tests/unit/**/*.test.ts"]
  }
};
