import http from "node:http";
import { readFile } from "node:fs/promises";
import worker from "../dist/server/index.js";
// Optional local secrets are read without logging them.
try {
  for (const line of (await readFile(".env.local", "utf8")).split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]])
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
} catch {}
http
  .createServer(async (req, res) => {
    try {
      let body = "";
      for await (const part of req) {
        body += part;
        if (body.length > 200000) {
          res.writeHead(413);
          res.end();
          return;
        }
      }
      const result = await worker.fetch(
        new Request(`http://${req.headers.host}${req.url}`, {
          method: req.method,
          headers: req.headers,
          body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
        }),
        process.env,
      );
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end("Preview server error");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("ShopFlow worker preview: http://127.0.0.1:4173"),
  );
