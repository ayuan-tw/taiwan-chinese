import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { testing } from '../worker.mjs';

test('asset build hashes exact public bytes and excludes server, docs, tests, credentials and itself', () => {
  const tag='assets-test-'+process.pid;
  const root = fileURLToPath(new URL('../../', import.meta.url));
  execFileSync(process.execPath, ['cloudflare/build-assets.mjs'], { cwd: root, env:{...process.env,CHENGCI_BUILD_TAG:tag} });
  const directory = join(root, 'cloudflare/public-'+tag);
  const manifest = JSON.parse(readFileSync(join(directory, 'asset-revisions.json'), 'utf8'));
  assert.equal(manifest['./'], manifest['./index.html']);
  assert.equal(manifest['./service-worker.js'], undefined); assert.equal(manifest['./asset-revisions.json'], undefined);
  assert.match(manifest['./manifest.json'], /^[a-f0-9]{64}$/);
  for (const [relative, hash] of Object.entries(manifest)) {
    const filename = relative === './' ? 'index.html' : relative.slice(2);
    assert.ok(testing.isPublicAsset('/' + filename));
    assert.equal(createHash('sha256').update(readFileSync(join(directory, filename))).digest('hex'), hash, relative);
  }
  const names = readdirSync(directory);
  for (const name of ['worker.mjs', 'cloudflare', 'tests', 'docs', '.git', '.env', 'wrangler.jsonc']) assert.equal(names.includes(name), false, name);
});
