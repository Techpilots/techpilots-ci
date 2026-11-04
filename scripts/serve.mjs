// Minimal statisk server för en Next-export (output: "export"). Inga beroenden.
// Användning: node serve.mjs <mapp> <port>
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 4173);

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".xml": "application/xml",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".mp4": "video/mp4",
};

async function find(path) {
  const candidates = [path, `${path}.html`, join(path, "index.html")];
  for (const c of candidates) {
    try {
      if ((await stat(c)).isFile()) return c;
    } catch { /* prova nästa */ }
  }
  return null;
}

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const safe = normalize(join(root, url));
  if (!safe.startsWith(root)) { res.writeHead(403).end(); return; }
  const file = await find(safe);
  if (!file) {
    const nf = await find(join(root, "404"));
    res.writeHead(404, { "content-type": types[".html"] });
    res.end(nf ? await readFile(nf) : "Not found");
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
}).listen(port, () => console.log(`Serverar ${root} på http://localhost:${port}`));
