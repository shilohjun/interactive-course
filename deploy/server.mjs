import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Serves the built site from the directory this file sits in.
// Deploy layout: /opt/interactive-course/current/{index.html,assets,course,media,server.mjs}
const ROOT = resolve(process.env.DIST_ROOT ?? fileURLToPath(new URL(".", import.meta.url)));
const PORT = Number(process.env.PORT ?? 5174);
const HOST = process.env.HOST ?? "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
};

function cacheControl(filePath, type) {
  if (type.startsWith("text/html")) return "no-cache";
  const rel = filePath.slice(ROOT.length).split(sep).join("/");
  // Hashed Vite assets can be cached forever. Unhashed JSON (course.json,
  // meta, transcript) changes in place and must not be marked immutable.
  if (rel.startsWith("/assets/")) return "public, max-age=604800, immutable";
  if (type.startsWith("application/json")) return "no-cache";
  return "public, max-age=3600, must-revalidate";
}

function sendFile(response, filePath, stat) {
  const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const cache = cacheControl(filePath, type);
  response.writeHead(200, {
    "Content-Type": type,
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
    "Cache-Control": cache,
  });
  createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    const safe = normalize(pathname);
    let filePath = join(ROOT, safe);
    if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      // Hash routes never reach the server, but a missing extensionless path
      // should still land on the app shell.
      if (extname(filePath) === "") {
        filePath = join(ROOT, "index.html");
      } else {
        response.writeHead(404);
        response.end("not found");
        return;
      }
    }

    const stat = statSync(filePath);
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const start = match[1] ? Number.parseInt(match[1], 10) : 0;
        const end = match[2] ? Number.parseInt(match[2], 10) : stat.size - 1;
        if (start >= stat.size || end >= stat.size || start > end) {
          response.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
          response.end();
          return;
        }
        const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
        response.writeHead(206, {
          "Content-Type": type,
          "Content-Length": end - start + 1,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": cacheControl(filePath, type),
        });
        createReadStream(filePath, { start, end }).pipe(response);
        return;
      }
    }

    sendFile(response, filePath, stat);
  } catch (error) {
    response.writeHead(500);
    response.end("server error");
    console.error(error);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`interactive-course on http://${HOST}:${PORT} serving ${ROOT}`);
});
