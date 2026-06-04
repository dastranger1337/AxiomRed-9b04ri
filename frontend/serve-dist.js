/**
 * Lightweight static server for the Expo web export (./dist).
 * Serves files, gives index.html as fallback for client-side routing,
 * adds CORS headers, and supports HEAD/GET only.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map':  'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.txt':  'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const p = path.normalize(path.join(root, decoded));
  if (!p.startsWith(root)) return null;
  return p;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    ...headers,
  });
  res.end(body);
}

function streamFile(res, file) {
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return fallback(res);
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': st.size,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    });
    fs.createReadStream(file).pipe(res);
  });
}

function fallback(res) {
  const idx = path.join(ROOT, 'index.html');
  fs.readFile(idx, (err, buf) => {
    if (err) return send(res, 500, 'index.html missing');
    send(res, 200, buf, { 'Content-Type': MIME['.html'] });
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'method not allowed');
  }
  let urlPath = req.url || '/';
  if (urlPath === '/' || urlPath === '') return streamFile(res, path.join(ROOT, 'index.html'));

  const file = safeJoin(ROOT, urlPath);
  if (!file) return send(res, 400, 'bad path');

  fs.stat(file, (err, st) => {
    if (!err && st.isFile()) return streamFile(res, file);
    // Try with .html appended (Expo router static)
    const withHtml = file + '.html';
    fs.stat(withHtml, (e2, s2) => {
      if (!e2 && s2.isFile()) return streamFile(res, withHtml);
      // SPA fallback
      return fallback(res);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[serve-dist] serving ${ROOT} on http://${HOST}:${PORT}`);
});
