import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { compileTSModule } from './scripts/compiler.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 5173);

function resolveFilePath(urlPath) {
  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(__dirname, safePath);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }
  for (const ext of ['.tsx', '.ts', '.js', '.mjs']) {
    if (fs.existsSync(fullPath + ext) && fs.statSync(fullPath + ext).isFile()) {
      return fullPath + ext;
    }
  }
  return null;
}

function checkAllSources() {
  const srcDir = path.join(__dirname, 'src');
  if (!fs.existsSync(srcDir)) {
    console.log('No src directory yet.');
    return;
  }
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const js = compileTSModule(full);
        const syntaxTestable = js
          .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '')
          .replace(/^\s*export\s+default\s+/gm, 'const __default = ')
          .replace(/^\s*export\s+/gm, '');
        new vm.Script(syntaxTestable, { filename: full });
        console.log('✓ Compiled & Validated V8 JS:', path.relative(__dirname, full));
      }
    }
  };
  walk(srcDir);
  console.log('All TypeScript/TSX modules compiled cleanly!');
}

if (process.argv.includes('--check')) {
  checkAllSources();
  process.exit(0);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
    let pathname = reqUrl.pathname;
    if (pathname === '/') pathname = '/index.html';

    const resolved = resolveFilePath(pathname);
    if (!resolved) {
      // SPA fallback to index.html
      const indexHtml = path.join(__dirname, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(fs.readFileSync(indexHtml));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    if (resolved.endsWith('.ts') || resolved.endsWith('.tsx')) {
      const jsCode = compileTSModule(resolved);
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(jsCode);
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    res.end(fs.readFileSync(resolved));
  } catch (err) {
    console.error('Server error compiling/serving', req.url, err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(err?.stack || err));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`AppFlowy Daily Task Planner Dev Server running at http://localhost:${PORT}`);
});
