// Servidor del portafolio Ink District
// Uso: node server.mjs [carpeta] [puerto]   →   http://localhost:5173  ·  panel: http://localhost:5173/admin/
//
// Además de mostrar la página, permite (solo desde este mismo computador):
//   GET  /api/content          lee data/content.json
//   PUT  /api/content          guarda data/content.json (y deja copia en data/backups/)
//   POST /api/upload?name=...  sube una imagen o video a assets/uploads/
import http from "http";
import fs from "fs";
import path from "path";

const root = path.resolve(process.argv[2] || "site");
const port = Number(process.env.PORT || process.argv[3] || 5173);
const contentFile = path.join(root, "data", "content.json");
const backupDir = path.join(root, "data", "backups");
const uploadDir = path.join(root, "assets", "uploads");
const MAX_BACKUPS = 30;
const UPLOAD_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".mp4", ".webm", ".mov"]);

const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
  ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".woff2": "font/woff2",
};

const isLocal = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
const sendJSON = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); };

function readBody(req, limit = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(new Error("too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function safeName(name) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, path.extname(name)).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "archivo";
  return { base, ext };
}

async function api(req, res, pathname, url) {
  if (!isLocal(req)) return sendJSON(res, 403, { error: "El panel solo funciona desde este computador." });

  if (pathname === "/api/content" && req.method === "GET") {
    return sendJSON(res, 200, JSON.parse(fs.readFileSync(contentFile, "utf8")));
  }

  if (pathname === "/api/content" && req.method === "PUT") {
    let data;
    try { data = JSON.parse(await readBody(req)); } catch { return sendJSON(res, 400, { error: "El contenido no es válido." }); }
    if (!data || !Array.isArray(data.secciones)) return sendJSON(res, 400, { error: "Falta la lista de secciones." });
    fs.mkdirSync(backupDir, { recursive: true });
    if (fs.existsSync(contentFile)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      fs.copyFileSync(contentFile, path.join(backupDir, `content-${stamp}.json`));
      const old = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json")).sort();
      old.slice(0, Math.max(0, old.length - MAX_BACKUPS)).forEach((f) => fs.unlinkSync(path.join(backupDir, f)));
    }
    const tmp = contentFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, contentFile);
    return sendJSON(res, 200, { ok: true });
  }

  if (pathname === "/api/upload" && req.method === "POST") {
    const { base, ext } = safeName(url.searchParams.get("name") || "");
    if (!UPLOAD_EXT.has(ext)) return sendJSON(res, 400, { error: `Formato no permitido (${ext || "sin extensión"}). Usa JPG, PNG, WEBP, GIF, MP4, WEBM o MOV.` });
    fs.mkdirSync(uploadDir, { recursive: true });
    let file = `${base}${ext}`, n = 1;
    while (fs.existsSync(path.join(uploadDir, file))) file = `${base}-${++n}${ext}`;
    const dest = path.join(uploadDir, file);
    const out = fs.createWriteStream(dest);
    req.pipe(out);
    out.on("finish", () => sendJSON(res, 200, { path: `assets/uploads/${file}` }));
    out.on("error", () => sendJSON(res, 500, { error: "No se pudo guardar el archivo." }));
    req.on("aborted", () => { out.destroy(); fs.rm(dest, () => {}); });
    return;
  }

  sendJSON(res, 404, { error: "Ruta desconocida" });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let p = decodeURIComponent(url.pathname);
  try {
    if (p.startsWith("/api/")) return await api(req, res, p, url);
  } catch (e) {
    console.error(e);
    return sendJSON(res, 500, { error: "Error del servidor" });
  }
  if (p === "/admin") { res.writeHead(301, { Location: "/admin/" }); return res.end(); }
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("404"); }
  const stat = fs.statSync(file);
  const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
  const headers = { "Content-Type": type, "Accept-Ranges": "bytes" };
  if (/\.(json|html|js|css)$/.test(file)) headers["Cache-Control"] = "no-store";
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = Number(s), end = e ? Number(e) : Math.min(start + 4 * 1024 * 1024, stat.size - 1);
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, "Content-Length": stat.size });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Portafolio en http://localhost:${port}  ·  Panel: http://localhost:${port}/admin/`));
