const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { createStore, memoryAdapter } = require('../js/card-store.js');
const { createStudySync, snapshot, active, total } = require('../js/study-sync.js');
let sequence = 0;
const makeStore = options => createStore({ uuid: () => String(++sequence), now: () => '2026-10-06T00:00:00.000Z', broadcast: false, env: {}, ...options });
const model = { allItems: [{ id: 'word-one', type: 'word', word: '甲' }, { id: 'pattern-one', type: 'pattern', pattern: '一邊…一邊…' }, { id: 'idiom-one', type: 'idiom', text: '差不多' }] };
const clone = value => JSON.parse(JSON.stringify(value));
function setup(options = {}) {
  const store = options.store || makeStore();
  let value = { ...snapshot({}), ...options.initial }, saved = 0, rendered = 0, save;
  save = () => { saved++; };
  const app = { read: () => value, write: next => { value = next; }, installSave: wrap => { save = wrap(save); }, localRender() {}, render() { rendered++; if (options.renderCallsSave) save(); } };
  const sync = createStudySync({ store, app, model, enabled: true, actorId: 'device-a', env: {}, ...options });
  return { store, sync, read: () => value, mutate(fn) { fn(value); save(); }, get saved() { return saved; }, get rendered() { return rendered; } };
}
function remote(operation, revision = 1) {
  const { id, operationId, deleted, updatedAt, data } = operation;
  return { schemaVersion: 1, id, operationId, revision, deleted, updatedAt, data };
}

test('enabled shared state is authoritative while old local storage and bundled arrays stay unchanged', async () => {
  const raw = new Map([['favorites', '["甲"]'], ['freeSpeakText', 'private draft']]);
  const before = clone(model);
  const app = setup({ initial: { favorites: ['甲'] }, env: { localStorage: { getItem: key => raw.get(key), setItem() { throw new Error('legacy overwrite'); } } } });
  await app.sync.ready;
  assert.deepEqual(app.read().favorites, []); assert.equal(raw.get('favorites'), '["甲"]');
  app.mutate(state => { state.favorites.push('甲'); }); await app.sync.retry();
  assert.equal(active(app.store.getShared('favorites', 'word-one')), true); assert.equal(app.saved, 0);
  assert.equal(JSON.stringify(app.store.exportBackup()).includes('private draft'), false); assert.deepEqual(model, before);
});

test('disabled bridge retains old application save behavior and does not queue cloud study records', async () => {
  const app = setup({ enabled: false, initial: { favorites: ['甲'], quizRuns: 7 } }); await app.sync.ready;
  assert.deepEqual(app.read().favorites, ['甲']);
  app.mutate(state => { state.quizRuns++; }); await app.sync.retry();
  assert.equal(app.saved, 1); assert.deepEqual(app.store.getShared('study'), {}); assert.equal(app.read().quizRuns, 8);
});

test('saveAll diff bridges favorites, all three mistake kinds, weak flags, and quiz starts', async () => {
  const app = setup(); await app.sync.ready;
  app.mutate(state => {
    state.favorites = ['甲']; state.weakWords = ['甲']; state.mistakeCounts['甲'] = 1;
    state.weakCards = ['一邊…一邊…']; state.patternMistakeCounts['一邊…一邊…'] = 2;
    state.weakIdioms = ['差不多']; state.idiomMistakeCounts['差不多'] = 3; state.quizRuns += 3;
  });
  await app.sync.retry();
  assert.equal(active(app.store.getShared('favorites', 'word-one')), true);
  assert.equal(total(app.store.getShared('study', 'word-one')), 1);
  assert.equal(total(app.store.getShared('study', 'pattern-one')), 2);
  assert.equal(total(app.store.getShared('study', 'idiom-one')), 3);
  assert.equal(total(app.store.getShared('study', 'study-quiz-runs')), 3);
  app.mutate(state => { state.weakWords = []; state.mistakeCounts = {}; }); await app.sync.retry();
  assert.equal(active(app.store.getShared('study', 'word-one')), false); assert.equal(total(app.store.getShared('study', 'word-one')), 0);
});

test('rapid add/remove and count/reset actions remain ordered before asynchronous persistence finishes', async () => {
  const app = setup(); await app.sync.ready;
  app.mutate(state => { state.favorites = ['甲']; state.weakWords = ['甲']; state.mistakeCounts['甲'] = 1; });
  app.mutate(state => { state.favorites = []; state.weakWords = []; state.mistakeCounts = {}; });
  await app.sync.retry();
  assert.equal(active(app.store.getShared('favorites', 'word-one')), false);
  assert.equal(total(app.store.getShared('study', 'word-one')), 0);
  assert.deepEqual(app.read().favorites, []); assert.equal(app.sync.getState().unsavedCount, 0);
});

test('incoming cloud changes update lexical presentation without saveAll feedback or unrelated writes', async () => {
  const app = setup({ renderCallsSave: true }); await app.sync.ready;
  const donor = makeStore(); await donor.ready;
  await donor.updateShared('device-b', [{ kind: 'favorites', id: 'word-one', active: true }, { kind: 'study', id: 'study-quiz-runs', increment: 4 }]);
  let operation;
  while ((operation = await donor.prepareNext())) { const doc = remote(operation); await donor.applyRemote(operation.kind, [doc]); await app.store.applyRemote(operation.kind, [doc]); }
  assert.deepEqual(app.read().favorites, ['甲']); assert.equal(app.read().quizRuns, 4); assert.ok(app.rendered > 0);
  assert.equal(app.saved, 0); assert.equal(app.sync.getState().unsavedCount, 0); assert.equal(app.store.getState().pendingCount, 0);
});

test('failed persistence remains visibly unsaved, retains local changes, and retries exactly once', async () => {
  const backing = memoryAdapter(); let fail = false;
  const store = makeStore({ adapter: { read: backing.read, transact: fn => { if (fail) throw new Error('QuotaExceededError'); return backing.transact(fn); } } });
  const app = setup({ store }); await app.sync.ready; fail = true;
  app.mutate(state => { state.favorites = ['甲']; state.quizRuns++; });
  await assert.rejects(app.sync.retry(), /Quota/);
  assert.equal(app.sync.getState().unsavedCount, 1); assert.match(app.sync.getState().warning, /Quota/);
  assert.deepEqual(app.read().favorites, ['甲']); assert.equal(store.getShared('favorites', 'word-one'), null);
  fail = false; await app.sync.retry(); await app.sync.retry();
  assert.equal(total(store.getShared('study', 'study-quiz-runs')), 1); assert.equal(app.sync.getState().warning, ''); assert.equal(app.sync.getState().unsavedCount, 0);
});

test('legacy imports take historical maxima, preserve unknown entries in report, and cannot resurrect later removals', async () => {
  const app = setup(); await app.sync.ready;
  const first = { favorites: ['甲', 'missing'], mistakeCounts: { '甲': 3 }, quizRuns: 10 };
  const result = await app.sync.seedLegacy(first, 'legacy-one'); assert.equal(result.skipped.length, 1);
  await app.sync.seedLegacy(first, 'legacy-one'); await app.sync.seedLegacy({ favorites: ['甲'], mistakeCounts: { '甲': 5 }, quizRuns: 12 }, 'legacy-two');
  assert.equal(app.read().mistakeCounts['甲'], 5); assert.equal(app.read().quizRuns, 12);
  app.mutate(state => { state.favorites = []; }); await app.sync.retry();
  await app.sync.seedLegacy(first, 'legacy-three'); assert.deepEqual(app.read().favorites, []);
});

test('default guard uses deployment config and browser integration updates global lexical arrays', async () => {
  const store = makeStore(); await store.ready;
  const context = vm.createContext({ window: null, console, ChengciCardStore: store, CHENGCI_DATA_MODEL: model,
    CHENGCI_SYNC_CONFIG: { enabled: true, provider: 'cloudflare' }, ChengciCloudSync: { getState: () => ({ configured: true }) }, crypto: { randomUUID: () => String(++sequence) }, addEventListener() {} });
  context.window = context;
  vm.runInContext('let favorites=[], weakWords=[], weakCards=[], weakIdioms=[], mistakeCounts={}, patternMistakeCounts={}, idiomMistakeCounts={}, quizRuns=0; let originalCalls=0; function saveAll(){originalCalls++;} function updateStats(){} function applyTagFilter(){} function searchWords(){}', context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/study-sync.js'), 'utf8'), context);
  await context.ChengciStudySync.ready;
  vm.runInContext('favorites.push("甲"); quizRuns++; saveAll();', context); await context.ChengciStudySync.retry();
  assert.equal(active(store.getShared('favorites', 'word-one')), true); assert.equal(total(store.getShared('study', 'study-quiz-runs')), 1);
  assert.equal(vm.runInContext('originalCalls', context), 0);
});

test('a backend availability change cannot re-enable legacy whole-state persistence', async () => {
  let configured = true;
  const app = setup({ enabled: undefined, env: { CHENGCI_SYNC_CONFIG: { enabled: true, provider: 'cloudflare' }, ChengciCloudSync: { getState: () => ({ configured }) } } }); await app.sync.ready;
  configured = false;
  app.mutate(state => { state.quizRuns++; }); await app.sync.retry();
  assert.equal(app.saved, 0); assert.equal(app.sync.getState().enabled, true);
  assert.equal(total(app.store.getShared('study', 'study-quiz-runs')), 1);
});

test('four devices converge through actual Cloudflare transport on favorites/removals and concurrent study activity', async () => {
  const { createSync } = require('../js/cloudflare-sync.js');
  const documents = new Map(); let clock = 0;
  const response = value => ({ ok: true, status: 200, json: async () => clone(value) });
  const fetch = async (path, init) => {
    if (path === '/api/config') return response({ enabled: true });
    if (path === '/api/session') return response({ authenticated: true, user: { uid: 'same-owner', email: 'owner@example.test', emailVerified: true }, csrfToken: 'csrf' });
    if (path === '/api/sync') {
      const operation = JSON.parse(init.body).operations[0], key = operation.kind + ':' + operation.id;
      let item = documents.get(key), status = 'accepted';
      if (item?.document.operationId !== operation.operationId) {
        if ((item?.document.revision || 0) !== operation.baseRevision) status = 'conflict';
        else { item = { checkpoint: ++clock, document: remote(operation, operation.baseRevision + 1) }; documents.set(key, item); }
      }
      return response({ results: [{ kind: operation.kind, id: operation.id, operationId: operation.operationId, status, document: item.document }] });
    }
    const url = new URL(path, 'https://study.example.test'), kind = url.pathname.split('/').pop(), since = Number(url.searchParams.get('since') || 0);
    return response({ documents: [...documents].filter(([key, item]) => key.startsWith(kind + ':') && item.checkpoint > since).map(([, item]) => item.document), cursor: null, checkpoint: clock });
  };
  const devices = [];
  for (let n = 0; n < 4; n++) {
    const app = setup({ actorId: 'device-' + n }); await app.sync.ready;
    const env = { navigator: { onLine: true }, document: { visibilityState: 'visible', addEventListener() {} }, location: { origin: 'https://study.example.test' }, addEventListener() {} };
    const cloud = createSync(app.store, { env, fetch, config: { enabled: true, provider: 'cloudflare' } }); await cloud.ready;
    devices.push({ ...app, env, cloud });
  }
  for (const device of devices) device.env.navigator.onLine = false;
  devices[0].mutate(state => { state.favorites = ['甲']; }); await devices[0].sync.retry();
  devices[0].env.navigator.onLine = true; await devices[0].cloud.retry();
  for (const device of devices) { device.env.navigator.onLine = true; await device.cloud.retry(); assert.deepEqual(device.read().favorites, ['甲']); }
  // The fourth device stays offline with an old active favorite while others remove it.
  devices[3].env.navigator.onLine = false;
  devices[0].mutate(state => { state.favorites = []; }); await devices[0].sync.retry(); await devices[0].cloud.retry();
  for (const device of devices) device.env.navigator.onLine = false;
  for (const [index, device] of devices.entries()) {
    device.mutate(state => { state.quizRuns += index + 1; state.weakWords = ['甲']; state.mistakeCounts['甲'] = (state.mistakeCounts['甲'] || 0) + 1; });
    await device.sync.retry();
  }
  for (const device of devices) { device.env.navigator.onLine = true; await device.cloud.retry(); }
  for (const device of devices) await device.cloud.retry();
  for (const device of devices) {
    assert.deepEqual(device.read().favorites, []);
    assert.equal(device.read().quizRuns, 10); assert.equal(device.read().mistakeCounts['甲'], 4);
    assert.equal(device.store.getState().pendingCount, 0); assert.equal(device.store.getState().conflictCount, 0);
  }
});

test('session-only tabs use distinct actors without writing identifiers or study data to localStorage', async () => {
  let writes = 0;
  const env = { localStorage: { getItem() { return null; }, setItem() { writes++; } } };
  const a = setup({ actorId: undefined, uuid: () => 'session-one', env });
  const b = setup({ actorId: undefined, uuid: () => 'session-two', env });
  await Promise.all([a.sync.ready, b.sync.ready]);
  a.mutate(state => { state.quizRuns++; }); b.mutate(state => { state.quizRuns++; });
  await Promise.all([a.sync.retry(), b.sync.retry()]);
  assert.deepEqual(Object.keys(a.store.getShared('study', 'study-quiz-runs').counts), ['session-session-one']);
  assert.deepEqual(Object.keys(b.store.getShared('study', 'study-quiz-runs').counts), ['session-session-two']); assert.equal(writes, 0);
});

test('cloud favorite changes retain the favorites-only view instead of switching to the whole dictionary', async () => {
  const store = makeStore(); await store.ready;
  const context = vm.createContext({ window: null, console, ChengciCardStore: store, CHENGCI_DATA_MODEL: model,
    CHENGCI_SYNC_CONFIG: { enabled: true, provider: 'cloudflare' }, ChengciCloudSync: { getState: () => ({ configured: true }) }, crypto: { randomUUID: () => String(++sequence) }, addEventListener() {} });
  context.window = context;
  vm.runInContext('let favorites=[], weakWords=[], weakCards=[], weakIdioms=[], mistakeCounts={}, patternMistakeCounts={}, idiomMistakeCounts={}, quizRuns=0; let wordView="all"; function saveAll(){} function updateStats(){} function applyTagFilter(type){if(type==="word")wordView="all";} function searchWords(){} function showFavorites(){wordView="favorites:"+favorites.length;}', context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/study-sync.js'), 'utf8'), context); await context.ChengciStudySync.ready;
  const doc = { schemaVersion: 1, id: 'word-one', operationId: 'op-fav1', revision: 1, deleted: false, updatedAt: '2026-10-06T00:00:00.000Z', data: { adds: { b: 1 }, removes: {} } };
  await store.applyRemote('favorites', [doc]); vm.runInContext('showFavorites()', context);
  await store.applyRemote('favorites', [{ ...doc, operationId: 'op-fav2', revision: 2, data: { adds: { b: 1 }, removes: { b: 1 } } }]);
  assert.equal(vm.runInContext('wordView', context), 'favorites:0');
});

test('delayed bridge loading stays in shared mode after the backend already reported disabled', async () => {
  const { createSync } = require('../js/cloudflare-sync.js');
  const store = makeStore(); await store.ready;
  const config = { enabled: true, provider: 'cloudflare' };
  const env = { CHENGCI_SYNC_CONFIG: config, navigator: { onLine: true }, location: { origin: 'https://study.example.test' }, document: { visibilityState: 'visible', addEventListener() {} }, addEventListener() {} };
  env.ChengciCloudSync = createSync(store, { env, config, fetch: async path => {
    assert.equal(path, '/api/config');
    return { ok: true, status: 200, json: async () => ({ enabled: false, reason: 'temporary maintenance' }) };
  } });
  // Simulates cloudflare-sync.js finishing its request before the browser has
  // downloaded and evaluated the later study-sync.js script tag.
  await env.ChengciCloudSync.ready;
  assert.equal(env.ChengciCloudSync.getState().configured, false);
  const app = setup({ store, env, enabled: undefined }); await app.sync.ready;
  app.mutate(state => { state.favorites = ['甲']; state.quizRuns++; }); await app.sync.retry();
  assert.equal(app.sync.getState().enabled, true);
  assert.equal(app.saved, 0, 'shared-mode gestures never call the old localStorage writer');
  assert.equal(active(store.getShared('favorites', 'word-one')), true);
  assert.equal(total(store.getShared('study', 'study-quiz-runs')), 1);
});

test('stable deployment opt-out overrides a stale transport readiness flag', async () => {
  const app = setup({ enabled: undefined, env: { CHENGCI_SYNC_CONFIG: { enabled: false, provider: 'cloudflare' }, ChengciCloudSync: { getState: () => ({ configured: true }) } } });
  await app.sync.ready; app.mutate(state => { state.quizRuns++; }); await app.sync.retry();
  assert.equal(app.sync.getState().enabled, false); assert.equal(app.saved, 1);
  assert.deepEqual(app.store.getShared('study'), {});
});

test('explicit injected config enables isolated bridge tests without mutable transport state', async () => {
  const app = setup({ enabled: undefined, config: { enabled: true, provider: 'cloudflare' }, env: {} });
  await app.sync.ready; app.mutate(state => { state.quizRuns++; }); await app.sync.retry();
  assert.equal(app.sync.getState().enabled, true); assert.equal(app.saved, 0);
  assert.equal(total(app.store.getShared('study', 'study-quiz-runs')), 1);
});
