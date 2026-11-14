import { shopflowRequest, type Environment } from "../src/lib/shopflow/server";
// Generated only during the hosted build; no secrets are embedded.
// @ts-ignore The generated asset map lives outside tracked source.
import generatedAssets from "../outputs/worker-assets.json";
const assets: Record<string, {body: string; type: string}> = generatedAssets;
export default {
  async fetch(request: Request, env: Environment) {
    const url = new URL(request.url);
    if (url.pathname === "/api/shopflow") return shopflowRequest(request, env);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed", { status: 405 });
    const asset = assets[url.pathname === "/" ? "/index.html" : url.pathname];
    if (!asset) return new Response("Not found", { status: 404 });
    return new Response(request.method === "HEAD" ? null : asset.body, {
      headers: {
        "Content-Type": asset.type,
        "Cache-Control": url.pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  },
};
