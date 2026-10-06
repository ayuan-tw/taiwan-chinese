import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createWorker, testing } from '../worker.mjs';
import { createDB } from './sqlite-d1.mjs';
import { TEST_OWNER_EMAIL } from './test-config.mjs';
const NOW = Date.parse('2026-10-06T00:00:00.000Z');
const DATE = new Date(NOW).toISOString();
const ORIGIN = 'https://vocabulary.example';
const now = () => NOW;
const card = (id = 'personal-example', operationId = 'op-card', baseRevision = 0, overrides = {}) => ({ kind: 'cards', id, operationId, baseRevision, deleted: false, updatedAt: DATE, data: { word: '自分の語彙', zhuyin: '', meaning: '編集内容', example: '例文', exampleZhuyin: '', note: '消さない', pronunciationStatus: 'candidate' }, ...overrides });
const learning = (kind = 'favorites', id = 'word-example', operationId = 'op-favorite') => ({ kind, id, operationId, baseRevision: 0, deleted: false, updatedAt: DATE, data: kind === 'progress' ? { result: 'read', attempts: 3, updatedAt: DATE } : kind === 'study' ? { adds: { oldDevice: 1 }, removes: {}, counts: { oldDevice: 4 }, cleared: {} } : { adds: { oldDevice: 1 }, removes: {} } });
async function app() {
  const DB = createDB(), token = testing.randomToken();
  const worker = createWorker({ now, fetch: () => { throw new Error('No external call in local migration tests'); } });
  const env = { DB, SYNC_ENABLED: 'true', APP_ORIGIN: ORIGIN, GOOGLE_CLIENT_ID: '123-approved.apps.googleusercontent.com', OWNER_EMAIL: TEST_OWNER_EMAIL, OWNER_SUB: 'owner' };
  await DB.prepare('INSERT INTO sessions (token_hash,owner_sub,email,persistent,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind(await testing.sha256(token), 'owner', TEST_OWNER_EMAIL, 1, NOW/1000, NOW/1000+3600).run();
  const authHeaders = { Cookie: testing.SESSION_COOKIE + '=' + token, Origin: ORIGIN, 'Content-Type': 'application/json', 'X-CSRF-Token': await testing.sha256('chengci-api-csrf-v1:' + token) };
  return { DB, worker, env, authHeaders, request: (path, options = {}) => worker.fetch(new Request(ORIGIN + path, options), env),
    post: (path, body, headers = {}) => worker.fetch(new Request(ORIGIN + path, { method: 'POST', headers: { ...authHeaders, ...headers }, body: JSON.stringify(body) }), env) };
}

test('additive schema application preserves all original records and does not bootstrap or reset', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  db.prepare('INSERT INTO documents (kind,id,operation_id,revision,deleted,updated_at,data_json) VALUES (?,?,?,?,?,?,?)').run('favorites', 'word-existing', 'op-old', 1, 0, DATE, JSON.stringify({ adds: { device: 1 }, removes: {} }));
  const original = db.prepare('SELECT * FROM documents').all();
  const clock = db.prepare('SELECT * FROM sync_clock').all();
  db.exec(readFileSync(new URL('../migrations/0002_unified_vocabulary.sql', import.meta.url), 'utf8'));
  assert.deepEqual(db.prepare('SELECT * FROM documents').all(), original);
  assert.deepEqual(db.prepare('SELECT * FROM sync_clock').all(), clock);
  assert.equal(db.prepare('SELECT version FROM vocabulary_state').get().version, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM vocabulary_backups').get().n, 0); db.close();
});

test('checked-in seed exactly matches all bundled stable word IDs and keeps all lexical metadata', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../generate-vocabulary-seed.mjs', import.meta.url)), '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(testing.vocabularySeed.length, 152);
  assert.equal(new Set(testing.vocabularySeed.map(item => item.id)).size, 152);
  assert.ok(Buffer.byteLength(JSON.stringify(testing.vocabularySeed)) < 2_000_000);
  for (const { id, data } of testing.vocabularySeed) {
    assert.match(id, /^word-/);
    assert.ok(Object.hasOwn(data, 'confuse')); assert.ok(Object.hasOwn(data, 'category')); assert.ok(Array.isArray(data.tags));
    assert.deepEqual(testing.validateOperation(card(id, 'seed-test', 0, { data })).data, data);
  }
});

test('bootstrap atomically archives old state, preserves personal cards, seeds 152 words and resets only learning', async () => {
  const DB = createDB();
  await testing.applyOperation(DB, card(), now);
  for (const kind of ['favorites', 'study', 'progress', 'remembered']) await testing.applyOperation(DB, learning(kind, 'word-example', 'op-' + kind), now);
  const before = [...DB.sqlite.prepare('SELECT * FROM documents').all(), ...DB.sqlite.prepare('SELECT * FROM remembered_documents').all()];
  const migrated = await testing.bootstrapVocabulary(DB, now);
  assert.deepEqual(migrated, { version: 1, epoch: 1, ready: true, backupId: 'unified-words-v1', migratedAt: DATE });
  assert.equal(DB.sqlite.prepare("SELECT COUNT(*) AS n FROM documents WHERE kind='cards'").get().n, 153);
  assert.equal(DB.sqlite.prepare("SELECT COUNT(*) AS n FROM documents WHERE kind!='cards'").get().n, 0);
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM remembered_documents').get().n, 0);
  assert.equal(JSON.parse(DB.sqlite.prepare("SELECT data_json FROM documents WHERE id='personal-example'").get().data_json).note, '消さない');
  for (const row of before) {
    const saved = DB.sqlite.prepare('SELECT * FROM vocabulary_backup_documents WHERE kind=? AND id=?').get(row.kind, row.id);
    for (const [key, value] of Object.entries(row)) assert.equal(saved[key], value, key);
  }
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM retired_learning_operations').get().n, 4); DB.close();
});

test('bootstrap preserves edited bundled IDs and tombstones and fills only absent category tags and confuse', async () => {
  const DB = createDB(); const [edited, deleted, customized] = testing.vocabularySeed;
  await testing.applyOperation(DB, card(edited.id, 'edit-before'), now);
  await testing.applyOperation(DB, card(deleted.id, 'delete-before', 0, { deleted: true }), now);
  const customData = { ...card().data, category: '独自分類', tags: ['私のタグ'], confuse: '私の比較' };
  await testing.applyOperation(DB, card(customized.id, 'custom-before', 0, { data: customData }), now);
  await testing.bootstrapVocabulary(DB, now);
  const read = id => DB.sqlite.prepare("SELECT * FROM documents WHERE kind='cards' AND id=?").get(id);
  const edit = read(edited.id);
  assert.equal(JSON.parse(edit.data_json).meaning, '編集内容'); assert.equal(edit.revision, 2);
  assert.equal(JSON.parse(edit.data_json).category, edited.data.category); assert.deepEqual(JSON.parse(edit.data_json).tags, edited.data.tags);
  assert.equal(read(deleted.id).deleted, 1); assert.equal(read(customized.id).revision, 1); assert.deepEqual(JSON.parse(read(customized.id).data_json), customData);
  const staleEdit = await testing.applyOperation(DB, card(edited.id, 'offline-old-edit', 1), now, 1);
  assert.equal(staleEdit.status, 'conflict'); assert.equal(staleEdit.document.revision, 2); DB.close();
});

test('repeated and concurrent bootstraps do not reset newer learning or reinsert deleted words', async () => {
  const DB = createDB(); const [a, b] = await Promise.all([testing.bootstrapVocabulary(DB, now), testing.bootstrapVocabulary(DB, now)]); assert.deepEqual(a, b);
  const first = testing.vocabularySeed[0];
  await testing.applyOperation(DB, card(first.id, 'after-delete', 1, { data: first.data, deleted: true }), now, 1);
  await testing.applyOperation(DB, learning('favorites', 'word-new-learning', 'op-new-learning'), now, 1);
  const before = DB.sqlite.prepare('SELECT * FROM documents ORDER BY kind,id').all();
  await testing.bootstrapVocabulary(DB, () => NOW + 100000);
  assert.deepEqual(DB.sqlite.prepare('SELECT * FROM documents ORDER BY kind,id').all(), before);
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM vocabulary_backups').get().n, 1); DB.close();
});

test('failure at the final migration step rolls back backup, seed, reset, metadata, clock and epoch', async () => {
  const DB = createDB(); await testing.applyOperation(DB, learning(), now);
  const original = DB.sqlite.prepare('SELECT * FROM documents').all(); const clock = DB.sqlite.prepare('SELECT value FROM sync_clock').get().value;
  DB.sqlite.exec("CREATE TRIGGER fail_migration BEFORE UPDATE ON vocabulary_state BEGIN SELECT RAISE(ABORT, 'injected migration failure'); END;");
  await assert.rejects(testing.bootstrapVocabulary(DB, now), /injected migration failure/);
  assert.deepEqual(DB.sqlite.prepare('SELECT * FROM documents').all(), original);
  assert.equal(DB.sqlite.prepare('SELECT value FROM sync_clock').get().value, clock);
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM vocabulary_backups').get().n, 0);
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM vocabulary_backup_documents').get().n, 0);
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM retired_learning_operations').get().n, 0);
  assert.equal((await testing.vocabularyState(DB)).epoch, 0);
  DB.sqlite.exec('DROP TRIGGER fail_migration'); assert.equal((await testing.bootstrapVocabulary(DB, now)).ready, true); DB.close();
});

test('epoch is checked within the SQL transaction so a delayed pre-reset write cannot reappear', async () => {
  const DB = createDB(); const old = learning();
  await testing.bootstrapVocabulary(DB, now);
  await assert.rejects(testing.applyOperation(DB, old, now, 0), error => error.status === 409 && error.code === 'vocabulary_epoch_changed');
  assert.equal(DB.sqlite.prepare("SELECT COUNT(*) AS n FROM documents WHERE kind='favorites'").get().n, 0);
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM operation_receipts').get().n, 0); DB.close();
});

test('retired learning receipt cannot be replayed with new epoch, while a lexical outbox receipt survives', async () => {
  const DB = createDB(), oldFavorite = learning(), oldCard = card();
  await testing.applyOperation(DB, oldFavorite, now); await testing.applyOperation(DB, oldCard, now);
  await testing.bootstrapVocabulary(DB, now);
  await assert.rejects(testing.applyOperation(DB, oldFavorite, now, 1), error => error.status === 409 && error.code === 'retired_learning_operation');
  assert.equal((await testing.applyOperation(DB, oldCard, now, 1)).status, 'accepted');
  assert.equal(DB.sqlite.prepare("SELECT COUNT(*) AS n FROM documents WHERE kind='favorites'").get().n, 0); DB.close();
});

test('remembered is independent reversible synced state and does not change per-round progress', async () => {
  const DB = createDB(); await testing.bootstrapVocabulary(DB, now);
  const progress = learning('progress', 'word-example', 'read-this-round');
  await testing.applyOperation(DB, progress, now, 1);
  const remembered = learning('remembered', 'word-example', 'remember-word');
  const accepted = await testing.applyOperation(DB, remembered, now, 1); assert.equal(accepted.status, 'accepted');
  const revert = { ...remembered, operationId: 'unremember-word', baseRevision: 1, data: { adds: { oldDevice: 1 }, removes: { oldDevice: 1 } } };
  assert.equal((await testing.applyOperation(DB, revert, now, 1)).document.revision, 2);
  assert.deepEqual(JSON.parse(DB.sqlite.prepare("SELECT data_json FROM documents WHERE kind='progress'").get().data_json), progress.data);
  assert.throws(() => testing.validateOperation({ ...remembered, deleted: true }), /invalid_vector_record/); DB.close();
});

test('owner, origin, CSRF and exact bootstrap version guard the migration before any changes', async () => {
  const a = await app();
  assert.equal((await a.request('/api/vocabulary/bootstrap', { method: 'POST', headers: { Origin: ORIGIN }, body: '{}' })).status, 401);
  assert.equal((await a.post('/api/vocabulary/bootstrap', { version: 1 }, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await a.post('/api/vocabulary/bootstrap', { version: 1 }, { 'X-CSRF-Token': 'wrong' })).status, 403);
  for (const body of [{}, { version: 2 }, { version: 1, seed: [] }]) assert.equal((await a.post('/api/vocabulary/bootstrap', body)).status, 400);
  assert.equal((await testing.vocabularyState(a.DB)).ready, false);
  assert.equal((await a.post('/api/vocabulary/bootstrap', { version: 1 })).status, 200);
  assert.equal((await (await a.request('/api/session', { headers: a.authHeaders })).json()).vocabulary.epoch, 1);
  assert.equal((await (await a.request('/api/config')).json()).vocabularyVersion, 1); a.DB.close();
});

test('old-version API clients must refresh before reading unified cards or writing any stale state', async () => {
  const a = await app(); await a.post('/api/vocabulary/bootstrap', { version: 1 });
  for (const kind of ['cards', 'progress', 'favorites', 'study', 'remembered']) {
    assert.equal((await a.request('/api/' + kind, { headers: a.authHeaders })).status, 409);
    const response = await a.request('/api/' + kind, { headers: { ...a.authHeaders, 'X-Chengci-Epoch': '1' } }); assert.equal(response.status, 200); assert.equal((await response.json()).epoch, 1);
  }
  for (const epoch of ['0', '2', '01', 'NaN', '-1']) assert.equal((await a.post('/api/sync', { operations: [card()] }, { 'X-Chengci-Epoch': epoch })).status, 409);
  assert.equal((await a.post('/api/sync', { operations: [card()] }, { 'X-Chengci-Epoch': '1' })).status, 200); a.DB.close();
});

test('owner can recover every archived document through bounded immutable private backup pages', async () => {
  const a = await app();
  const insert = a.DB.sqlite.prepare('INSERT INTO documents (kind,id,operation_id,revision,deleted,updated_at,data_json) VALUES (?,?,?,?,?,?,?)');
  for (let index = 0; index < 301; index++) insert.run('favorites', 'archive-' + index, 'archive-op-' + index, 1, 0, DATE, JSON.stringify({ adds: { legacy: index }, removes: {} }));
  await testing.bootstrapVocabulary(a.DB, now);
  assert.equal((await a.request('/api/vocabulary/backup')).status, 401);
  const firstResponse = await a.request('/api/vocabulary/backup', { headers: a.authHeaders }); assert.match(firstResponse.headers.get('Cache-Control'), /no-store/);
  const first = await firstResponse.json(); assert.equal(first.backup.documentCount, 301); assert.equal(first.documents.length, 250); assert.ok(first.cursor);
  const second = await (await a.request('/api/vocabulary/backup?cursor=' + first.cursor, { headers: a.authHeaders })).json();
  assert.equal(second.documents.length, 51); assert.equal(second.cursor, null);
  assert.equal(new Set([...first.documents, ...second.documents].map(item => item.kind + ':' + item.id)).size, 301);
  assert.equal((await a.request('/api/vocabulary/backup?cursor=01', { headers: a.authHeaders })).status, 400);
  assert.equal((await a.request('/api/vocabulary/backup?cursor=1&cursor=2', { headers: a.authHeaders })).status, 400); a.DB.close();
});

test('a built-in example edit is canonical for later devices and repeat bootstrap never restores seed text', async () => {
  const a = await app(); await testing.bootstrapVocabulary(a.DB, now);
  const seeded = testing.vocabularySeed[0];
  const data = { ...seeded.data, example: '至少今天可以換成自己的例句。', exampleZhuyin: 'ㄓˋ ㄕㄠˇ ㄐㄧㄣ ㄊㄧㄢ', meaning: '自分で編集した意味', zhuyin: 'ㄓˋ ㄕㄠˇ', pronunciationStatus: 'candidate' };
  const save = await a.post('/api/sync', { operations: [card(seeded.id, 'replace-built-in-example', 1, { data })] }, { 'X-Chengci-Epoch': '1' });
  assert.equal(save.status, 200); assert.equal((await save.json()).results[0].status, 'accepted');
  await testing.bootstrapVocabulary(a.DB, () => NOW + 10000);
  const downloaded = await (await a.request('/api/cards', { headers: { ...a.authHeaders, 'X-Chengci-Epoch': '1' } })).json();
  const edited = downloaded.documents.find(item => item.id === seeded.id);
  assert.deepEqual(edited.data, data); assert.equal(edited.revision, 2); a.DB.close();
});
