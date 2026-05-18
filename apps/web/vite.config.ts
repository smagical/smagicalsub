import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react(), cloudflare()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("@tanstack/react-query")) {
            return "vendor-query";
          }

          if (id.includes("react") || id.includes("react-dom")) {
            return "vendor-react";
          }

          if (id.includes("radix-ui") || id.includes("lucide-react") || id.includes("sonner")) {
            return "vendor-ui";
          }

          return "vendor";
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
