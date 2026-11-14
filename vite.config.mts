import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  define: { "process.env.NEXT_PUBLIC_PRACTICE_STATIC": JSON.stringify("true") },
  esbuild: { jsx: "automatic" },
  build: { outDir: "dist", emptyOutDir: true },
  server: { host: "127.0.0.1", port: 4173 },
});
