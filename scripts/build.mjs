import {cpSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
// Resolve the locked npm dependency before touching an existing build.
const katexDist = dirname(require.resolve('katex'));
const staging = mkdtempSync(join(root, '.build-'));
try {
  cpSync(join(root, 'src'), staging, {recursive: true});
  const vendor = join(staging, 'vendor/katex');
  mkdirSync(join(vendor, 'contrib'), {recursive: true});
  for (const file of ['katex.mjs', 'katex.min.css', 'fonts']) {
    cpSync(join(katexDist, file), join(vendor, file), {recursive: true});
  }
  cpSync(join(katexDist, 'contrib/auto-render.mjs'), join(vendor, 'contrib/auto-render.mjs'));
  cpSync(join(katexDist, '../LICENSE'), join(vendor, 'LICENSE'));
  writeFileSync(join(staging, '.nojekyll'), '');
  // A fresh output directory cannot retain files removed from src or dependencies.
  rmSync(join(root, 'dist'), {recursive: true, force: true});
  renameSync(staging, join(root, 'dist'));
  console.log('Built dist/ from src/ and the locked KaTeX dependency.');
} finally {
  rmSync(staging, {recursive: true, force: true});
}
