const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { createStore, memoryAdapter, active, DATABASE, LEGACY_DATABASE, PREFERENCE } = require('../js/card-store.js');
const { createSync } = require('../js/cloudflare-sync.js');
const DATE = '2026-10-06T00:00:00.000Z';
const READY = { version: 1, epoch: 1, ready: true, backupId: 'unified-words-v1', migratedAt: DATE };
const fields = { result: 'read', attempts: 2, updatedAt: DATE };
let number = 0;
const make = options => createStore({ env: {}, uuid: () => String(++number), now: () => DATE, broadcast: false, ...options });
const doc = (id, word, extra = {}) => ({ schemaVersion: 1, id, operationId: 'remote-' + id, revision: 1, deleted: false, updatedAt: DATE, data: { word }, ...extra });
const settle = () => new Promise(resolve => setImmediate(resolve));
function environment(values = new Map()) {
  const timers = new Map(); let id = 0;
  return { crypto: webcrypto, AbortController, navigator: { onLine: true }, location: { origin: 'https://vocabulary.test' }, document: { visibilityState: 'visible', addEventListener() {} }, addEventListener() {},
    setTimeout(fn, ms) { timers.set(++id, { fn, ms }); return id; }, clearTimeout(key) { timers.delete(key); }, timers,
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
}
function fakeServer(epoch = 1) {
  const records = new Map(), calls = [];
  const state = { epoch, failCardPage: false, failRemembered: false, wrongEpoch: false, rejectWrites: false, bootstrapCount: 0 };
  const response = (body, status = 200) => new Response(JSON.stringify(body), { status });
  async function fetch(path, init) {
    calls.push({ path, init });
    const url = new URL(path, 'https://vocabulary.test');
    if (path === '/api/config') return response({ enabled: true, vocabularyVersion: 1 });
    if (path === '/api/session') return response({ authenticated: true, user: { uid: 'owner', emailVerified: true }, csrfToken: 'csrf', vocabulary: { ...READY, version: state.epoch, epoch: state.epoch, ready: state.epoch === 1 } });
    if (path === '/api/vocabulary/bootstrap') {
      assert.equal(init.headers['X-CSRF-Token'], 'csrf'); assert.deepEqual(JSON.parse(init.body), { version: 1 });
      if (state.epoch === 0) { for (const [key] of records) if (!key.startsWith('cards:')) records.delete(key); state.bootstrapCount++; }
      state.epoch = 1; return response({ vocabulary: READY });
    }
    if (init.headers['X-Chengci-Epoch'] !== String(state.epoch)) return response({ error: 'vocabulary_epoch_changed' }, 409);
    if (path === '/api/sync') {
      if (state.rejectWrites) return response({ error: 'vocabulary_epoch_changed' }, 409);
      const results = JSON.parse(init.body).operations.map(op => {
        const document = { schemaVersion: 1, ...op, revision: op.baseRevision + 1 };
        records.set(op.kind + ':' + op.id, document);
        return { kind: op.kind, id: op.id, operationId: op.operationId, status: 'accepted', document };
      });
      return response({ epoch: state.epoch, results });
    }
    const kind = url.pathname.slice(5), cursor = Number(url.searchParams.get('cursor') || 0);
    if ((kind === 'cards' && cursor > 0 && state.failCardPage) || (kind === 'remembered' && state.failRemembered)) return response({ error: 'service_unavailable' }, 503);
    const rows = Number(url.searchParams.get('since') || 0) ? [] : [...records].filter(([key]) => key.startsWith(kind + ':')).map(([, value]) => value);
    return response({ epoch: state.wrongEpoch ? 0 : state.epoch, documents: rows.slice(cursor, cursor + 1), checkpoint: 10, cursor: cursor + 1 < rows.length ? String(cursor + 1) : null });
  }
  return { state, records, calls, fetch };
}
async function transport(store, env, server) {
  const sync = createSync(store, { env, fetch: server.fetch, config: { enabled: true, provider: 'cloudflare' } });
  await sync.ready; return sync;
}

test('metadata keeps absent and explicitly blank values distinct, and remembered is independent and reversible', async () => {
  const store = make(); await store.ready;
  const absent = await store.save({ word: '未指定' });
  assert.equal(Object.hasOwn(absent, 'category'), false); assert.equal(Object.hasOwn(absent, 'tags'), false);
  const blank = await store.save({ word: '空欄', category: '', tags: [], confuse: '' });
  assert.equal(blank.category, ''); assert.deepEqual(blank.tags, []); assert.equal(blank.confuse, '');
  await assert.rejects(store.save({ word: '無効', tags: ['a'.repeat(101)] }));
  await assert.rejects(store.save({ word: '無効', tags: Array(101).fill('a') }));
  await store.saveProgress(blank.id, fields);
  await store.updateShared('device', [{ kind: 'remembered', id: blank.id, active: true }]);
  assert.equal(active(store.getShared('remembered', blank.id)), true);
  await store.updateShared('device', [{ kind: 'remembered', id: blank.id, active: false }]);
  assert.equal(active(store.getShared('remembered', blank.id)), false);
  assert.equal(store.getProgress(blank.id).attempts, 2);
  await assert.rejects(store.updateShared('device', [{ kind: 'remembered', id: blank.id, increment: 1 }]));
});

test('new namespace imports lexical reservations, conflicts and tombstones without writing old storage', async () => {
  assert.notEqual(DATABASE, LEGACY_DATABASE);
  const oldDisk = memoryAdapter(), disk = memoryAdapter();
  const old = make({ adapter: oldDisk }); await old.ready;
  const card = await old.save({ id: 'word-local', word: '編集前' });
  const inflight = await old.prepareNext();
  await old.save({ ...card, word: '未送信の編集' });
  await old.applyRemote('cards', [doc(card.id, '別端末の編集')]);
  await old.remove('word-deleted');
  await old.saveProgress(card.id, fields);
  await old.updateShared('old-device', [{ kind: 'favorites', id: card.id, active: true }]);
  const original = await oldDisk.read();
  const values = new Map([['chengciRecallV1', '{"index":5}'], ['favorites', '[3]']]);
  const store = make({ adapter: disk, legacyAdapter: oldDisk, env: environment(values) }); await store.ready;
  assert.deepEqual((await disk.read()).cards, original.cards);
  await store.adoptVocabulary(READY, [doc('word-canonical', '新しい単語')]);
  const adopted = await disk.read();
  assert.deepEqual(adopted.cards[card.id].inflight, inflight && original.cards[card.id].inflight);
  assert.deepEqual(adopted.cards[card.id].conflict, original.cards[card.id].conflict);
  assert.equal(adopted.cards['word-deleted'].deleted, true);
  assert.deepEqual(adopted.progress, {}); assert.deepEqual(adopted.favorites, {});
  assert.deepEqual(store.getVocabularyArchive().beforeAdoption.records.progress, original.progress);
  assert.equal(store.getVocabularyArchive().beforeAdoption.localStorage.chengciRecallV1, '{"index":5}');
  assert.equal(values.get('favorites'), '[3]'); assert.deepEqual(await oldDisk.read(), original);
  const archive = store.getVocabularyArchive(); archive.beforeAdoption.records.progress = {};
  assert.notDeepEqual(store.getVocabularyArchive().beforeAdoption.records.progress, {});
});

test('failed adoption transaction preserves learning, lexical outbox, archive and readiness as one snapshot', async () => {
  const disk = memoryAdapter(); let fail = false;
  const store = make({ adapter: { read: disk.read, transact: fn => { if (fail) throw Error('QuotaExceeded'); return disk.transact(fn); } } }); await store.ready;
  const card = await store.save({ word: '保存中' }); await store.prepareNext(); await store.saveProgress(card.id, fields);
  const before = await disk.read(); fail = true;
  await assert.rejects(store.adoptVocabulary(READY, [doc('word-server', 'サーバー')]), /Quota/);
  assert.deepEqual(await disk.read(), before); assert.equal(store.getVocabulary().clientReady, false);
  assert.equal(store.getProgress(card.id).attempts, 2); assert.equal(store.get('word-server'), null);
  fail = false; await store.adoptVocabulary(READY, []); assert.equal(store.getVocabulary().clientReady, true);
});

test('late old-tab lexical edits become recoverable comparisons and unchanged sources never overwrite new edits', async () => {
  const oldDisk = memoryAdapter(), disk = memoryAdapter();
  const old = make({ adapter: oldDisk }); await old.ready;
  await old.save({ id: 'word-shared', word: '元の内容' });
  const store = make({ adapter: disk, legacyAdapter: oldDisk }); await store.ready;
  await store.adoptVocabulary(READY, []);
  await store.save({ ...store.get('word-shared'), word: '新画面の編集' });
  await store.reload(); assert.equal(store.getState().conflictCount, 0);
  await old.save({ ...old.get('word-shared'), word: '旧画面の後の編集' });
  await old.saveProgress('word-shared', fields);
  await old.updateShared('old-device', [{ kind: 'favorites', id: 'word-shared', active: true }]);
  await store.reload();
  assert.equal(store.get('word-shared').word, '新画面の編集');
  assert.equal(store.get('word-shared').conflict.remote.word, '旧画面の後の編集');
  assert.equal(store.getProgress('word-shared'), null); assert.equal(store.getShared('favorites', 'word-shared'), null);
  const before = store.exportBackup(); await store.reload(); assert.deepEqual(store.exportBackup(), before);
  await store.resolveConflict('word-shared', 'both');
  assert.deepEqual(new Set(store.list().map(item => item.word)), new Set(['新画面の編集', '旧画面の後の編集']));
});

test('late old-tab new words and tombstones import once without replaying old learning', async () => {
  const oldDisk = memoryAdapter(), disk = memoryAdapter(), old = make({ adapter: oldDisk }); await old.ready;
  await old.save({ id: 'word-deletable', word: '削除前' });
  const store = make({ adapter: disk, legacyAdapter: oldDisk }); await store.ready; await store.adoptVocabulary(READY, []);
  await old.remove('word-deletable'); await old.save({ id: 'word-new', word: 'あとから追加' });
  await store.reload(); assert.equal(store.get('word-deletable').deleted, true); assert.equal(store.get('word-new').word, 'あとから追加');
  await old.updateShared('old-device', [{ kind: 'favorites', id: 'word-new', active: true }]);
  await store.importBackup(old.exportBackup()); await store.seedShared('legacy-baseline-v1', [{ kind: 'favorites', id: 'word-new', active: true }]);
  assert.equal(store.getShared('favorites', 'word-new'), null); assert.ok(store.getVocabularyArchive().importedLegacyBackups.length);
});

test('memory-mode migration does not open or write persistent source or destination without device opt-in', async () => {
  let accesses = 0; const unavailable = { read: async () => { accesses++; throw Error('should not open'); }, transact: async () => { accesses++; throw Error('should not write'); } };
  const env = environment(), store = make({ env, deviceAdapter: unavailable, legacyAdapter: unavailable }); await store.ready;
  await store.save({ word: '共有端末' }); await store.adoptVocabulary(READY, [doc('word-cloud', '雲')]);
  assert.equal(accesses, 0); assert.equal(env.localStorage.getItem(PREFERENCE), null); assert.equal(store.getState().persistence, 'memory');
});

test('stale new-client tabs cannot apply queued learning after another tab atomically adopts the new epoch', async () => {
  const disk = memoryAdapter(), a = make({ adapter: disk }), b = make({ adapter: disk }); await Promise.all([a.ready, b.ready]);
  await b.adoptVocabulary(READY, []);
  await assert.rejects(a.updateShared('device-old', [{ kind: 'favorites', id: 'word-one', active: true }]), error => error.code === 'vocabulary_epoch_changed');
  await assert.rejects(a.saveProgress('word-one', fields, { expectedEpoch: 0 }), error => error.code === 'vocabulary_epoch_changed');
  await assert.rejects(a.applyRemote('progress', [doc('word-one', '', { data: fields })], { epoch: 0 }), error => error.code === 'vocabulary_epoch_changed');
  await a.save({ id: 'word-one', word: '単語の編集は保存' });
  await b.reload(); assert.equal(a.getVocabulary().epoch, 1); assert.equal(b.get('word-one').word, '単語の編集は保存'); assert.deepEqual(b.getProgress(), {});
});

test('transport waits for delayed storage initialization before requesting or exposing ready vocabulary', async () => {
  const disk = memoryAdapter(); let release;
  const env = environment(), server = fakeServer();
  const store = make({ env, adapter: { read: () => new Promise(resolve => { release = async () => resolve(await disk.read()); }), transact: disk.transact } });
  const sync = createSync(store, { env, fetch: server.fetch, config: { enabled: true, provider: 'cloudflare' } });
  await settle(); assert.equal(server.calls.length, 0); assert.equal(sync.getState().vocabulary.clientReady, false);
  await release(); await sync.ready; assert.equal(sync.getState().vocabulary.clientReady, true);
});

for (const failure of ['failCardPage', 'failRemembered']) test('initial ' + failure + ' retains the complete prior offline snapshot and stages every kind before ready', async () => {
  const env = environment(), server = fakeServer(), disk = memoryAdapter(), store = make({ env, adapter: disk }); await store.ready;
  await store.save({ id: 'word-local', word: '未同期' }); await store.saveProgress('word-local', fields);
  const before = await disk.read();
  server.records.set('cards:word-a', doc('word-a', '甲')); server.records.set('cards:word-b', doc('word-b', '乙'));
  server.records.set('remembered:word-a', doc('word-a', '', { data: { adds: { other: 1 }, removes: {} } }));
  server.state[failure] = true;
  const sync = await transport(store, env, server);
  assert.equal(sync.getState().vocabulary.clientReady, false); assert.deepEqual(await disk.read(), before);
  assert.equal(server.calls.some(call => call.path === '/api/sync'), false);
  server.state[failure] = false; await sync.retry();
  assert.equal(sync.getState().vocabulary.clientReady, true); assert.equal(store.get('word-b').word, '乙');
  assert.equal(active(store.getShared('remembered', 'word-a')), true); assert.equal(store.getProgress('word-local'), null);
  assert.equal(store.getVocabularyArchive().beforeAdoption.records.progress['word-local'].data.attempts, 2);
});

test('bootstrap requires an explicit API call and repeated bootstrap keeps new learning', async () => {
  const env = environment(), server = fakeServer(0), store = make({ env }); await store.ready;
  await store.saveProgress('word-one', fields);
  const sync = await transport(store, env, server);
  assert.equal(server.state.bootstrapCount, 0); assert.equal(sync.getState().vocabulary.clientReady, false);
  await sync.bootstrapVocabulary(); assert.equal(server.state.bootstrapCount, 1); assert.equal(store.getProgress('word-one'), null);
  await store.updateShared('new-device', [{ kind: 'remembered', id: 'word-one', active: true }]); await sync.retry();
  await sync.bootstrapVocabulary(); assert.equal(server.state.bootstrapCount, 1); assert.equal(active(store.getShared('remembered', 'word-one')), true);
});

test('epoch mismatch preserves lexical reservation and does not silently relabel or replay a write', async () => {
  const env = environment(), server = fakeServer(), store = make({ env }); await store.ready;
  const sync = await transport(store, env, server);
  env.navigator.onLine = false; await store.save({ id: 'word-local', word: '未同期の内容' });
  const operation = await store.prepareNext(); server.state.rejectWrites = true; env.navigator.onLine = true;
  await sync.retry(); assert.equal(sync.getState().errorCode, 'vocabulary_epoch_changed');
  assert.equal((await store.prepareNext()).operationId, operation.operationId); assert.equal(store.get('word-local').word, '未同期の内容');
  assert.equal(server.records.has('cards:word-local'), false);
  const sent = server.calls.filter(call => call.path === '/api/sync'); assert.equal(sent.length, 1); assert.equal(sent[0].init.headers['X-Chengci-Epoch'], '1');
});

test('an unexpected response epoch is rejected before applying any staged documents', async () => {
  const env = environment(), server = fakeServer(), store = make({ env }); await store.ready;
  await store.save({ id: 'word-local', word: '保持' }); const before = store.exportBackup();
  server.state.wrongEpoch = true; server.records.set('cards:word-remote', doc('word-remote', '誤った世代'));
  const sync = await transport(store, env, server);
  assert.equal(sync.getState().errorCode, 'vocabulary_epoch_changed'); assert.equal(sync.getState().vocabulary.clientReady, false);
  assert.deepEqual(store.exportBackup(), before); assert.equal(store.get('word-remote'), null);
});

for (const pullFirst of [false, true]) test('epoch-1 login checkpoint preserves pending remembered/favorites when pullFirst=' + pullFirst, async () => {
  const { createHandoff } = require('../js/auth-handoff.js');
  const values = new Map(), env = environment();
  env.sessionStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const source = make({ env }); await source.ready; await source.adoptVocabulary(READY, []);
  await source.updateShared('session-before-login', [{ kind: 'remembered', id: 'word-one', active: true }, { kind: 'favorites', id: 'word-one', active: true }]);
  await source.saveProgress('word-one', fields);
  await createHandoff(source, env).prepare();
  const restored = make({ env }); await restored.ready;
  if (pullFirst) await restored.adoptVocabulary(READY, [doc('word-one', '単語')]);
  await createHandoff(restored, env).restore();
  assert.equal(restored.getVocabulary().epoch, 1);
  assert.equal(restored.getVocabulary().clientReady, pullFirst);
  if (!pullFirst) await restored.adoptVocabulary(READY, [doc('word-one', '単語')]);
  assert.equal(active(restored.getShared('remembered', 'word-one')), true);
  assert.equal(active(restored.getShared('favorites', 'word-one')), true);
  assert.equal(restored.getProgress('word-one').attempts, 2);
});

test('backup roundtrip retains lexical inflight and imported alternatives plus the pre-reset archive', async () => {
  const source = make(); await source.ready;
  const card = await source.save({ id: 'word-one', word: '一' });
  const operation = await source.prepareNext();
  await source.save({ ...card, word: '二' });
  await source.saveProgress(card.id, fields);
  await source.adoptVocabulary(READY, []);
  const backup = source.exportBackup();
  backup.state.cards[card.id].importConflicts = [{ token: 'alternative-three', data: { ...backup.state.cards[card.id].data, word: '三' }, deleted: false, updatedAt: DATE }];
  backup.state.cards[card.id].syncStatus = 'conflict';
  const target = make(); await target.ready; await target.importBackup(backup);
  const restored = target.exportBackup();
  assert.equal(restored.state.cards[card.id].inflight.operationId, operation.operationId);
  assert.equal(restored.state.cards[card.id].inflight.data.word, '一');
  assert.equal(target.get(card.id).word, '二'); assert.equal(target.get(card.id).conflict.remote.word, '三');
  assert.equal(target.getVocabularyArchive().beforeAdoption.records.progress[card.id].data.attempts, 2);
  assert.equal(target.getVocabulary().clientReady, false);
});

for (const action of ['reload', 'save']) test('another tab opting out prevents durable legacy repopulation on ' + action, async () => {
  const disk = memoryAdapter(), oldDisk = memoryAdapter(), old = make({ adapter: oldDisk }); await old.ready;
  await old.save({ id: 'word-private', word: '個人データ' });
  const values = new Map([[PREFERENCE, 'device']]), env = environment(values);
  const a = make({ env, deviceAdapter: disk, legacyAdapter: oldDisk }), b = make({ env, deviceAdapter: disk, legacyAdapter: oldDisk }); await Promise.all([a.ready, b.ready]);
  await a.setPersistence(false);
  if (action === 'reload') await b.reload(); else await b.save({ id: 'word-later', word: 'メモリーのみ' });
  assert.equal(b.getState().persistence, 'memory'); assert.deepEqual((await disk.read()).cards, {});
  assert.equal((await disk.read()).persistenceDisabled, true); assert.equal((await oldDisk.read()).cards['word-private'].data.word, '個人データ');
});

test('an in-flight new-namespace transaction cannot repopulate disk after an opt-out races its preference check', async () => {
  const disk = memoryAdapter(), values = new Map([[PREFERENCE, 'device']]), env = environment(values);
  const a = make({ env, deviceAdapter: disk }); await a.ready;
  let release, delay = false;
  const delayed = { read: disk.read, transact: async fn => { if (delay) { delay = false; await new Promise(resolve => { release = resolve; }); } return disk.transact(fn); } };
  const b = make({ env, deviceAdapter: delayed }); await b.ready;
  delay = true; const saving = b.save({ id: 'word-later', word: '端末に残さない' });
  await settle(); assert.ok(release);
  await a.setPersistence(false); release(); await saving;
  assert.equal(b.getState().persistence, 'memory'); assert.equal(b.get('word-later').word, '端末に残さない');
  assert.deepEqual((await disk.read()).cards, {});
});

test('failed post-bootstrap initial pull preserves old local snapshot until a complete retry can archive and reset', async () => {
  const env = environment(), server = fakeServer(0), disk = memoryAdapter(), store = make({ env, adapter: disk }); await store.ready;
  const sync = await transport(store, env, server);
  env.navigator.onLine = false;
  await store.save({ id: 'word-private', word: '移行中も残す' }); await store.saveProgress('word-private', fields);
  server.records.set('cards:word-a', doc('word-a', '甲')); server.records.set('cards:word-b', doc('word-b', '乙'));
  const before = await disk.read(); server.state.failCardPage = true; env.navigator.onLine = true;
  await assert.rejects(sync.bootstrapVocabulary());
  assert.equal(server.state.epoch, 1); assert.equal(sync.getState().vocabulary.clientReady, false); assert.deepEqual(await disk.read(), before);
  server.state.failCardPage = false; await sync.retry();
  assert.equal(sync.getState().vocabulary.clientReady, true); assert.equal(store.get('word-private').word, '移行中も残す');
  assert.equal(store.getProgress('word-private'), null); assert.equal(store.getVocabularyArchive().beforeAdoption.records.progress['word-private'].data.attempts, 2);
  const newEpochWrites = server.calls.filter(call => call.path === '/api/sync' && call.init.headers['X-Chengci-Epoch'] === '1').flatMap(call => JSON.parse(call.init.body).operations);
  assert.ok(newEpochWrites.every(operation => operation.kind === 'cards'));
});

test('same-epoch enabling of device storage retains session inflight and cloud alternatives beside a device card', async () => {
  const disk = memoryAdapter(), device = make({ adapter: disk }); await device.ready;
  await device.save({ id: 'word-one', word: '端末側' });
  const session = make({ env: environment(), deviceAdapter: disk }); await session.ready;
  await session.save({ id: 'word-one', word: '送信中' }); const operation = await session.prepareNext();
  await session.save({ ...session.get('word-one'), word: 'セッションの編集' });
  await session.applyRemote('cards', [doc('word-one', 'クラウドの別案')]);
  await session.setPersistence(true);
  const archive = session.getVocabularyArchive().persistenceMergeRecords;
  assert.equal(archive[0].inflight.operationId, operation.operationId); assert.equal(archive[0].conflict.data.word, 'クラウドの別案');
  const copy = session.list().find(card => card.id !== 'word-one');
  assert.equal(copy.word, 'セッションの編集');
  const stored = (await disk.read()).cards[copy.id];
  assert.deepEqual(new Set(stored.importConflicts.map(item => item.data.word)), new Set(['送信中', 'クラウドの別案']));
});

test('keeping both cloud and local versions leaves an unrelated backup alternative unresolved and archived', async () => {
  const store = make(); await store.ready;
  await store.save({ id: 'word-one', word: '手元' }); await store.prepareNext();
  const backup = store.exportBackup(); backup.state.cards['word-one'].importConflicts = [{ token: 'third', data: { ...backup.state.cards['word-one'].data, word: '三番目' }, deleted: false, updatedAt: DATE }];
  backup.state.cards['word-one'].syncStatus = 'conflict';
  const target = make(); await target.ready; await target.importBackup(backup);
  await target.applyRemote('cards', [doc('word-one', 'クラウド')]);
  await target.resolveConflict('word-one', 'both');
  assert.equal(target.getState().conflictCount, 1); assert.equal(target.get('word-one').conflict.remote.word, '三番目');
  assert.deepEqual(new Set(target.list().map(card => card.word)), new Set(['手元', 'クラウド']));
  assert.ok(target.getVocabularyArchive().conflictResolutions[0].record.inflight);
});

test('recovery export reads validated server archive pages and combines them with the local reset archive', async () => {
  const env = environment(), server = fakeServer(), store = make({ env }); await store.ready;
  await store.saveProgress('word-local', fields);
  const archived = [ { kind: 'cards', ...doc('word-before', '移行前') }, { kind: 'progress', ...doc('word-local', '', { data: fields }) } ];
  const backup = { id: 'unified-words-v1', createdAt: DATE, previousEpoch: 0, documentCount: 2 };
  const calls = [];
  const fetch = async (path, init) => {
    if (!path.startsWith('/api/vocabulary/backup')) return server.fetch(path, init);
    calls.push({ path, init });
    assert.equal(init.headers['X-Chengci-Epoch'], '1'); assert.equal(init.credentials, 'same-origin'); assert.equal(init.cache, 'no-store');
    const second = path.includes('?cursor=');
    return new Response(JSON.stringify({ backup, documents: [archived[second ? 1 : 0]], cursor: second ? null : '1' }), { status: 200 });
  };
  const sync = createSync(store, { env, fetch, config: { enabled: true, provider: 'cloudflare' } }); await sync.ready;
  const exported = await sync.exportVocabularyArchive();
  assert.equal(exported.scope, 'local-and-server'); assert.equal(calls.length, 2); assert.equal(exported.server.documents.length, 2);
  assert.equal(exported.server.documents[0].data.word, '移行前'); assert.equal(exported.local.archive.beforeAdoption.records.progress['word-local'].data.attempts, 2);
  assert.equal(JSON.stringify(exported).includes('csrf'), false);
  env.navigator.onLine = false;
  const local = await sync.exportVocabularyArchive(); assert.equal(local.scope, 'local-only'); assert.equal(local.reason, 'offline'); assert.equal(local.server, null); assert.equal(calls.length, 2);
});

test('recovery export rejects incomplete or changing server pages instead of returning partial success', async () => {
  const env = environment(), server = fakeServer(), store = make({ env }); await store.ready;
  const fetch = async (path, init) => path.startsWith('/api/vocabulary/backup')
    ? new Response(JSON.stringify({ backup: { id: 'unified-words-v1', createdAt: DATE, previousEpoch: 0, documentCount: 2 }, documents: [{ kind: 'cards', ...doc('word-one', '一') }], cursor: null }), { status: 200 })
    : server.fetch(path, init);
  const sync = createSync(store, { env, fetch, config: { enabled: true, provider: 'cloudflare' } }); await sync.ready;
  await assert.rejects(sync.exportVocabularyArchive(), /一部/);
});

test('pre-migration export reports a local-only scope when the server reset archive does not exist yet', async () => {
  const env = environment(), server = fakeServer(0), store = make({ env }); await store.ready;
  const fetch = async (path, init) => path.startsWith('/api/vocabulary/backup') ? new Response(JSON.stringify({ error: 'backup_not_found' }), { status: 404 }) : server.fetch(path, init);
  const sync = createSync(store, { env, fetch, config: { enabled: true, provider: 'cloudflare' } }); await sync.ready;
  const exported = await sync.exportVocabularyArchive();
  assert.equal(exported.scope, 'local-only'); assert.equal(exported.reason, 'server-backup-not-created'); assert.equal(server.state.bootstrapCount, 0);
});

test('effective local persistence consent reflects cross-tab opt-out synchronously and denies unreadable settings', async () => {
  const disk = memoryAdapter(), values = new Map([[PREFERENCE, 'device']]), env = environment(values);
  const store = make({ env, deviceAdapter: disk }); await store.ready;
  assert.equal(store.canPersistLocally(), true);
  values.delete(PREFERENCE);
  assert.equal(store.getState().persistence, 'device', 'a stale tab has not reloaded yet');
  assert.equal(store.canPersistLocally(), false, 'synchronous recall writes must see withdrawn consent immediately');
  values.set(PREFERENCE, 'device'); assert.equal(store.canPersistLocally(), true);
  env.localStorage.getItem = () => { throw Error('Storage access denied'); };
  assert.equal(store.canPersistLocally(), false);
  assert.deepEqual((await disk.read()).cards, {});
  const memory = make(); await memory.ready; assert.equal(memory.canPersistLocally(), false);
  const explicitAdapter = make({ adapter: memoryAdapter() }); await explicitAdapter.ready;
  assert.equal(explicitAdapter.canPersistLocally(), true, 'explicit adapters retain their existing consent semantics');
});

test('successful persistence opt-out removes only the epoch-1 recall session after the database clear commits', async () => {
  const disk = memoryAdapter(), values = new Map([[PREFERENCE, 'device'], ['chengciRecallV1', 'legacy-recovery'], ['chengciRecallV1:epoch:1', 'private-round']]), env = environment(values);
  let fail = false;
  const adapter = { read: disk.read, transact: fn => { if (fail) throw Error('database-clear-failed'); return disk.transact(fn); } };
  const store = make({ env, deviceAdapter: adapter }); await store.ready; await store.save({ word: '手元の語' });
  fail = true; await assert.rejects(store.setPersistence(false), /database-clear-failed/);
  assert.equal(values.get('chengciRecallV1:epoch:1'), 'private-round'); assert.equal(values.get(PREFERENCE), 'device');
  assert.equal(values.get('chengciRecallV1'), 'legacy-recovery');
  fail = false; await store.setPersistence(false);
  assert.equal(values.has('chengciRecallV1:epoch:1'), false); assert.equal(values.get('chengciRecallV1'), 'legacy-recovery');
  assert.deepEqual((await disk.read()).cards, {}); assert.equal(store.canPersistLocally(), false);
});

test('recall-session removal failure is reported after database opt-out and can be retried without losing recovery data', async () => {
  const disk = memoryAdapter(), values = new Map([[PREFERENCE, 'device'], ['chengciRecallV1', 'legacy-recovery'], ['chengciRecallV1:epoch:1', 'private-round']]), env = environment(values);
  const remove = env.localStorage.removeItem; let fail = true;
  env.localStorage.removeItem = key => { if (key === 'chengciRecallV1:epoch:1' && fail) throw Error('Storage removal denied'); remove(key); };
  const store = make({ env, deviceAdapter: disk }); await store.ready; await store.save({ word: '保持' });
  await assert.rejects(store.setPersistence(false), /練習画面の端末保存を消去できません/);
  assert.equal(store.getState().persistence, 'memory'); assert.equal(store.canPersistLocally(), false);
  assert.match(store.getState().warning, /消去できません/); assert.deepEqual((await disk.read()).cards, {});
  assert.equal(values.get('chengciRecallV1:epoch:1'), 'private-round'); assert.equal(values.get('chengciRecallV1'), 'legacy-recovery');
  fail = false; await store.setPersistence(false);
  assert.equal(values.has('chengciRecallV1:epoch:1'), false); assert.equal(values.get('chengciRecallV1'), 'legacy-recovery'); assert.equal(store.getState().warning, '');
});
