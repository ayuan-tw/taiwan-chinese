import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createWorker,testing} from '../worker.mjs';

test('Pages Direct Upload package is module-worker compatible and excludes private source trees',async()=>{
  const tag='pages-test-'+process.pid;
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('../build-pages.mjs',import.meta.url))],{encoding:'utf8',env:{...process.env,CHENGCI_BUILD_TAG:tag}});
  assert.equal(result.status,0,result.stderr);
  const base=new URL('../pages-public-'+tag+'/',import.meta.url);
  assert.equal(await readFile(new URL('_worker.js',base),'utf8'),await readFile(new URL('../worker.mjs',import.meta.url),'utf8'));
  assert.deepEqual(JSON.parse(await readFile(new URL('_routes.json',base),'utf8')),{version:1,include:['/*'],exclude:[]});
  for(const forbidden of ['cloudflare','docs','tests','.git','.env','wrangler.jsonc','migrations'])assert.ok(!(await readdir(base)).includes(forbidden));
  const hashes=JSON.parse(await readFile(new URL('asset-revisions.json',base),'utf8'));
  assert.ok(!hashes['./_worker.js']);assert.ok(!hashes['./_routes.json']);
  assert.ok(!testing.isPublicAsset('/_worker.js'));assert.ok(!testing.isPublicAsset('/_routes.json'));
  const worker=createWorker();const calls=[];
  const env={SYNC_ENABLED:'false',ASSETS:{fetch:async request=>{calls.push(request);return new Response('<html>public offline shell</html>');}}};
  assert.equal((await worker.fetch(new Request('https://example.pages.dev/'),env)).status,200);
  assert.equal((await worker.fetch(new Request('https://example.pages.dev/_worker.js'),env)).status,404);
  assert.equal((await worker.fetch(new Request('https://example.pages.dev/_routes.json'),env)).status,404);
  assert.equal((await worker.fetch(new Request('https://example.pages.dev/api/cards'),env)).status,503);
  assert.equal(calls.length,1,'only allowlisted public assets reach the Pages ASSETS binding');
});
