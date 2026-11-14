import { build } from "esbuild";
import {
  readdir,
  readFile,
  mkdir,
  writeFile,
  copyFile,
} from "node:fs/promises";
import path from "node:path";
const assets = {};
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "server" && entry.name !== ".openai") await walk(file);
      continue;
    }
    const type = file.endsWith(".html")
      ? "text/html; charset=utf-8"
      : file.endsWith(".js")
        ? "text/javascript; charset=utf-8"
        : file.endsWith(".css")
          ? "text/css; charset=utf-8"
          : "text/plain";
    assets["/" + path.relative("dist", file)] = {
      body: await readFile(file, "utf8"),
      type,
    };
  }
}
await walk("dist");
await mkdir("outputs", { recursive: true });
await writeFile("outputs/worker-assets.json", JSON.stringify(assets));
await build({
  entryPoints: ["worker/index.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
});
await mkdir("dist/.openai", { recursive: true });
await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
console.log(
  `Worker built with ${Object.keys(assets).length} assets and /api/shopflow.`,
);
