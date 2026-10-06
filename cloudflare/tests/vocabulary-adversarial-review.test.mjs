import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createWorker, testing } from '../worker.mjs';
import { createDB } from './sqlite-d1.mjs';
import { TEST_OWNER_EMAIL } from './test-config.mjs';

// Local SQLite/Worker adversarial review only. No live D1, login or network use.
const NOW = Date.parse('2026-10-06T00:00:00.000Z');
const DATE = new Date(NOW).toISOString();
const ORIGIN = 'https://vocabulary-review.example';
const now = () => NOW;
const card = (id = 'personal-review', operationId = 'review-card', baseRevision = 0) => ({
  kind: 'cards', id, operationId, baseRevision, deleted: false, updatedAt: DATE,
  data: { word: '原本', zhuyin: 'ㄩㄢˊ ㄅㄣˇ', meaning: '編集済みの意味', example: '原本如此。', exampleZhuyin: '', note: '個人のメモ', pronunciationStatus: 'confirmed' }
});
const vector = (kind, operationId = 'review-' + kind) => ({ kind, id: 'shared-review', operationId, baseRevision: 0, deleted: false, updatedAt: DATE,
  data: kind === 'progress' ? { result: 'read', attempts: 3, updatedAt: DATE } : { adds: { review: 1 }, removes: {}, ...(kind === 'study' ? { counts: { review: 3 }, cleared: {} } : {}) }
});
const rows = (DB, table) => JSON.parse(JSON.stringify(DB.sqlite.prepare('SELECT * FROM ' + table + ' ORDER BY rowid').all()));

async function fixture() {
  const DB = createDB();
  const token = testing.randomToken();
  await DB.prepare('INSERT INTO sessions (token_hash, owner_sub, email, persistent, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(await testing.sha256(token), 'review-owner', TEST_OWNER_EMAIL, 0, NOW / 1000, NOW / 1000 + 3600).run();
  const csrf = await testing.sha256('chengci-api-csrf-v1:' + token);
  const env = { DB, SYNC_ENABLED: 'true', APP_ORIGIN: ORIGIN, GOOGLE_CLIENT_ID: '123-review.apps.googleusercontent.com', OWNER_EMAIL: TEST_OWNER_EMAIL, OWNER_SUB: 'review-owner' };
  const worker = createWorker({ now, fetch() { throw Error('Unexpected network access'); } });
  const request = (path, { body, epoch, auth = true, csrfValid = true, origin = ORIGIN } = {}) => worker.fetch(new Request(ORIGIN + path, {
    method: body === undefined ? 'GET' : 'POST', headers: {
      ...(auth ? { Cookie: testing.SESSION_COOKIE + '=' + token } : {}),
      ...(epoch === undefined ? {} : { 'X-Chengci-Epoch': String(epoch) }),
      ...(body === undefined ? {} : { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrfValid ? csrf : 'bad' })
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) })
  }), env);
  return { DB, request };
}

test('seed has exactly 152 unique validated stable IDs and fits a D1 binding', () => {
  assert.equal(testing.vocabularySeed.length, 152);
  assert.equal(new Set(testing.vocabularySeed.map(item => item.id)).size, 152);
  assert.ok(Buffer.byteLength(JSON.stringify(testing.vocabularySeed)) < 2_000_000);
  for (const [index, item] of testing.vocabularySeed.entries()) testing.validateOperation({ ...card(item.id, 'seed-review-' + index), data: item.data });
});

test('schema migration is additive and can be reapplied without changing any rows', async () => {
  const DB = createDB();
  try {
    await testing.applyOperation(DB, card(), now);
    const before = rows(DB, 'documents');
    const sql = readFileSync(new URL('../migrations/0002_unified_vocabulary.sql', import.meta.url), 'utf8');
    assert.doesNotMatch(sql, /\b(?:DROP|ALTER|DELETE|UPDATE)\s+(?:TABLE\s+)?documents\b/i);
    DB.sqlite.exec(sql);
    assert.deepEqual(rows(DB, 'documents'), before);
    assert.equal((await testing.vocabularyState(DB)).epoch, 0);
  } finally { DB.close(); }
});

test('bootstrap archives every kind and tombstone verbatim, preserves lexical edits, and atomically resets learning', async () => {
  const DB = createDB();
  try {
    const tombstone = { ...card(testing.vocabularySeed[0].id, 'review-tombstone'), deleted: true };
    await testing.applyOperation(DB, tombstone, now);
    const personal = card();
    personal.data = { ...personal.data, category: '自分の分類', tags: ['自分のタグ'], confuse: '特別な区別' };
    await testing.applyOperation(DB, personal, now);
    for (const kind of ['progress', 'favorites', 'study', 'remembered']) await testing.applyOperation(DB, vector(kind), now);
    const before = [...rows(DB, 'documents'), ...rows(DB, 'remembered_documents')];
    const receipts = rows(DB, 'operation_receipts');
    const migrated = await testing.bootstrapVocabulary(DB, now);
    assert.deepEqual({ version: migrated.version, epoch: migrated.epoch, ready: migrated.ready }, { version: 1, epoch: 1, ready: true });
    const archived = rows(DB, 'vocabulary_backup_documents').map(({ backup_id, ...row }) => row);
    assert.deepEqual(archived, before);
    assert.deepEqual(rows(DB, 'operation_receipts'), receipts, 'receipts remain immutable');
    assert.equal(rows(DB, 'retired_learning_operations').length, 4);
    const documents = rows(DB, 'documents');
    assert.equal(documents.length, 153);
    assert.ok(documents.every(row => row.kind === 'cards'));
    assert.equal(rows(DB, 'remembered_documents').length, 0);
    assert.deepEqual(documents.find(row => row.id === personal.id), before.find(row => row.id === personal.id));
    const remoteTombstone = documents.find(row => row.id === tombstone.id);
    assert.equal(remoteTombstone.deleted, 1);
    assert.equal(remoteTombstone.revision, 2);
    const tombstoneData = JSON.parse(remoteTombstone.data_json);
    for (const [key, value] of Object.entries(tombstone.data)) assert.deepEqual(tombstoneData[key], value);
    const after = rows(DB, 'documents');
    assert.equal((await testing.bootstrapVocabulary(DB, now)).epoch, 1);
    assert.deepEqual(rows(DB, 'documents'), after);
    assert.deepEqual(rows(DB, 'vocabulary_backup_documents').map(({ backup_id, ...row }) => row), before);
  } finally { DB.close(); }
});

test('bootstrap requires the authenticated owner, same origin, correct CSRF and exact version', async () => {
  const { DB, request } = await fixture();
  try {
    for (const [options, status] of [[{ auth: false }, 401], [{ csrfValid: false }, 403], [{ origin: 'https://evil.example' }, 403]]) {
      assert.equal((await request('/api/vocabulary/bootstrap', { body: { version: 1 }, ...options })).status, status);
    }
    assert.equal((await request('/api/vocabulary/bootstrap', { body: { version: 2 } })).status, 400);
    assert.equal((await testing.vocabularyState(DB)).epoch, 0);
    assert.equal((await request('/api/vocabulary/bootstrap', { body: { version: 1 } })).status, 200);
  } finally { DB.close(); }
});

test('after migration all five reads and writes reject missing or stale epochs', async () => {
  const { DB, request } = await fixture();
  try {
    await testing.bootstrapVocabulary(DB, now);
    for (const epoch of [undefined, 0, '01', -1, 2]) {
      for (const kind of ['cards', 'progress', 'favorites', 'study', 'remembered']) {
        assert.equal((await request('/api/' + kind, { epoch })).status, 409, kind + ':' + epoch);
      }
      assert.equal((await request('/api/sync', { epoch, body: { operations: [card()] } })).status, 409);
    }
    assert.equal((await request('/api/cards', { epoch: 1 })).status, 200);
    assert.equal(rows(DB, 'documents').length, 152);
  } finally { DB.close(); }
});

test('old acknowledged learning receipts cannot replay even with the current epoch', async () => {
  const DB = createDB();
  try {
    const operations = ['progress', 'favorites', 'study', 'remembered'].map(kind => vector(kind));
    for (const operation of operations) await testing.applyOperation(DB, operation, now);
    await testing.bootstrapVocabulary(DB, now);
    for (const operation of operations) await assert.rejects(testing.applyOperation(DB, operation, now, 1), { code: 'retired_learning_operation' });
    assert.ok(rows(DB, 'documents').every(row => row.kind === 'cards'));
    assert.equal(rows(DB, 'remembered_documents').length, 0);
  } finally { DB.close(); }
});

test('bootstrap serializes with writes; a write losing the epoch race never mutates or gets a receipt', async () => {
  const DB = createDB();
  try {
    // applyOperation yields for WebCrypto before its transaction. Bootstrap wins.
    const writing = testing.applyOperation(DB, card(), now, 0);
    const bootstrapping = testing.bootstrapVocabulary(DB, now);
    const [write, bootstrap] = await Promise.allSettled([writing, bootstrapping]);
    assert.equal(bootstrap.status, 'fulfilled');
    assert.equal(write.status, 'rejected');
    assert.equal(write.reason.code, 'vocabulary_epoch_changed');
    assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM documents WHERE id = ?').get('personal-review').n, 0);
    assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM operation_receipts WHERE operation_id = ?').get('review-card').n, 0);
  } finally { DB.close(); }
});

test('two simultaneous bootstraps archive/reset once and leave post-bootstrap learning untouched', async () => {
  const DB = createDB();
  try {
    await testing.applyOperation(DB, vector('study'), now);
    const result = await Promise.all([testing.bootstrapVocabulary(DB, now), testing.bootstrapVocabulary(DB, now)]);
    assert.ok(result.every(state => state.epoch === 1));
    assert.equal(rows(DB, 'vocabulary_backups').length, 1);
    assert.equal(rows(DB, 'vocabulary_backup_documents').length, 1);
    await testing.applyOperation(DB, vector('study', 'new-study'), now, 1);
    await testing.bootstrapVocabulary(DB, now);
    assert.equal(DB.sqlite.prepare("SELECT COUNT(*) AS n FROM documents WHERE kind = 'study'").get().n, 1);
  } finally { DB.close(); }
});

test('a failed archive rolls back seeding, learning reset, metadata edits and epoch', async () => {
  const DB = createDB();
  try {
    await testing.applyOperation(DB, card(testing.vocabularySeed[0].id), now);
    await testing.applyOperation(DB, vector('favorites'), now);
    const before = rows(DB, 'documents');
    const clock = rows(DB, 'sync_clock');
    DB.sqlite.exec("CREATE TRIGGER review_fail_archive BEFORE INSERT ON vocabulary_backup_documents BEGIN SELECT RAISE(ABORT, 'archive failure'); END;");
    await assert.rejects(testing.bootstrapVocabulary(DB, now));
    assert.deepEqual(rows(DB, 'documents'), before);
    assert.deepEqual(rows(DB, 'sync_clock'), clock);
    assert.equal((await testing.vocabularyState(DB)).epoch, 0);
    assert.equal(rows(DB, 'vocabulary_backups').length, 0);
    assert.equal(rows(DB, 'retired_learning_operations').length, 0);
  } finally { DB.close(); }
});

test('a partial archive cannot pass the count invariant or commit a reset', async () => {
  const DB = createDB();
  try {
    await testing.applyOperation(DB, card(), now);
    await testing.applyOperation(DB, vector('study'), now);
    const before = rows(DB, 'documents');
    DB.sqlite.exec("CREATE TRIGGER review_skip_archive BEFORE INSERT ON vocabulary_backup_documents WHEN NEW.kind = 'study' BEGIN SELECT RAISE(IGNORE); END;");
    await assert.rejects(testing.bootstrapVocabulary(DB, now));
    assert.deepEqual(rows(DB, 'documents'), before);
    assert.equal((await testing.vocabularyState(DB)).epoch, 0);
    assert.equal(rows(DB, 'vocabulary_backups').length, 0);
  } finally { DB.close(); }
});

test('an operation-ID collision with a seed must conflict, never falsely acknowledge a different lexical payload', async () => {
  const DB = createDB();
  try {
    await testing.bootstrapVocabulary(DB, now);
    const id = testing.vocabularySeed[0].id;
    const operation = card(id, 'seed-v1-' + id, 0);
    const result = await testing.applyOperation(DB, operation, now, 1);
    assert.equal(result.status, 'conflict');
    assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM operation_receipts WHERE operation_id = ?').get(operation.operationId).n, 0);
  } finally { DB.close(); }
});

test('an operation-ID collision with supplemented metadata must not acknowledge a stale lexical edit', async () => {
  const DB = createDB();
  try {
    const id = testing.vocabularySeed[0].id;
    await testing.applyOperation(DB, card(id), now);
    await testing.bootstrapVocabulary(DB, now);
    const operation = card(id, 'bootstrap-v1-' + id, 1);
    operation.data.meaning = '別の未保存の編集';
    const result = await testing.applyOperation(DB, operation, now, 1);
    assert.equal(result.status, 'conflict');
    assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM operation_receipts WHERE operation_id = ?').get(operation.operationId).n, 0);
  } finally { DB.close(); }
});

test('bootstrap between the epoch read and document page read cannot return a misleading old-epoch empty delta', async () => {
  const { DB, request } = await fixture();
  try {
    await testing.applyOperation(DB, vector('favorites'), now);
    const prepare = DB.prepare.bind(DB);
    let injected = false;
    DB.prepare = sql => {
      function wrap(statement) {
        return {
          ...statement,
          bind(...args) { return wrap(statement.bind(...args)); },
          async all() {
            if (!injected && /^SELECT \* FROM documents WHERE kind =/.test(sql)) {
              injected = true;
              await testing.bootstrapVocabulary(DB, now);
            }
            return statement.all();
          }
        };
      }
      return wrap(prepare(sql));
    };
    const response = await request('/api/favorites', { epoch: 0 });
    assert.equal(injected, true);
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: 'vocabulary_epoch_changed' });
  } finally { DB.close(); }
});

test('a bootstrap between two sync operations retires the first and rejects the second without resurrecting learning', async () => {
  const { DB, request } = await fixture();
  try {
    const batch = DB.batch.bind(DB);
    let injected = false;
    DB.batch = async statements => {
      const result = await batch(statements);
      if (!injected) {
        injected = true;
        await testing.bootstrapVocabulary(DB, now);
      }
      return result;
    };
    const response = await request('/api/sync', { epoch: 0, body: { operations: [vector('study'), vector('favorites')] } });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: 'vocabulary_epoch_changed' });
    assert.ok(rows(DB, 'documents').every(row => row.kind === 'cards'));
    assert.equal(rows(DB, 'vocabulary_backup_documents').length, 1);
    assert.equal(rows(DB, 'operation_receipts').length, 1);
    assert.equal(rows(DB, 'retired_learning_operations').length, 1);
  } finally { DB.close(); }
});

test('maximal sync request fits its 50-statement budget and bootstrap binds the seed without per-word placeholders', async () => {
  const { DB, request } = await fixture();
  try {
    const prepare = DB.prepare.bind(DB), batch = DB.batch.bind(DB);
    const metrics = { statements: 0, maxBindings: 0, maxStatementBytes: 0, maxStringBindingBytes: 0 };
    DB.prepare = sql => {
      metrics.maxStatementBytes = Math.max(metrics.maxStatementBytes, Buffer.byteLength(sql));
      function wrap(statement) {
        return {
          ...statement,
          bind(...args) {
            metrics.maxBindings = Math.max(metrics.maxBindings, args.length);
            metrics.maxStringBindingBytes = Math.max(metrics.maxStringBindingBytes, ...args.filter(value => typeof value === 'string').map(value => Buffer.byteLength(value)));
            return wrap(statement.bind(...args));
          },
          async first() { metrics.statements++; return statement.first(); },
          async all() { metrics.statements++; return statement.all(); },
          async run() { metrics.statements++; return statement.run(); }
        };
      }
      return wrap(prepare(sql));
    };
    DB.batch = statements => { metrics.statements += statements.length; return batch(statements); };
    assert.equal((await request('/api/vocabulary/bootstrap', { body: { version: 1 } })).status, 200);
    assert.equal(metrics.statements, 10);
    assert.ok(metrics.maxBindings <= 100);
    assert.equal(metrics.maxStringBindingBytes, Buffer.byteLength(JSON.stringify(testing.vocabularySeed)));
    assert.ok(metrics.maxStringBindingBytes < 100_000);
    metrics.statements = 0;
    const operations = Array.from({ length: 10 }, (_, index) => card('budget-card-' + index, 'budget-op-' + index));
    assert.equal((await request('/api/sync', { epoch: 1, body: { operations } })).status, 200);
    assert.equal(metrics.statements, 42);
    assert.ok(metrics.maxBindings <= 100);
    assert.ok(metrics.maxStatementBytes < 100_000);
  } finally { DB.close(); }
});
