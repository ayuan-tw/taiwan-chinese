const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const configuration = JSON.parse(read('cloudflare/wrangler.jsonc'));
const version = JSON.parse(read('version.json')).version;

test('activation changes the cache identity and every runtime asset reference together', () => {
  assert.equal(version, '6.12.0');
  const cacheName = 'chengci-v' + version.replaceAll('.', '-') + '-offline';
  assert.ok(read('service-worker.js').includes("const CACHE_NAME = '" + cacheName + "'"));
  assert.ok(read('service-worker.js').includes("const APP_VERSION = '" + version + "'"));
  assert.ok(read('js/app.js').includes("const CHENGCI_APP_VERSION = '" + version + "'"));
  assert.ok(read('js/app.js').includes("const currentCache='" + cacheName + "'"));
  for (const match of read('index.html').matchAll(/(?:src|href)="[^"?]+\?v=([^"]+)"/g)) assert.equal(match[1], version);
  const context = { window: {} }; vm.runInNewContext(read('sync-config.js'), context);
  assert.equal(context.window.CHENGCI_SYNC_CONFIG.enabled, true);
  assert.equal(context.window.CHENGCI_SYNC_CONFIG.provider, 'cloudflare');
});

test('approved public configuration still fails closed without a private owner secret', async () => {
  const { createWorker, testing } = await import('../cloudflare/worker.mjs');
  const { createDB } = await import('../cloudflare/tests/sqlite-d1.mjs');
  assert.deepEqual(Object.keys(configuration.vars).sort(), ['APP_ORIGIN', 'GOOGLE_CLIENT_ID', 'SYNC_ENABLED']);
  assert.equal(configuration.vars.GOOGLE_CLIENT_ID, '526792052093-3cpchc83orl8pb6rnadttl3n40gn0mei.apps.googleusercontent.com');
  const DB = createDB();
  try {
    const env = { ...configuration.vars, DB, ASSETS: { fetch: async () => new Response('public shell') } };
    const worker = createWorker({ fetch: async () => { throw Error('No Google call should occur before login'); } });
    const get = uri => worker.fetch(new Request(configuration.vars.APP_ORIGIN + uri), env);
    assert.equal(testing.config(env).enabled, false);
    assert.equal((await (await get('/api/config')).json()).enabled, false);
    assert.equal((await get('/api/cards')).status, 503);
    env.OWNER_EMAIL = 'owner@example.test';
    assert.equal(testing.config(env).enabled, true);
    assert.equal((await get('/api/cards')).status, 401, 'activation cannot expose records to anonymous readers');
    const login = await get('/auth/login'); assert.equal(login.status, 200);
    const html = await login.text();
    assert.ok(html.includes('data-client_id="' + configuration.vars.GOOGLE_CLIENT_ID + '"'));
    assert.ok(html.includes('data-login_uri="' + configuration.vars.APP_ORIGIN + '/auth/google"'));
    assert.doesNotMatch(html, /owner@example\.test|access_type|gmail|drive|client_secret/);
    assert.match(login.headers.get('Cache-Control'), /no-store/);
  } finally { DB.close(); }
});

for (const name of ['applyAppUpdate', 'refreshOfflineCache']) test(name + ' does not retire the new service worker cache from a still-running page', async () => {
  const source = read('js/app.js');
  const start = source.indexOf('async function ' + name + '(');
  const end = source.indexOf(name === 'applyAppUpdate' ? '\nasync function loadChangelog' : "\nif('serviceWorker' in navigator)", start);
  assert.ok(start > 0 && end > start);
  const cachedReleases = new Set(['chengci-v6-10-0-offline', 'chengci-v6-10-2-offline', 'future-release', 'another-app']);
  let filled = false;
  const cache = { addAll: async () => { filled = true; } };
  const caches = { keys: async () => [...cachedReleases], delete: async key => { cachedReleases.delete(key); }, open: async () => cache };
  const registration = { scope: 'https://chengci-owner-sync.ayuannoa.workers.dev/', update: async () => {}, waiting: { state: 'installed', postMessage() {} } };
  const context = { window: { caches }, caches, navigator: { serviceWorker: { getRegistrations: async () => [registration] } }, document: { getElementById: () => null }, setTimeout() {}, location: {}, setOfflineStatus() {}, setUpdateState() {}, showAppToast() {} };
  vm.runInNewContext(source.slice(start, end) + '; globalThis.runUpdate = ' + name, context);
  await context.runUpdate();
  assert.deepEqual([...cachedReleases], ['chengci-v6-10-0-offline', 'chengci-v6-10-2-offline', 'future-release', 'another-app']);
  if (name === 'refreshOfflineCache') assert.equal(filled, true);
});
