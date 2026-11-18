// Builds the static web bundle used by Electron: ./dist-web
//   - TS/TSX are compiled to plain JS (file names are kept so import specifiers stay valid)
//   - index.html, vendor/ and CSS are copied as-is
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { compileTSModule } from './compiler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-web');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

function copyFile(rel) {
  const dest = path.join(out, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(root, rel), dest);
}

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else visit(full);
  }
}

copyFile('index.html');
walk(path.join(root, 'vendor'), (f) => copyFile(path.relative(root, f)));

let compiled = 0;
walk(path.join(root, 'src'), (file) => {
  const rel = path.relative(root, file);
  if (file.endsWith('.ts') || file.endsWith('.tsx')) {
    const js = compileTSModule(file);
    // Syntax sanity check (imports/exports stripped, V8 only parses it)
    new vm.Script(
      js
        .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '')
        .replace(/^\s*export\s+default\s+/gm, 'const __default = ')
        .replace(/^\s*export\s+/gm, ''),
      { filename: rel }
    );
    const dest = path.join(out, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, js, 'utf8');
    compiled++;
  } else {
    copyFile(rel);
  }
});

console.log(`dist-web ready: ${compiled} modules compiled -> ${out}`);
