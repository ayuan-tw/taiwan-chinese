import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createWorker, testing } from '../worker.mjs';
import { createDB } from './sqlite-d1.mjs';
import { TEST_OWNER_EMAIL } from './test-config.mjs';
const require = createRequire(import.meta.url);
const { createStore, memoryAdapter } = require('../../js/card-store.js');
const { createSync } = require('../../js/cloudflare-sync.js');
const ORIGIN = 'https://review.example';
const NOW = Date.parse('2026-10-06T00:00:00.000Z');
const DATE = new Date(NOW).toISOString();

// Real Worker request handling, validators, CAS SQL and SQLite transactions,
// real client/store code. Browser storage/cookies/network are emulated; no
// Google sign-in, Cloudflare runtime, IndexedDB, or real devices are exercised.
async function setup() {
  const DB = createDB();
  const worker = createWorker({ now: () => NOW, fetch: () => { throw Error('No identity network calls allowed'); } });
  const environment = { DB, SYNC_ENABLED: 'true', APP_ORIGIN: ORIGIN, GOOGLE_CLIENT_ID: '123-review.apps.googleusercontent.com', OWNER_EMAIL: TEST_OWNER_EMAIL, OWNER_SUB: 'review-owner' };
  const clients = [];
  for (let i = 0; i < 4; i++) {
    const token = testing.randomToken();
    await DB.prepare('INSERT INTO sessions (token_hash,owner_sub,email,persistent,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind(await testing.sha256(token), 'review-owner', TEST_OWNER_EMAIL, 1, NOW/1000, NOW/1000+3600).run();
    let loseAck = false;
    const env = { crypto, navigator: { onLine: true }, location: { origin: ORIGIN }, document: { visibilityState: 'visible', addEventListener() {} }, addEventListener() {}, console, setTimeout() { return 0; }, clearTimeout() {} };
    const fetch = async (path, options = {}) => {
      if (!env.navigator.onLine) throw Error('offline');
      const headers = new Headers(options.headers);
      headers.set('Cookie', testing.SESSION_COOKIE + '=' + token);
      headers.set('Sec-Fetch-Site', 'same-origin');
      if (options.method === 'POST') headers.set('Origin', ORIGIN);
      const response = await worker.fetch(new Request(ORIGIN + path, { ...options, headers }), environment);
      if (loseAck && path === '/api/sync' && response.ok) { loseAck = false; throw Error('Simulated lost response after server commit'); }
      return response;
    };
    const store = createStore({ env, adapter: memoryAdapter(), broadcast: false, now: () => DATE });
    await store.ready;
    const sync = createSync(store, { env, fetch, config: { enabled: true, provider: 'cloudflare', pollIntervalMs: 15000 } });
    await sync.ready;
    clients.push({ store, sync, env, loseNextAcknowledgement() { loseAck = true; } });
  }
  return { DB, clients };
}
async function converge(clients) {
  // Explicit transport rounds are deterministic and simulate open-app polls.
  for (let round = 0; round < 3; round++) await Promise.all(clients.map(client => client.sync.retry()));
}

test('four offline devices converge shared counters and preserve all conflicting card versions through actual Worker SQL', async () => {
  const { DB, clients } = await setup();
  try {
    const card = await clients[0].store.save({ word: '共通卡片', meaning: '最初' });
    await converge(clients);
    for (const client of clients) assert.equal(client.store.get(card.id).meaning, '最初');
    for (const [index, client] of clients.entries()) {
      client.env.navigator.onLine = false;
      await client.store.save({ ...client.store.get(card.id), meaning: '離線修改-' + index });
      await client.store.updateShared('device-' + index, [{ kind: 'study', id: 'study-quiz-runs', increment: index + 1 }, { kind: 'favorites', id: card.id, active: true }]);
    }
    for (const client of clients) client.env.navigator.onLine = true;
    await converge(clients);
    const stored = JSON.parse(DB.sqlite.prepare("SELECT data_json FROM documents WHERE kind='cards' AND id=?").get(card.id).data_json);
    for (const [index, client] of clients.entries()) {
      const record = client.store.get(card.id);
      assert.equal(record.meaning, '離線修改-' + index, 'each original local edit remains inspectable');
      if (record.meaning !== stored.meaning) assert.equal(record.conflict.remote.meaning, stored.meaning);
      assert.equal(Object.values(client.store.getShared('study', 'study-quiz-runs').counts).reduce((a, b) => a+b, 0), 10);
      assert.equal(Object.keys(client.store.getShared('favorites', card.id).adds).length, 4);
    }
    assert.equal(clients.filter(client => client.store.get(card.id).syncStatus === 'conflict').length, 3);
  } finally { DB.close(); }
});

test('lost write response is recovered by real immutable receipt without duplicating the revision', async () => {
  const { DB, clients } = await setup();
  try {
    const client = clients[0];
    client.env.navigator.onLine = false;
    const card = await client.store.save({ word: '未確認の保存' });
    client.loseNextAcknowledgement();
    client.env.navigator.onLine = true;
    await client.sync.retry();
    await converge(clients);
    assert.equal(client.store.get(card.id).syncStatus, 'synced');
    assert.equal(DB.sqlite.prepare("SELECT revision FROM documents WHERE kind='cards' AND id=?").get(card.id).revision, 1);
    assert.equal(DB.sqlite.prepare('SELECT count(*) AS n FROM operation_receipts WHERE id=?').get(card.id).n, 1);
  } finally { DB.close(); }
});
