// Small local preview/test server. GitHub Pages serves the production build.
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(project, process.env.SITE_DIR || 'dist');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg'};

await stat(resolve(root, 'index.html')); // Fail promptly if build was skipped.
createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405).end(); return;
    }
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/attention-lab') {
      res.writeHead(301, {Location:'/attention-lab/'}).end(); return;
    }
    // Exercise the same relative URLs under the GitHub Pages project path.
    if (path.startsWith('/attention-lab/')) path = path.slice('/attention-lab'.length);
    const file = resolve(root, '.' + path, path.endsWith('/') ? 'index.html' : '');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, host, () => console.log(`Preview: http://${host}:${port}/attention-lab/`));
