const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { createMigration, FORMAT } = require('../js/legacy-migration.js');
const NOW = '2026-10-06T00:00:00.000Z';
function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  let writes = 0;
  return {
    values, get writes() { return writes; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { writes++; values.set(key, String(value)); },
    removeItem(key) { writes++; values.delete(key); }
  };
}
function make(initial, options = {}) {
  const disk = initial?.getItem ? initial : storage(initial);
  const env = { localStorage: disk, location: { origin: 'https://old.github.io', pathname: '/chengci/?token=never-copy' }, ...options.env };
  const api = createMigration({ env, now: () => NOW, ...options });
  // Most tests exercise the explicitly selected full legacy migration.
  const configured = { ...api,
    exportBackup: opts => api.exportBackup({ includeHistory: true, includePreferences: true, ...opts }),
    importBackup: (data, opts) => api.importBackup(data, { includeHistory: true, includePreferences: true, ...opts })
  };
  return { disk, api: configured, defaults: api };
}
function backup(legacy = {}, extra = {}) { return { format: FORMAT, schemaVersion: 1, exportedAt: NOW, source: { origin: 'https://old.github.io' }, legacy, ...extra }; }
function saved(disk, key) { return JSON.parse(disk.getItem(key)); }

test('old-origin export works without card store and exports only the allowlist', async () => {
  const { api, disk } = make({ favorites: '["敢","敢"]', weakWords: '["敢"]', mistakeCounts: '{"敢":3}', weakCards: '["只好＋V"]', patternMistakeCounts: '{"只好＋V":2}', weakIdioms: '["慣用"]', idiomMistakeCounts: '{"慣用":4}', quizCount: '7', chengciStudyScope: '{"types":["word"],"tags":["会話"]}', audioPrefs: '{"rate":0.9,"autoSpeak":false}', freeSpeakPrefs: '{"repeat":3,"gap":500}', audioQuizMode: 'typing', freeSpeakText: 'private pasted text', token: 'secret', firebaseAuth: 'secret', chengciPersonalPersistenceV1: 'device', chengciAutoUpdateCheck: '0', chengciActiveTab: 'practice' });
  const result = await api.exportBackup();
  assert.equal(result.format, FORMAT); assert.equal(result.schemaVersion, 1); assert.equal(result.source.origin, 'https://old.github.io');
  assert.deepEqual(result.legacy.favorites, ['敢']); assert.equal(result.legacy.quizRuns, 7);
  assert.equal(result.preferences.audioQuizMode, 'typing'); assert.equal(result.freeText, undefined); assert.equal(result.personalCards, undefined);
  assert.doesNotMatch(JSON.stringify(result), /secret|token|firebaseAuth|chengciPersonalPersistenceV1|chengciAutoUpdateCheck|chengciActiveTab|private pasted text/);
  assert.equal(disk.writes, 0); assert.equal(api.inspectBackup(result).mistakeEntries, 3);
  await assert.rejects(api.exportBackup({ includePersonalCards: true }), /専用のカードバックアップ/);
});

test('quizRuns takes precedence and old quizCount is a read-only fallback', async () => {
  const a = make({ quizRuns: '0', quizCount: '99' });
  assert.equal((await a.api.exportBackup()).legacy.quizRuns, 0);
  const b = make({ quizRuns: '', quizCount: '9' });
  assert.equal((await b.api.exportBackup()).legacy.quizRuns, 9);
  await b.api.importBackup(backup({ quizRuns: 5 }));
  assert.equal(b.disk.getItem('quizRuns'), '9'); assert.equal(b.disk.getItem('quizCount'), '9');
});

test('merges device histories using set union and max counts, idempotently', async () => {
  const { api, disk } = make({ favorites: '["甲"]', weakWords: '["乙"]', mistakeCounts: '{"甲":8}', quizRuns: '12', unrelated: 'keep', token: 'keep' });
  const incoming = backup({ favorites: ['乙', '乙'], weakWords: ['甲'], weakCards: ['型'], weakIdioms: ['慣用'], mistakeCounts: { 甲: 3, 乙: 4 }, patternMistakeCounts: { 型: 2 }, idiomMistakeCounts: { 慣用: 1 }, quizRuns: 9 });
  const result = await api.importBackup(JSON.stringify(incoming));
  assert.deepEqual(saved(disk, 'favorites'), ['甲', '乙']); assert.deepEqual(saved(disk, 'weakWords'), ['乙', '甲']);
  assert.deepEqual(saved(disk, 'mistakeCounts'), { 甲: 8, 乙: 4 }); assert.equal(disk.getItem('quizRuns'), '12');
  assert.equal(disk.getItem('unrelated'), 'keep'); assert.equal(disk.getItem('token'), 'keep'); assert.equal(result.reloadRequired, true);
  const before = [...disk.values]; const writes = disk.writes;
  const repeated = await api.importBackup(incoming);
  assert.deepEqual([...disk.values], before); assert.equal(disk.writes, writes); assert.deepEqual(repeated.changedKeys, []); assert.equal(repeated.reloadRequired, false);
});

test('preferences and study scope only fill absent settings, never change auth/security settings', async () => {
  const { api, disk } = make({ chengciStudyScope: '{"types":["word"],"tags":["local"]}', audioPrefs: '{"rate":0.8}', chengciPersonalPersistenceV1: 'memory' });
  const result = await api.importBackup(backup({ chengciStudyScope: { types: ['idiom'], tags: ['incoming'] } }, { preferences: { audioPrefs: { rate: 1 }, freeSpeakPrefs: { repeat: 5, gap: 2000 }, audioQuizMode: 'typing' } }));
  assert.equal(saved(disk, 'audioPrefs').rate, 0.8); assert.deepEqual(saved(disk, 'chengciStudyScope').tags, ['local']);
  assert.deepEqual(saved(disk, 'freeSpeakPrefs'), { repeat: 5, gap: 2000 }); assert.equal(disk.getItem('audioQuizMode'), 'typing');
  assert.equal(disk.getItem('chengciPersonalPersistenceV1'), 'memory'); assert.deepEqual(result.skippedKeys, ['chengciStudyScope', 'audioPrefs']);
  await assert.rejects(api.importBackup(backup({}, { preferences: { chengciAutoUpdateCheck: '0' } })));
});

test('free-speak text requires explicit opt-in on export and import and does not replace destination drafts', async () => {
  const source = make({ freeSpeakText: '<img src=x onerror=alert(1)> 私的メモ' });
  assert.equal((await source.api.exportBackup()).freeText, undefined);
  const file = await source.api.exportBackup({ includeFreeText: true });
  assert.equal(source.api.inspectBackup(file).hasFreeText, true);
  const target = make();
  const skipped = await target.api.importBackup(file); assert.equal(skipped.freeTextSkipped, true); assert.equal(target.disk.getItem('freeSpeakText'), null);
  await target.api.importBackup(file, { includeFreeText: true }); assert.equal(target.disk.getItem('freeSpeakText'), file.freeText.freeSpeakText);
  target.disk.setItem('freeSpeakText', 'unsynced destination draft');
  await target.api.importBackup(file, { includeFreeText: true }); assert.equal(target.disk.getItem('freeSpeakText'), 'unsynced destination draft');
});

test('recall history migrates without the old device queue and uses conservative conflict merge', async () => {
  const oldTime = '2026-10-05T00:00:00Z';
  const source = make({ chengciRecallV1: JSON.stringify({ range: 'pending', queue: ['old'], history: { a: { result: 'read', attempts: 5, updatedAt: NOW }, b: { result: 'read', attempts: 2, updatedAt: NOW } }, total: 30, completed: 3, started: true, signature: 'old' }) });
  const file = await source.api.exportBackup(); assert.deepEqual(Object.keys(file.legacy.chengciRecallV1), ['history']);
  const target = make({ chengciRecallV1: JSON.stringify({ range: 'all', queue: ['current'], signature: 'current', started: true, total: 3, completed: 0, history: { a: { result: 'notyet', attempts: 7, updatedAt: oldTime }, b: { result: 'notyet', attempts: 4, updatedAt: NOW } } }) });
  await target.api.importBackup(file);
  const result = saved(target.disk, 'chengciRecallV1');
  assert.deepEqual(result.queue, ['current']); assert.equal(result.started, true); assert.equal(result.total, 3);
  assert.deepEqual(result.history.a, { result: 'read', attempts: 7, updatedAt: NOW }); assert.equal(result.history.b.result, 'notyet'); assert.equal(result.history.b.attempts, 4);
  const before = target.disk.getItem('chengciRecallV1'); await target.api.importBackup(file); assert.equal(target.disk.getItem('chengciRecallV1'), before);
});

test('malformed, unknown and unsupported input rejects before any write', async () => {
  const cases = [
    'bad json', backup({}, { schemaVersion: 2 }), backup({ favorites: [1] }), backup({ favorites: [''] }), backup({ favorites: 'word' }),
    backup({ mistakeCounts: { word: -1 } }), backup({ mistakeCounts: { word: 1.5 } }), backup({ quizRuns: 1000000001 }),
    backup({ chengciStudyScope: { types: ['secret'], tags: [] } }), backup({}, { unknown: 'not permitted' }),
    backup({ favorites: ['new'], token: 'should never persist' }), backup({}, { source: { origin: 'javascript:alert(1)' } }),
    backup({}, { source: { origin: 'https://example.com/?token=secret' } }), backup({}, { preferences: { audioPrefs: { rate: -1 } } }),
    backup({}, { preferences: { freeSpeakPrefs: { repeat: 1, gap: '500' } } }), backup({}, { preferences: { audioQuizMode: 'other' } }),
    backup({ chengciRecallV1: { history: { a: { result: 'read', attempts: 3, updatedAt: 'bad' } } } })
  ];
  for (const input of cases) {
    const target = make({ favorites: '["existing"]' });
    await assert.rejects(target.api.importBackup(input)); assert.equal(target.disk.getItem('favorites'), '["existing"]'); assert.equal(target.disk.writes, 0);
  }
});

test('prototype-poisoning and accessors are rejected while HTML-looking text remains inert data', async () => {
  const { api, disk } = make();
  for (const payload of ['{"__proto__":{"polluted":true}}', '{"constructor":{"prototype":{"polluted":true}}}']) {
    const file = backup(); file.legacy.mistakeCounts = JSON.parse(payload); await assert.rejects(api.importBackup(file));
  }
  let accessed = false; const file = backup(); Object.defineProperty(file.legacy, 'favorites', { enumerable: true, get() { accessed = true; return ['a']; } });
  await assert.rejects(api.importBackup(file)); assert.equal(accessed, false); assert.equal({}.polluted, undefined); assert.equal(disk.writes, 0);
  const text = '<script>globalThis.pwned=true</script>';
  await api.importBackup(backup({ favorites: [text], mistakeCounts: { [text]: 1 } }));
  assert.equal(saved(disk, 'favorites')[0], text); assert.equal(globalThis.pwned, undefined);
});

test('unreadable or malformed source/destination aborts rather than exporting empty or overwriting data', async () => {
  const broken = make({ favorites: 'not json' });
  await assert.rejects(broken.api.exportBackup()); await assert.rejects(broken.api.importBackup(backup({ favorites: ['new'] }))); assert.equal(broken.disk.writes, 0);
  const blocked = storage(); blocked.getItem = () => { throw new Error('SecurityError'); };
  await assert.rejects(make(blocked).api.exportBackup(), error => error.code === 'STORAGE_READ_FAILED');
  await assert.rejects(make(blocked).api.importBackup(backup({ favorites: ['new'] }))); assert.equal(blocked.writes, 0);
  const env = {}; Object.defineProperty(env, 'localStorage', { get() { throw new Error('SecurityError'); } });
  await assert.rejects(createMigration({ env }).exportBackup(), error => error.code === 'STORAGE_UNAVAILABLE');
});

test('quota failure rolls back every attempted key and retries safely', async () => {
  const disk = storage({ favorites: '["old"]', quizRuns: '2', unrelated: 'keep' });
  const nativeSet = disk.setItem.bind(disk); let fail = true;
  disk.setItem = (key, value) => { if (fail && key === 'quizRuns' && value === '9') { fail = false; throw new Error('QuotaExceededError'); } nativeSet(key, value); };
  const { api } = make(disk); const file = backup({ favorites: ['new'], weakWords: ['new'], quizRuns: 9 }); const before = [...disk.values];
  await assert.rejects(api.importBackup(file), error => error.code === 'IMPORT_FAILED' && error.failedRollbackKeys.length === 0);
  assert.deepEqual([...disk.values], before);
  await api.importBackup(file); assert.deepEqual(saved(disk, 'favorites'), ['old', 'new']); assert.equal(disk.getItem('quizRuns'), '9');
});

test('rollback failure is explicit and never falsely reports success', async () => {
  const disk = storage({ favorites: '["old"]' }); const nativeSet = disk.setItem.bind(disk);
  disk.setItem = (key, value) => { if (key === 'quizRuns' || value === '["old"]') throw new Error('storage failed'); nativeSet(key, value); };
  const { api } = make(disk);
  await assert.rejects(api.importBackup(backup({ favorites: ['new'], quizRuns: 2 })), error => error.code === 'ROLLBACK_FAILED' && error.failedRollbackKeys.includes('favorites'));
});

test('concurrent imports from this instance serialize and preserve both histories', async () => {
  const { api, disk } = make();
  await Promise.all([api.importBackup(backup({ favorites: ['A'], quizRuns: 4 })), api.importBackup(backup({ favorites: ['B'], quizRuns: 7 }))]);
  assert.deepEqual(saved(disk, 'favorites'), ['A', 'B']); assert.equal(disk.getItem('quizRuns'), '7');
});

test('browser script attaches public API without DOM, navigation, network or the new store', async () => {
  const disk = storage({ favorites: '["敢"]' }); const window = { localStorage: disk, location: { origin: 'https://old.github.io', reload() { throw new Error('unexpected reload'); } } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/legacy-migration.js'), 'utf8'), { window, URL });
  assert.equal(typeof window.ChengciLegacyMigration.exportBackup, 'function');
  const file = await window.ChengciLegacyMigration.exportBackup(); assert.equal(file.legacy.favorites[0], '敢');
  await window.ChengciLegacyMigration.importBackup(JSON.stringify(file));
});


test('default export and import move favorites only; history, preferences, free text are separate opt-ins', async () => {
  const source = make({ favorites: '["敢"]', quizRuns: '30', weakWords: '["弱い"]', audioQuizMode: 'typing', freeSpeakText: 'private' });
  const minimal = await source.defaults.exportBackup();
  assert.deepEqual(minimal.legacy, { favorites: ['敢'] }); assert.equal(minimal.preferences, undefined); assert.equal(minimal.freeText, undefined);
  const full = await source.api.exportBackup({ includeFreeText: true });
  const target = make(); const result = await target.defaults.importBackup(full);
  assert.deepEqual(saved(target.disk, 'favorites'), ['敢']); assert.equal(target.disk.getItem('quizRuns'), null); assert.equal(target.disk.getItem('audioQuizMode'), null); assert.equal(target.disk.getItem('freeSpeakText'), null);
  assert.deepEqual(new Set(result.skippedKeys), new Set(['weakWords', 'quizRuns', 'audioQuizMode', 'freeSpeakText']));
});

test('import emits an apply-required notification but never reloads or uploads', async () => {
  const events = [];
  const env = { localStorage: storage(), location: { origin: 'https://new.pages.dev', reload() { throw new Error('must not reload'); } }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }, dispatchEvent: event => events.push(event), fetch() { throw new Error('must not upload'); } };
  const api = createMigration({ env, now: () => NOW });
  await api.importBackup(backup({ favorites: ['敢'] }));
  assert.equal(events.length, 1); assert.equal(events[0].type, 'chengci:migration-imported'); assert.deepEqual(events[0].detail, { changedKeys: ['favorites'], requiresApply: true });
  await api.importBackup(backup({ favorites: ['敢'] })); assert.equal(events.length, 1);
});


test('shared seeding receives only selected source data with stable SHA-256 content provenance', async () => {
  const crypto = require('node:crypto');
  const target = make({ favorites: '["unrelated local"]', quizRuns: '100' });
  const file = backup({ favorites: ['乙', '敢'], mistakeCounts: { 乙: 2 }, quizRuns: 5 }, { freeText: { freeSpeakText: 'private' }, preferences: { audioQuizMode: 'typing' } });
  const first = await target.defaults.importBackup(file);
  assert.deepEqual(first.sharedSnapshot, { favorites: ['乙', '敢'] });
  const canonical = JSON.stringify({ origin: 'https://old.github.io', legacy: { favorites: ['乙', '敢'].sort() } });
  assert.equal(first.backupId, 'legacy-' + crypto.createHash('sha256').update(canonical).digest('hex'));
  const reordered = backup({ favorites: ['敢', '乙', '乙'], quizRuns: 999 }, { exportedAt: '2027-01-01T00:00:00Z' });
  const second = await target.defaults.importBackup(reordered); assert.equal(second.backupId, first.backupId);
  const full = await target.api.importBackup(file); assert.deepEqual(full.sharedSnapshot, { favorites: ['乙', '敢'], mistakeCounts: { 乙: 2 }, quizRuns: 5 });
  assert.notEqual(full.backupId, first.backupId); assert.ok(!JSON.stringify(full.sharedSnapshot).includes('unrelated local'));
  for (const values of [[], ['🙂', 'a'.repeat(400), '\\"\n'], Array.from({ length: 64 }, (_, i) => '字' + i)]) {
    const result = await make().defaults.importBackup(backup({ favorites: values }));
    const text = JSON.stringify({ origin: 'https://old.github.io', legacy: { favorites: [...values].sort() } });
    assert.equal(result.backupId, 'legacy-' + crypto.createHash('sha256').update(text).digest('hex'));
  }
});


test('inherited object names remain inert records and oversized sparse arrays are rejected early', async () => {
  const { api, disk } = make();
  await api.importBackup(backup({ mistakeCounts: { toString: 4, hasOwnProperty: 2 }, chengciRecallV1: { history: { toString: { result: 'notyet', attempts: 1, updatedAt: NOW } } } }));
  assert.equal(saved(disk, 'mistakeCounts').toString, 4); assert.equal(saved(disk, 'mistakeCounts').hasOwnProperty, 2);
  assert.equal(saved(disk, 'chengciRecallV1').history.toString.attempts, 1);
  const sparse = []; sparse.length = 100000000;
  await assert.rejects(api.importBackup(backup({ favorites: sparse })), /大きすぎ/);
});

test('large repeated sets are deduplicated before enforcing merged collection limits', async () => {
  const values = Array.from({ length: 11000 }, (_, i) => 'item-' + i);
  const { defaults, disk } = make({ favorites: JSON.stringify(values) }); const writes = disk.writes;
  const result = await defaults.importBackup(backup({ favorites: values }));
  assert.deepEqual(result.changedKeys, []); assert.equal(disk.writes, writes);
});

test('four source files merge conservatively without losing independent favorites', async () => {
  const { api, disk } = make();
  for (let i = 1; i <= 4; i++) await api.importBackup(backup({ favorites: ['shared', 'device-' + i], weakWords: ['weak-' + i], mistakeCounts: { shared: i, ['device-' + i]: i }, quizRuns: i * 2 }));
  assert.deepEqual(saved(disk, 'favorites'), ['shared', 'device-1', 'device-2', 'device-3', 'device-4']);
  assert.equal(saved(disk, 'mistakeCounts').shared, 4); assert.equal(disk.getItem('quizRuns'), '8'); assert.equal(saved(disk, 'weakWords').length, 4);
});
