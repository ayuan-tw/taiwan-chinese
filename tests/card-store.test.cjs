const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore, memoryAdapter, PREFERENCE } = require('../js/card-store.js');
let sequence = 0;
const make = options => createStore({ uuid: () => String(++sequence), now: () => '2026-10-06T00:00:00.000Z', broadcast: false, env: {}, ...options });
const save = (store, word = '敢', extra = {}) => store.save({ word, zhuyin: 'ㄍㄢˇ', ...extra });
function remote(operation, revision = operation.baseRevision + 1, extra = {}) {
  const { id, operationId, deleted, updatedAt, data } = operation;
  return { schemaVersion: 1, id, operationId, revision, deleted, updatedAt, data, ...extra };
}

test('memory default, meaning optional, stable IDs, copies protected, deletes/restores overlays', async () => {
  const store = make(); await store.ready;
  const card = await save(store);
  assert.equal(store.getState().persistence, 'memory'); assert.equal(card.meaning, ''); assert.equal(card.pronunciationStatus, 'candidate');
  assert.equal(card.syncStatus, 'pending'); assert.ok(card.id.startsWith('personal-'));
  card.word = 'changed'; assert.equal(store.get(card.id).word, '敢');
  const id = card.id; await save(store, '別字', { id }); assert.equal(store.list().length, 1);
  await store.remove(id); assert.equal(store.list().length, 0); assert.equal(store.get(id).deleted, true);
  assert.equal(store.list({ includeDeleted: true }).length, 1);
  await store.save({ ...store.get(id), word: '戻した' }); assert.equal(store.get(id).deleted, false);
  await store.remove('word-builtin'); assert.equal(store.get('word-builtin').deleted, true);
  assert.equal(store.get('constructor'), null);
});

test('invalid input rejects without mutation and record limit/shape is validated', async () => {
  const store = make(); await store.ready;
  await assert.rejects(save(store, ''), /繁體字/);
  await assert.rejects(save(store, 'a'.repeat(301)), /word/);
  await assert.rejects(save(store, '敢', { id: '../escape' }), /ID/);
  await assert.rejects(save(store, '敢', { pronunciationStatus: 'secret' }), /確認状態/);
  assert.equal(store.list().length, 0);
});

test('local persistence commits before save resolves; quota refusal cannot silently succeed', async () => {
  const backing = memoryAdapter(); let refuse = false;
  const store = make({ adapter: { read: backing.read, transact: transform => { if (refuse) throw new Error('QuotaExceededError'); return backing.transact(transform); } } });
  await store.ready; const card = await save(store); const before = store.exportBackup();
  assert.equal((await backing.read()).cards[card.id].data.word, '敢');
  refuse = true; await assert.rejects(save(store, '変更', { id: card.id }), /Quota/);
  assert.deepEqual(store.exportBackup().state, before.state); assert.match(store.getState().warning, /Quota/);
});

test('corrupted saved data is blocked and never replaced with empty storage', async () => {
  let writes = 0;
  const store = make({ adapter: { read: async () => ({ schemaVersion: 99 }), transact: async () => { writes++; } } });
  await store.ready; assert.equal(store.getState().blocked, true);
  await assert.rejects(save(store), /保存データ/); assert.equal(writes, 0);
  assert.throws(() => store.exportBackup(), /保存データ/);
});

test('device persistence requires opt-in and touches only its own preference', async () => {
  const disk = memoryAdapter(); const values = new Map([['chengciRecallV1', 'keep'], ['dictionarySetting', 'keep']]);
  const env = { localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  const store = make({ env, deviceAdapter: disk }); await store.ready; const card = await save(store);
  assert.equal(Object.keys((await disk.read()).cards).length, 0);
  await store.setPersistence(true); assert.equal(values.get(PREFERENCE), 'device');
  const reopened = make({ env, deviceAdapter: disk }); await reopened.ready;
  assert.equal(reopened.get(card.id).word, '敢');
  await store.setPersistence(false); assert.equal(store.getState().persistence, 'memory'); assert.equal(store.get(card.id).word, '敢');
  assert.equal(Object.keys((await disk.read()).cards).length, 0);
  assert.equal(values.get('chengciRecallV1'), 'keep'); assert.equal(values.get('dictionarySetting'), 'keep');
});

test('two tabs write distinct cards without whole-store overwrite and stale same-card edit rejects', async () => {
  const disk = memoryAdapter(); const a = make({ adapter: disk }); const b = make({ adapter: disk }); await Promise.all([a.ready, b.ready]);
  const [one, two] = await Promise.all([save(a, '甲'), save(b, '乙')]);
  await a.reload(); assert.equal(a.list().length, 2); await b.reload();
  const old = b.get(one.id);
  await a.save({ ...a.get(one.id), word: '甲更新' });
  await assert.rejects(b.save({ ...old, word: '古い画面' }, { expectedRevision: old.revision, expectedLocalVersion: old.localVersion }), error => error.code === 'STALE_CARD');
  await b.reload(); assert.equal(b.get(one.id).word, '甲更新'); assert.equal(b.get(two.id).word, '乙');
});

test('remote read preserves local-only cards, ignores empty snapshots, accepts tombstones', async () => {
  const store = make(); await store.ready; const local = await save(store);
  const other = { id: 'word-cloud', operationId: 'op-cloud', baseRevision: 0, deleted: false, updatedAt: '2026-10-06T00:00:00Z', data: { word: '雲' } };
  await store.applyRemote('cards', [remote(other)]); assert.equal(store.list().length, 2);
  await store.applyRemote('cards', []); assert.equal(store.get(local.id).syncStatus, 'pending');
  await store.applyRemote('cards', [remote(other, 2, { operationId: 'op-delete', deleted: true })]);
  assert.equal(store.get('word-cloud').deleted, true); assert.equal(store.list().length, 1);
});

test('concurrent remote edit retains both; stale editor rejects; explicit resolution retries against remote revision', async () => {
  const store = make(); await store.ready; const card = await save(store); const op = await store.prepareNext();
  await store.applyRemote('cards', [remote(op)]); const opened = store.get(card.id);
  await store.save({ ...opened, word: 'こちら' });
  const other = remote(op, 2, { operationId: 'op-other', data: { ...op.data, word: '別端末' } });
  await store.applyRemote('cards', [other]);
  assert.equal(store.getState().conflictCount, 1); assert.equal(store.get(card.id).word, 'こちら');
  assert.equal(store.getConflicts()[0].remote.word, '別端末'); assert.equal(await store.prepareNext(), null);
  await store.resolveConflict(card.id, 'local'); const resolved = await store.prepareNext();
  assert.equal(resolved.baseRevision, 2); assert.equal(resolved.data.word, 'こちら');
  await store.applyRemote('cards', [remote(resolved)]);
  await assert.rejects(store.save({ ...opened, word: '古いフォーム' }, { expectedRevision: opened.revision }), error => error.code === 'STALE_CARD');
});

test('inflight ack never drops a newer local edit, including listener-before-response and lost-ack retry', async () => {
  const store = make(); await store.ready; const card = await save(store, '一'); const sent = await store.prepareNext();
  await store.save({ ...card, word: '二' });
  assert.equal((await store.prepareNext()).operationId, sent.operationId, 'retry same reserved operation');
  const ack = remote(sent); await store.applyRemote('cards', [ack]); await store.applyRemote('cards', [ack]);
  assert.equal(store.get(card.id).word, '二'); assert.equal(store.get(card.id).syncStatus, 'pending');
  const next = await store.prepareNext(); assert.equal(next.data.word, '二'); assert.equal(next.baseRevision, 1);
  await store.applyRemote('cards', [remote(next)]); await store.applyRemote('cards', [ack]);
  assert.equal(store.get(card.id).word, '二'); assert.equal(store.get(card.id).revision, 2);
});

test('edit/delete concurrency is a visible conflict; keep both retains cloud tombstone and separate local card', async () => {
  const store = make(); await store.ready; const card = await save(store); const sent = await store.prepareNext(); await store.applyRemote('cards', [remote(sent)]);
  await store.save({ ...store.get(card.id), word: '編集中' });
  await store.applyRemote('cards', [remote(sent, 2, { operationId: 'op-deletion', deleted: true })]);
  assert.equal(store.getConflicts()[0].remote.deleted, true);
  await store.resolveConflict(card.id, 'both');
  assert.equal(store.get(card.id).deleted, true); assert.equal(store.list().length, 1); assert.equal(store.list()[0].word, '編集中');
});

test('progress separate from cards, transactional attempt increments, conflicts remain explicit', async () => {
  const disk = memoryAdapter(); const a = make({ adapter: disk }); const b = make({ adapter: disk }); await Promise.all([a.ready, b.ready]);
  const fields = { result: 'read', attempts: 1, updatedAt: '2026-10-06T00:00:00Z' };
  await Promise.all([a.saveProgress('word-one', fields, { increment: true }), b.saveProgress('word-one', fields, { increment: true })]);
  await a.reload(); assert.equal(a.getProgress('word-one').attempts, 2); assert.equal(a.list().length, 0);
  const op = await a.prepareNext(); assert.equal(op.kind, 'progress');
  await a.applyRemote('progress', [remote(op, 1, { operationId: 'op-other', data: { ...fields, result: 'notyet' } })]);
  assert.equal(a.getConflicts()[0].kind, 'progress');
  await a.resolveConflict('word-one', 'local', { kind: 'progress' }); assert.equal(a.getProgress('word-one').attempts, 2);
});

test('backup import merges rather than overwrites, validates before mutation, retains conflict copy', async () => {
  const source = make(); const dest = make(); await Promise.all([source.ready, dest.ready]);
  const card = await save(source); await dest.save({ ...card, word: '既存' });
  const backup = source.exportBackup(); const result = await dest.importBackup(backup);
  assert.equal(result.duplicates, 1); assert.equal(dest.list().length, 2); assert.equal(dest.get(card.id).word, '既存');
  const before = dest.exportBackup().state; backup.state.cards[card.id].data.word = 'x'.repeat(301);
  await assert.rejects(dest.importBackup(backup)); assert.deepEqual(dest.exportBackup().state, before);
});

test('no-op sync reservation and repeated baseline reads do not notify or create broadcast loops', async () => {
  const store = make(); await store.ready; let emitted = 0; store.subscribe(() => emitted++);
  assert.equal(await store.prepareNext(), null); assert.equal(emitted, 0);
  const card = await save(store); const op = await store.prepareNext(); await store.applyRemote('cards', [remote(op)]);
  emitted = 0; await store.applyRemote('cards', [remote(op)]); await store.reload(); await store.prepareNext();
  assert.equal(emitted, 0); assert.equal(store.get(card.id).syncStatus, 'synced');
});

test('stale delete rejects without removing a newer card', async () => {
  const store = make(); await store.ready; const old = await save(store);
  await store.save({ ...old, word: '新しい' });
  await assert.rejects(store.remove(old.id, { expectedRevision: old.revision, expectedLocalVersion: old.localVersion }), error => error.code === 'STALE_CARD');
  assert.equal(store.get(old.id).word, '新しい'); assert.equal(store.get(old.id).deleted, false);
});

test('backup progress differences retain both without fabricated cloud revision or whole-import failure', async () => {
  const source = make(); const target = make(); await Promise.all([source.ready, target.ready]);
  const fields = { result: 'read', attempts: 3, updatedAt: '2026-10-06T00:00:00Z' };
  await source.saveProgress('word-one', fields); await save(source, '追加');
  await target.saveProgress('word-one', { ...fields, result: 'notyet', attempts: 4 });
  const op = await target.prepareNext(); await target.applyRemote('progress', [remote(op)]);
  const result = await target.importBackup(source.exportBackup()); assert.equal(result.added, 1);
  assert.equal(target.getProgress('word-one').result, 'notyet'); assert.equal(target.getProgress('word-one').revision, 1);
  const conflict = target.getConflicts()[0]; assert.equal(conflict.source, 'backup'); assert.equal(conflict.remote.result, 'read');
  await target.resolveConflict('word-one', 'remote', { kind: 'progress' });
  assert.equal(target.getProgress('word-one').result, 'read'); assert.equal(target.getProgress('word-one').syncStatus, 'pending');
  const next = await target.prepareNext(new Set(target.list().map(card => 'cards:' + card.id)));
  assert.equal(next.baseRevision, 1, 'real original server revision is retained');
  await target.applyRemote('progress', [remote(next)]); assert.equal(target.getProgress('word-one').revision, 2);
});

test('backup conflict survives server acknowledgement and reimport is idempotent', async () => {
  const source = make(); const target = make(); await Promise.all([source.ready, target.ready]);
  const fields = { result: 'read', attempts: 3, updatedAt: '2026-10-06T00:00:00Z' };
  await source.saveProgress('word-one', fields);
  await target.saveProgress('word-one', { ...fields, result: 'notyet', attempts: 4 });
  const op = await target.prepareNext();
  await target.importBackup(source.exportBackup()); await target.importBackup(source.exportBackup());
  await target.applyRemote('progress', [remote(op)]);
  assert.equal(target.getProgress('word-one').syncStatus, 'conflict');
  await target.resolveConflict('word-one', 'local', { kind: 'progress' });
  assert.equal(target.getProgress('word-one').syncStatus, 'synced'); assert.equal(target.getState().conflictCount, 0);
});

test('a late write ack cannot erase a newer cloud conflict seen by listener', async () => {
  const store = make(); await store.ready; const card = await save(store); const op = await store.prepareNext();
  await store.applyRemote('cards', [remote(op, 2, { operationId: 'op-future', data: { ...op.data, word: '後からの変更' } })]);
  await store.applyRemote('cards', [remote(op)]);
  assert.equal(store.get(card.id).syncStatus, 'conflict'); assert.equal(store.getConflicts()[0].remote.word, '後からの変更');
  await store.resolveConflict(card.id, 'local'); assert.equal((await store.prepareNext()).baseRevision, 2);
});

test('queued conflict choice rejects if a newer cloud version arrives after comparison', async () => {
  const store = make(); await store.ready; const card = await save(store, '手元'); const op = await store.prepareNext();
  await store.applyRemote('cards', [remote(op, 1, { operationId: 'op-other-one', data: { ...op.data, word: '見ていた内容' } })]);
  const compared = store.getConflicts()[0];
  assert.equal(compared.comparisonToken, store.get(card.id).conflict.comparisonToken);
  const arriving = store.applyRemote('cards', [remote(op, 2, { operationId: 'op-other-two', data: { ...op.data, word: '比較後の更新' } })]);
  const choice = store.resolveConflict(card.id, 'remote', { expectedComparisonToken: compared.comparisonToken });
  await arriving;
  await assert.rejects(choice, error => error.code === 'STALE_CARD');
  assert.equal(store.get(card.id).word, '手元'); assert.equal(store.getConflicts()[0].remote.word, '比較後の更新');
  await assert.rejects(store.resolveConflict(card.id, 'local', { expectedLocalVersion: compared.localVersion, expectedRemoteRevision: compared.remoteRevision }), error => error.code === 'STALE_CARD');
  const current = store.getConflicts()[0];
  await store.resolveConflict(card.id, 'remote', { expectedComparisonToken: current.comparisonToken });
  assert.equal(store.get(card.id).word, '比較後の更新');
});

test('conflict comparison token rejects a newer local edit even when remote revision is unchanged', async () => {
  const store = make(); await store.ready; const card = await save(store); const op = await store.prepareNext();
  await store.applyRemote('cards', [remote(op, 1, { operationId: 'op-remote' })]);
  const compared = store.getConflicts()[0];
  await store.save({ ...store.get(card.id), word: '追加編集' });
  await assert.rejects(store.resolveConflict(card.id, 'remote', { expectedComparisonToken: compared.comparisonToken }), error => error.code === 'STALE_CARD');
  assert.equal(store.get(card.id).word, '追加編集'); assert.equal(store.getState().conflictCount, 1);
});

test('backup comparison token changes when another choice advances the alternative, even with same local version and revision', async () => {
  const one = make(); const two = make(); const target = make(); await Promise.all([one.ready, two.ready, target.ready]);
  const fields = { result: 'read', attempts: 1, updatedAt: '2026-10-06T00:00:00Z' };
  await target.saveProgress('word-one', { ...fields, result: 'notyet', attempts: 3 });
  await one.saveProgress('word-one', fields); await two.saveProgress('word-one', { ...fields, attempts: 2 });
  await target.importBackup(one.exportBackup()); await target.importBackup(two.exportBackup());
  const compared = target.getConflicts()[0];
  await target.resolveConflict('word-one', 'local', { kind: 'progress', expectedComparisonToken: compared.comparisonToken });
  const newer = target.getConflicts()[0];
  assert.equal(newer.localVersion, compared.localVersion); assert.equal(newer.remoteRevision, compared.remoteRevision);
  assert.notEqual(newer.comparisonToken, compared.comparisonToken);
  await assert.rejects(target.resolveConflict('word-one', 'remote', { kind: 'progress', expectedComparisonToken: compared.comparisonToken }), error => error.code === 'STALE_CARD');
  assert.equal(target.getProgress('word-one').attempts, 3); assert.equal(target.getState().conflictCount, 1);
});

test('shared records upgrade old schema-1 backups and merge favorite removals without resurrection', async () => {
  const a = make(), b = make(); await Promise.all([a.ready, b.ready]);
  assert.deepEqual(a.getKinds(), ['cards', 'progress', 'favorites', 'study', 'remembered']);
  await a.seedShared('legacy-baseline-v1', [{ kind: 'favorites', id: 'word-one', active: true }]);
  const add = await a.prepareNext(); const initial = remote(add);
  await a.applyRemote('favorites', [initial]); await b.applyRemote('favorites', [initial]);
  await a.updateShared('device-a', [{ kind: 'favorites', id: 'word-one', active: false }]);
  const remove = remote(await a.prepareNext(), 2); await a.applyRemote('favorites', [remove]); await b.applyRemote('favorites', [remove]);
  const { active } = require('../js/card-store.js');
  assert.equal(active(b.getShared('favorites', 'word-one')), false);
  await b.seedShared('legacy-baseline-v1', [{ kind: 'favorites', id: 'word-one', active: true }]);
  await b.applyRemote('favorites', [initial]);
  assert.equal(active(b.getShared('favorites', 'word-one')), false);
  assert.equal(b.getShared('favorites', 'word-one').syncStatus, 'synced');
  const old = { format: 'chengci-personal-cards', schemaVersion: 1, state: { schemaVersion: 1, cards: {}, progress: {} } };
  await b.importBackup(old); assert.equal(active(b.getShared('favorites', 'word-one')), false);
});

test('simultaneous observed removal and unseen re-add merge with add winning and no manual conflict', async () => {
  const a = make(), b = make(); await Promise.all([a.ready, b.ready]);
  await a.updateShared('device-a', [{ kind: 'favorites', id: 'word-one', active: true }]);
  const original = remote(await a.prepareNext()); await a.applyRemote('favorites', [original]); await b.applyRemote('favorites', [original]);
  await a.updateShared('device-a', [{ kind: 'favorites', id: 'word-one', active: false }]);
  await b.updateShared('device-b', [{ kind: 'favorites', id: 'word-one', active: false }, { kind: 'favorites', id: 'word-one', active: true }]);
  const removed = remote(await a.prepareNext(), 2); await a.applyRemote('favorites', [removed]);
  await b.prepareNext(); await b.applyRemote('favorites', [removed]);
  const retry = await b.prepareNext(); assert.equal(retry.baseRevision, 2); assert.equal(b.getState().conflictCount, 0);
  const merged = remote(retry, 3); await b.applyRemote('favorites', [merged]); await a.applyRemote('favorites', [merged]);
  const { active } = require('../js/card-store.js');
  assert.equal(active(a.getShared('favorites', 'word-one')), true);
  assert.deepEqual(a.getShared('favorites', 'word-one'), b.getShared('favorites', 'word-one'));
});

test('concurrent quiz count increments sum and automatically rebase compare-and-set conflict', async () => {
  const a = make(), b = make(); await Promise.all([a.ready, b.ready]);
  await a.updateShared('device-a', [{ kind: 'study', id: 'study-quiz-runs', increment: 2 }]);
  await b.updateShared('device-b', [{ kind: 'study', id: 'study-quiz-runs', increment: 3 }]);
  const one = remote(await a.prepareNext()); await a.applyRemote('study', [one]);
  const oldB = await b.prepareNext(); await b.applyRemote('study', [one]);
  const retry = await b.prepareNext(); assert.notEqual(retry.operationId, oldB.operationId); assert.equal(retry.baseRevision, 1);
  const two = remote(retry, 2); await b.applyRemote('study', [two]); await a.applyRemote('study', [two]);
  const { total } = require('../js/card-store.js');
  assert.equal(total(a.getShared('study', 'study-quiz-runs')), 5); assert.equal(a.getState().conflictCount, 0);
  assert.equal(await b.prepareNext(), null);
});

test('weak reset clears observed mistakes while unseen mistakes and their weak flag survive', async () => {
  const a = make(), b = make(); await Promise.all([a.ready, b.ready]);
  await a.updateShared('device-a', [{ kind: 'study', id: 'word-one', active: true, increment: 1 }]);
  const initial = remote(await a.prepareNext()); await a.applyRemote('study', [initial]); await b.applyRemote('study', [initial]);
  await a.updateShared('device-a', [{ kind: 'study', id: 'word-one', active: false, clearCounts: true }]);
  await b.updateShared('device-b', [{ kind: 'study', id: 'word-one', active: true, increment: 1 }]);
  const cleared = remote(await a.prepareNext(), 2); await a.applyRemote('study', [cleared]); await b.applyRemote('study', [cleared]);
  const merged = remote(await b.prepareNext(), 3); await a.applyRemote('study', [merged]); await b.applyRemote('study', [merged]);
  const { active, total } = require('../js/card-store.js');
  assert.equal(total(a.getShared('study', 'word-one')), 1); assert.equal(active(a.getShared('study', 'word-one')), true);
});

test('two persistent tabs increment one browser actor transactionally and shared backup imports are idempotent', async () => {
  const backing = memoryAdapter(), a = make({ adapter: backing }), b = make({ adapter: backing }); await Promise.all([a.ready, b.ready]);
  await Promise.all([a.updateShared('device-a', [{ kind: 'study', id: 'study-quiz-runs', increment: 1 }]), b.updateShared('device-a', [{ kind: 'study', id: 'study-quiz-runs', increment: 1 }])]);
  await a.reload(); assert.equal(a.getShared('study', 'study-quiz-runs').counts['device-a'], 2);
  const target = make(); await target.ready; const backup = a.exportBackup();
  await target.importBackup(backup); const before = target.exportBackup(); await target.importBackup(backup);
  assert.deepEqual(target.exportBackup(), before);
});

test('shared inflight acknowledgement preserves subsequent local increments and stale repeats are no-ops', async () => {
  const store = make(); await store.ready;
  await store.updateShared('device-a', [{ kind: 'study', id: 'study-quiz-runs', increment: 1 }]);
  const first = await store.prepareNext();
  await store.updateShared('device-a', [{ kind: 'study', id: 'study-quiz-runs', increment: 1 }]);
  await store.applyRemote('study', [remote(first)]);
  const second = await store.prepareNext(); assert.equal(second.data.counts['device-a'], 2); assert.equal(second.baseRevision, 1);
  await store.applyRemote('study', [remote(second)]); let notifications = 0; store.subscribe(() => notifications++);
  await store.applyRemote('study', [remote(first)]); await store.applyRemote('study', [remote(second)]);
  assert.equal(notifications, 0); assert.equal(store.getShared('study', 'study-quiz-runs').syncStatus, 'synced');
});

test('shared validators reject poisoned, excessive, or deleted vectors before mutating records', async () => {
  const store = make(); await store.ready; const empty = { adds: {}, removes: {} };
  const document = { schemaVersion: 1, id: 'word-one', operationId: 'op-one', revision: 1, deleted: false, updatedAt: '2026-10-06T00:00:00Z', data: empty };
  await assert.rejects(store.applyRemote('favorites', [{ ...document, deleted: true }]));
  await assert.rejects(store.applyRemote('favorites', [{ ...document, data: { adds: JSON.parse('{"__proto__":1}'), removes: {} } }]));
  await assert.rejects(store.applyRemote('favorites', [{ ...document, data: { adds: { a: 1000000001 }, removes: {} } }]));
  await assert.rejects(store.applyRemote('favorites', [{ ...document, data: { adds: Object.fromEntries(Array.from({ length: 257 }, (_, n) => ['device-' + n, 1])), removes: {} } }]));
  assert.deepEqual(store.getShared('favorites'), {});
});

test('delta checkpoints commit atomically with records, survive reload, and never transfer through backups', async () => {
  const backing = memoryAdapter(); let fail = false;
  const adapter = { read: backing.read, transact: fn => { if (fail) throw new Error('Quota'); return backing.transact(fn); } };
  const a = make({ adapter }); await a.ready;
  const doc = { schemaVersion: 1, id: 'word-one', operationId: 'op-one', revision: 1, deleted: false, updatedAt: '2026-10-06T00:00:00Z', data: { adds: { a: 1 }, removes: {} } };
  const key = 'cloudflare:https://example.test:owner:favorites';
  fail = true; await assert.rejects(a.applyRemote('favorites', [doc], { checkpointKey: key, checkpoint: 10 }), /Quota/);
  assert.equal(a.getSyncCheckpoint(key), 0); assert.equal(a.getShared('favorites', doc.id), null);
  fail = false; await a.applyRemote('favorites', [doc], { checkpointKey: key, checkpoint: 10 });
  const b = make({ adapter }); await b.ready; assert.equal(b.getSyncCheckpoint(key), 10); assert.equal(b.getShared('favorites', doc.id).adds.a, 1);
  await b.applyRemote('favorites', [], { checkpointKey: key, checkpoint: 5 }); assert.equal(b.getSyncCheckpoint(key), 10);
  const backup = b.exportBackup(); assert.equal(backup.state.syncCheckpoints, undefined);
  await b.importBackup(backup); assert.equal(b.getSyncCheckpoint(key), 0);
  await assert.rejects(b.setSyncCheckpoint('__proto__', 1));
});

test('explicit observed vectors do not clear a later same-browser event that arrived before transaction', async () => {
  const store = make(); await store.ready;
  await store.updateShared('device-a', [{ kind: 'study', id: 'word-one', active: true, increment: 1 }]);
  const seen = store.getShared('study', 'word-one');
  await store.updateShared('device-a', [{ kind: 'study', id: 'word-one', active: true, increment: 1 }]);
  await store.updateShared('device-a', [{ kind: 'study', id: 'word-one', active: false, clearCounts: true, observedAdds: seen.adds, observedCounts: seen.counts }]);
  const { active, total } = require('../js/card-store.js');
  assert.equal(total(store.getShared('study', 'word-one')), 1); assert.equal(active(store.getShared('study', 'word-one')), true);
});

test('old schema-1 device data gains shared records on the first write without losing cards', async () => {
  const disk = memoryAdapter({ schemaVersion: 1, cards: {}, progress: {} });
  const store = make({ adapter: disk }); await store.ready;
  await store.updateShared('device-a', [{ kind: 'study', id: 'study-quiz-runs', increment: 1 }]);
  assert.equal(store.getShared('study', 'study-quiz-runs').counts['device-a'], 1);
});

test('persistent study actor shares the data lineage, never exports, and rotates after device-data removal', async () => {
  const disk = memoryAdapter(), a = make({ adapter: disk }), b = make({ adapter: disk }); await Promise.all([a.ready, b.ready]);
  const ids = await Promise.all([a.ensureStudyActorId('device-a'), b.ensureStudyActorId('device-b')]);
  assert.deepEqual(ids, ['device-a', 'device-a']);
  await a.updateShared(ids[0], [{ kind: 'study', id: 'study-quiz-runs', increment: 1 }]);
  const backup = a.exportBackup(); assert.equal(backup.state.studyActorId, undefined);
  await a.setPersistence(false); assert.equal((await disk.read()).studyActorId, null);
  const reopened = make({ adapter: disk }); await reopened.ready;
  assert.equal(await reopened.ensureStudyActorId('device-new-lineage'), 'device-new-lineage');
  await reopened.importBackup(backup);
  assert.equal(await reopened.ensureStudyActorId('unused'), 'device-new-lineage');
  await reopened.updateShared('device-new-lineage', [{ kind: 'study', id: 'study-quiz-runs', increment: 1 }]);
  const { total } = require('../js/card-store.js'); assert.equal(total(reopened.getShared('study', 'study-quiz-runs')), 2);
});
