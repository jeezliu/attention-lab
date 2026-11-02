import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join, relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function snapshot(dir, base = dir) {
  return Object.fromEntries(readdirSync(dir, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? Object.entries(snapshot(path, base)) :
      [[relative(base, path), createHash('sha256').update(readFileSync(path)).digest('hex')]];
  }));
}
const output = join(root, 'dist');
const first = snapshot(output);
for (const [file, hash] of Object.entries(snapshot(join(root, 'src')))) {
  assert.equal(first[file], hash, `Source must reach the build unchanged: ${file}`);
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', join(root, 'src', file)]);
}
writeFileSync(join(output, 'stale-file.txt'), 'This must not survive a rebuild.');
// Run outside the repository to catch accidental reliance on the caller's cwd.
execFileSync(process.execPath, [join(root, 'scripts/build.mjs')], {cwd: root + '..'});
assert.equal(existsSync(join(output, 'stale-file.txt')), false);
assert.deepEqual(snapshot(output), first, 'Repeated builds must have identical contents');
console.log(`PASS: deterministic clean build (${Object.keys(first).length} files), source parity and JS syntax.`);
