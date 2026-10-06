const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { createStore, memoryAdapter } = require('../js/card-store.js');
const { createSync } = require('../js/cloudflare-sync.js');

// Transport-edge regressions discovered in an independent security review.
// No Google, Cloudflare, real cookies, or real browser is involved in these tests.
async function fixture(options = {}) {
  const server = { authenticated: true, failLogout: false, csrf: 'csrf-initial', logoutCalls: 0, writes: 0, failConfig: options.failConfig || 0, configCalls: 0, failPull: options.failPull || 0, hangWrites: false, hangBody: false, hangingSignal: null };
  const timers = new Map(); let next = 0;
  const env = { crypto: webcrypto, AbortController, navigator: { onLine: true }, location: { origin: 'https://review.example' },
    document: { visibilityState: 'visible', addEventListener() {} }, addEventListener() {},
    setTimeout(fn, ms) { timers.set(++next, { fn, ms }); return next; }, clearTimeout(id) { timers.delete(id); }, console };
  const reply = (body, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status });
  const fetch = async (path, init) => {
    if (path === '/api/config') { server.configCalls++; if (server.failConfig > 0) { server.failConfig--; throw Error('Temporary startup connection failure'); } return reply({ enabled: true }); }
    if (!server.authenticated) return reply({ error: 'login_required' }, 401);
    if (path === '/api/session') return reply({ authenticated: true, user: { uid: 'owner', email: 'owner@example.test', emailVerified: true }, csrfToken: server.csrf });
    if (init.method === 'POST' && init.headers['X-CSRF-Token'] !== server.csrf) return reply({ error: 'invalid_csrf' }, 403);
    if (path === '/api/logout') {
      server.logoutCalls++;
      if (server.failLogout) throw Error('Network failed before logout reached server');
      server.authenticated = false;
      return reply(null, 204);
    }
    if (path === '/api/sync') {
      server.writes++;
      if (server.hangWrites) { server.hangingSignal = init.signal; return new Promise(() => {}); }
      const op = JSON.parse(init.body).operations[0];
      const response = reply({ results: [{ ...op, status: 'accepted', document: { ...op, schemaVersion: 1, revision: op.baseRevision + 1 } }] });
      if (server.hangBody) { server.hangingSignal = init.signal; response.json = () => new Promise(() => {}); }
      return response;
    }
    if (server.failPull > 0) { server.failPull--; return reply({ error: 'service_unavailable' }, 503); }
    return reply({ documents: [], cursor: null, checkpoint: 0 });
  };
  const store = createStore({ env, adapter: memoryAdapter(), broadcast: false });
  await store.ready;
  const sync = createSync(store, { env, fetch, config: { enabled: true, provider: 'cloudflare' } });
  await sync.ready;
  return { server, sync, store, timers, env };
}

test('retrying a failed logout must retry server revocation rather than report success locally', async () => {
  const t = await fixture();
  t.server.failLogout = true;
  await assert.rejects(t.sync.disconnect());
  assert.equal(t.server.authenticated, true);
  t.server.failLogout = false;
  await t.sync.disconnect();
  assert.equal(t.server.logoutCalls, 2, 'second disconnect must issue another logout request');
  assert.equal(t.server.authenticated, false, 'successful retry must actually revoke session');
});

test('explicit reconnect after another tab rotates session must refresh the CSRF value', async () => {
  const t = await fixture();
  // Browser cookie was rotated by another tab; this tab still has the old CSRF.
  t.server.csrf = 'csrf-replaced-by-another-login';
  t.env.navigator.onLine = false;
  const card = await t.store.save({ word: '待同步' });
  t.env.navigator.onLine = true;
  await t.sync.retry();
  assert.equal(t.store.get(card.id).syncStatus, 'error');
  await t.sync.connect();
  assert.equal(t.store.get(card.id).syncStatus, 'synced', 'reconnect should refresh session before retrying stale CSRF');
  assert.equal(t.server.writes, 1);
});

const settle = () => new Promise(resolve => setImmediate(resolve));
for (const hungPhase of ['hangWrites', 'hangBody']) test('hung sync ' + hungPhase + ' reaches deadline, aborts, and preserves outbox for retry', async () => {
  const t = await fixture();
  t.env.navigator.onLine = false;
  const card = await t.store.save({ word: 'タイムアウトしても残る' });
  t.env.navigator.onLine = true;
  t.server[hungPhase] = true;
  const syncing = t.sync.retry();
  await settle();
  const deadline = [...t.timers.values()].find(timer => timer.ms === 20000);
  assert.ok(deadline, 'a hung request must have a bounded 20-second deadline');
  deadline.fn();
  await syncing;
  assert.equal(t.server.hangingSignal.aborted, true);
  assert.equal(t.store.get(card.id).word, 'タイムアウトしても残る');
  assert.notEqual(t.store.get(card.id).syncStatus, 'synced');
  assert.equal(t.store.getState().pendingCount, 1);
  t.server[hungPhase] = false;
  await t.sync.retry();
  assert.equal(t.store.get(card.id).syncStatus, 'synced');
});

test('initial transient network failure retries automatically with bounded exponential backoff', async () => {
  const t = await fixture({ failConfig: 2 });
  assert.equal(t.sync.getState().connected, false);
  const first = [...t.timers.values()].find(timer => timer.ms === 2000);
  assert.ok(first, 'initial transient failure must schedule an automatic retry');
  first.fn();
  await settle();
  const second = [...t.timers.values()].find(timer => timer.ms === 4000);
  assert.ok(second, 'another transient failure must back off rather than loop immediately');
  second.fn();
  await settle();
  assert.equal(t.server.configCalls, 3);
  assert.equal(t.sync.getState().connected, true);
  assert.ok([...t.timers.values()].every(timer => timer.ms >= 2000 && timer.ms <= 60000));
});

test('initial data pull failure after successful authentication automatically retries', async () => {
  const t = await fixture({ failPull: 1 });
  assert.equal(t.sync.getState().connected, true);
  assert.equal(t.sync.getState().status, 'error');
  const retry = [...t.timers.values()].find(timer => timer.ms === 2000);
  assert.ok(retry, 'initial pull failure must schedule retry even after connected became true');
  retry.fn();
  await settle();
  assert.equal(t.sync.getState().status, 'synced');
});
