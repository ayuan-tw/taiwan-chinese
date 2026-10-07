// Copy only public application assets, never the repository or server directory.
import { readdir, lstat, mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { testing } from './worker.mjs';
const project = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tag=process.env.CHENGCI_BUILD_TAG || '';
if(tag && !/^[a-z0-9-]{1,80}$/.test(tag))throw new Error('Invalid isolated build tag');
const destination = fileURLToPath(new URL('./public'+(tag?'-'+tag:'')+'/', import.meta.url));
const rootFiles = ['index.html', 'manifest.json', 'service-worker.js', 'version.json', 'CHANGELOG.md', 'sync-config.js'];
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const copied = [];
async function copy(relative) {
  const source = join(project, relative); let stat;
  try { stat = await lstat(source); } catch (error) { if (error.code === 'ENOENT' && /config\.js$/.test(relative)) return; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink() || !testing.isPublicAsset('/' + relative)) throw new Error('Non-public or symbolic asset: ' + relative);
  await mkdir(resolve(destination, relative, '..'), { recursive: true });
  await copyFile(source, join(destination, relative)); copied.push(relative);
}
for (const file of rootFiles) await copy(file);
for (const directory of ['js', 'css', 'data', 'assets']) for (const entry of await readdir(join(project, directory), { withFileTypes: true })) {
  const relative = directory + '/' + entry.name;
  if (entry.isFile() && testing.isPublicAsset('/' + relative)) await copy(relative);
  else if (entry.isSymbolicLink()) throw new Error('Symbolic asset is not allowed: ' + relative);
}
const revisions = {};
for (const relative of copied.sort()) {
  if (relative === 'service-worker.js' || relative === 'asset-revisions.json') continue;
  revisions['./' + relative] = createHash('sha256').update(await readFile(join(destination, relative))).digest('hex');
}
revisions['./'] = revisions['./index.html'];
await writeFile(join(destination, 'asset-revisions.json'), JSON.stringify(revisions, null, 2) + '\n');
console.log(`Prepared ${copied.length} public assets plus SHA-256 revision manifest in cloudflare/public. No provider resources were created or deployed.`);
