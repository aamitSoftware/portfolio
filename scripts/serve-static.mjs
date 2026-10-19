// Serves the Vercel build output (.vercel/output/static) the way Vercel does: clean URLs and the 404 page.
// The Vercel adapter has no `astro preview`, so tests and Lighthouse run against this instead.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = normalize(process.argv[2] ?? '.vercel/output/static');
const port = Number(process.argv[3] ?? 4322);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.json': 'application/json',
};

const resolve = (urlPath) => {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^[/\\]+/, '');
  for (const candidate of [clean, `${clean}.html`, join(clean, 'index.html')]) {
    const full = join(root, candidate);
    if (!full.startsWith(root)) return null;
    if (existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
};

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname;
  if (path.length > 1 && path.endsWith('/')) {
    res.writeHead(308, { Location: path.slice(0, -1) }).end();
    return;
  }
  const file = resolve(path);
  const target = file ?? join(root, '404.html');
  res.writeHead(file ? 200 : 404, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(res);
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
