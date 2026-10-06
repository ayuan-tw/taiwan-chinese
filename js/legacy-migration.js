/* Offline, provider-independent migration. Only explicit, versioned study fields travel. */
(function (root) {
  'use strict';
  const FORMAT = 'chengci-history-migration';
  const VERSION = 1;
  const MAX_BYTES = 12 * 1024 * 1024;
  const MAX_ITEMS = 20000;
  const SET_KEYS = ['favorites', 'weakWords', 'weakCards', 'weakIdioms'];
  const COUNT_KEYS = ['mistakeCounts', 'patternMistakeCounts', 'idiomMistakeCounts'];
  const LEGACY_KEYS = [...SET_KEYS, ...COUNT_KEYS, 'quizRuns', 'chengciStudyScope', 'chengciRecallV1'];
  const PREFERENCE_KEYS = ['audioPrefs', 'freeSpeakPrefs', 'audioQuizMode'];
  const BAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = (message, code = 'INVALID_BACKUP') => { const error = new Error(message); error.code = code; throw error; };
  function object(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} の形式が正しくありません。`);
    return value;
  }
  function keys(value, allowed, label) {
    object(value, label);
    if (Object.keys(value).some(key => !allowed.includes(key))) fail(`${label} に未対応の項目があります。`);
  }
  function string(value, label, limit = 1000, empty = false) {
    if (typeof value !== 'string' || value.length > limit || (!empty && !value.length)) fail(`${label} の文字列が正しくありません。`);
    return value;
  }
  function count(value, label) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 1000000000) fail(`${label} の回数が正しくありません。`);
    return value;
  }
  function date(value, label) {
    string(value, label, 100);
    if (!Number.isFinite(Date.parse(value))) fail(`${label} の日時が正しくありません。`);
    return value;
  }
  // Data can be supplied as parsed JSON, but accessors, classes and prototype keys
  // are never invoked or copied. No backup is evaluated as code or inserted as HTML.
  function jsonData(input) {
    if (typeof input === 'string') {
      if (input.length > MAX_BYTES) fail('バックアップが大きすぎます。');
      try { input = JSON.parse(input); } catch (_) { fail('バックアップの JSON を読み込めません。'); }
    }
    let nodes = 0;
    function visit(value, depth) {
      if (++nodes > 300000 || depth > 18) fail('バックアップの構造が大きすぎます。');
      if (value == null || typeof value === 'boolean') return;
      if (typeof value === 'number') { if (!Number.isFinite(value)) fail('不正な数値があります。'); return; }
      if (typeof value === 'string') { if (value.length > MAX_BYTES) fail('バックアップが大きすぎます。'); return; }
      if (typeof value !== 'object') fail('JSON 以外のデータは取り込めません。');
      if (Array.isArray(value) && value.length > 300000) fail('バックアップの一覧が大きすぎます。');
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== null) fail('JSON 以外のオブジェクトは取り込めません。');
      if (Object.getOwnPropertySymbols(value).length) fail('JSON 以外の項目があります。');
      for (const key of Object.getOwnPropertyNames(value)) {
        if (Array.isArray(value) && key === 'length') continue;
        if (BAD_KEYS.has(key)) fail('安全でない項目名があります。');
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !own(descriptor, 'value') || !descriptor.enumerable) fail('JSON 以外の項目があります。');
        visit(descriptor.value, depth + 1);
      }
    }
    visit(input, 0);
    const serialized = JSON.stringify(input);
    if (!serialized || serialized.length > MAX_BYTES) fail('バックアップが大きすぎるか、空です。');
    return JSON.parse(serialized);
  }
  function stringSet(value, label, limit = MAX_ITEMS) {
    if (!Array.isArray(value) || value.length > limit) fail(`${label} の一覧が正しくありません。`);
    return [...new Set(value.map(item => string(item, label)))];
  }
  function counts(value, label) {
    object(value, label);
    if (Object.keys(value).length > MAX_ITEMS) fail(`${label} の件数が多すぎます。`);
    const result = {};
    for (const [key, valueCount] of Object.entries(value)) {
      string(key, label); if (BAD_KEYS.has(key)) fail('安全でない項目名があります。');
      result[key] = count(valueCount, label);
    }
    return result;
  }
  function studyScope(value) {
    keys(value, ['types', 'tags'], '学習範囲');
    const types = stringSet(value.types, '学習範囲の種類', 3);
    if (types.some(type => !['word', 'pattern', 'idiom'].includes(type))) fail('学習範囲の種類が正しくありません。');
    return { types, tags: stringSet(value.tags, '学習範囲のタグ', 1000) };
  }
  function recallHistory(value) {
    object(value, '想起練習の履歴');
    if (Object.keys(value).length > MAX_ITEMS) fail('想起練習の履歴が多すぎます。');
    const result = {};
    for (const [id, item] of Object.entries(value)) {
      string(id, '想起練習の ID'); if (BAD_KEYS.has(id)) fail('安全でない項目名があります。');
      keys(item, ['result', 'attempts', 'updatedAt'], '想起練習の履歴');
      if (!['read', 'notyet'].includes(item.result)) fail('想起練習の結果が正しくありません。');
      result[id] = { result: item.result, attempts: count(item.attempts, '想起練習'), updatedAt: date(item.updatedAt, '想起練習') };
    }
    return result;
  }
  function legacyValue(key, value) {
    if (SET_KEYS.includes(key)) return stringSet(value, key);
    if (COUNT_KEYS.includes(key)) return counts(value, key);
    if (key === 'quizRuns') return count(value, key);
    if (key === 'chengciStudyScope') return studyScope(value);
    if (key === 'chengciRecallV1') { keys(value, ['history'], '想起練習'); return { history: recallHistory(value.history) }; }
    fail('未対応の学習履歴です。');
  }
  function preference(key, value) {
    if (key === 'audioQuizMode') {
      if (!['choice', 'typing'].includes(value)) fail('音声クイズの設定が正しくありません。');
      return value;
    }
    if (key === 'audioPrefs') {
      keys(value, ['voiceURI', 'rate', 'autoSpeak'], key);
      if (own(value, 'voiceURI')) string(value.voiceURI, key, 2000, true);
      if (own(value, 'rate') && (typeof value.rate !== 'number' || value.rate < 0.1 || value.rate > 10)) fail('音声速度が正しくありません。');
      if (own(value, 'autoSpeak') && typeof value.autoSpeak !== 'boolean') fail('自動読み上げ設定が正しくありません。');
      return value;
    }
    keys(value, ['repeat', 'gap'], key);
    if (own(value, 'repeat') && ![1, 3, 5, 10].includes(value.repeat)) fail('リピート設定が正しくありません。');
    if (own(value, 'gap') && ![500, 1000, 2000].includes(value.gap)) fail('読み上げ間隔が正しくありません。');
    return value;
  }
  function validate(input) {
    const backup = jsonData(input);
    keys(backup, ['format', 'schemaVersion', 'exportedAt', 'source', 'legacy', 'preferences', 'freeText'], 'バックアップ');
    if (backup.format !== FORMAT || backup.schemaVersion !== VERSION) fail('澄詞の履歴移行バックアップではないか、未対応のバージョンです。');
    date(backup.exportedAt, 'バックアップ');
    keys(backup.source, ['origin'], '元の保存場所');
    if (backup.source.origin !== 'unknown') {
      try { const url = new URL(backup.source.origin); if (!['https:', 'http:'].includes(url.protocol) || url.origin !== backup.source.origin) fail('元の保存場所が正しくありません。'); }
      catch (_) { fail('元の保存場所が正しくありません。'); }
    }
    keys(backup.legacy, LEGACY_KEYS, '学習履歴');
    for (const key of Object.keys(backup.legacy)) backup.legacy[key] = legacyValue(key, backup.legacy[key]);
    if (own(backup, 'preferences')) {
      keys(backup.preferences, PREFERENCE_KEYS, '設定');
      for (const key of Object.keys(backup.preferences)) backup.preferences[key] = preference(key, backup.preferences[key]);
    }
    if (own(backup, 'freeText')) { keys(backup.freeText, ['freeSpeakText'], '自由読み上げ本文'); string(backup.freeText.freeSpeakText, '自由読み上げ本文', 1000000, true); }
    return backup;
  }
  function summary(backup) {
    const legacy = backup.legacy;
    return {
      format: FORMAT, schemaVersion: VERSION, exportedAt: backup.exportedAt, sourceOrigin: backup.source.origin,
      favorites: legacy.favorites?.length || 0, weakWords: legacy.weakWords?.length || 0,
      weakCards: legacy.weakCards?.length || 0, weakIdioms: legacy.weakIdioms?.length || 0,
      mistakeEntries: COUNT_KEYS.reduce((n, key) => n + Object.keys(legacy[key] || {}).length, 0),
      quizRuns: legacy.quizRuns || 0, hasStudyScope: own(legacy, 'chengciStudyScope'),
      recallEntries: Object.keys(legacy.chengciRecallV1?.history || {}).length,
      preferenceKeys: Object.keys(backup.preferences || {}), hasFreeText: own(backup, 'freeText'),
      freeTextCharacters: backup.freeText?.freeSpeakText.length || 0,
      historyKeys: Object.keys(legacy).filter(key => key !== 'favorites')
    };
  }
  // Stable content provenance for explicit shared-record seeding. It excludes
  // export timestamps and destination data. SHA-256 is local, never a network call.
  function backupFingerprint(backup, snapshot) {
    const ordered = {};
    for (const key of Object.keys(snapshot).sort()) {
      const value = snapshot[key];
      ordered[key] = Array.isArray(value) ? [...value].sort() : value && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).sort().map(name => [name, value[name]])) : value;
    }
    const text = JSON.stringify({ origin: backup.source.origin, legacy: ordered });
    const encoded = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    const size = Math.ceil((encoded.length + 9) / 64) * 64;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < encoded.length; i++) bytes[i] = encoded.charCodeAt(i);
    bytes[encoded.length] = 0x80;
    const view = new DataView(bytes.buffer);
    view.setUint32(size - 8, Math.floor(encoded.length / 0x20000000));
    view.setUint32(size - 4, (encoded.length * 8) >>> 0);
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const k = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const rotate = (value, bits) => (value >>> bits) | (value << (32 - bits));
    const w = new Uint32Array(64);
    for (let offset = 0; offset < size; offset += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i++) {
        const x = w[i - 15], y = w[i - 2];
        w[i] = (w[i - 16] + (rotate(x, 7) ^ rotate(x, 18) ^ (x >>> 3)) + w[i - 7] + (rotate(y, 17) ^ rotate(y, 19) ^ (y >>> 10))) >>> 0;
      }
      let [a,b,c,d,e,f,g,last] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (last + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + ((e & f) ^ (~e & g)) + k[i] + w[i]) >>> 0;
        const t2 = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        last = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a,b,c,d,e,f,g,last].forEach((value, i) => { h[i] = (h[i] + value) >>> 0; });
    }
    return 'legacy-' + h.map(value => value.toString(16).padStart(8, '0')).join('');
  }
  function createMigration(options) {
    options = options || {};
    const env = options.env || root;
    const now = options.now || (() => new Date().toISOString());
    let tail = Promise.resolve();
    function storage() { try { if (!env.localStorage) fail('端末保存にアクセスできません。', 'STORAGE_UNAVAILABLE'); return env.localStorage; } catch (_) { fail('端末保存にアクセスできません。履歴は変更していません。', 'STORAGE_UNAVAILABLE'); } }
    function read(store, key) { try { const value = store.getItem(key); return value == null ? null : value; } catch (_) { fail(`${key} を読み込めません。履歴は変更していません。`, 'STORAGE_READ_FAILED'); } }
    function parse(raw, key) {
      try { return jsonData(raw); } catch (_) { fail(`${key} の保存データを読み込めません。上書きせずに中止しました。`, 'INVALID_LOCAL_DATA'); }
    }
    function localValue(key, raw) {
      if (key === 'quizRuns') {
        if (!/^\d+$/.test(raw)) fail('クイズ回数の保存データが正しくありません。', 'INVALID_LOCAL_DATA');
        return count(Number(raw), key);
      }
      if (key === 'audioQuizMode') return preference(key, raw);
      const value = parse(raw, key);
      if (key === 'chengciRecallV1') {
        object(value, '想起練習');
        // The practice queue is a device session, never part of migration.
        return { history: recallHistory(value.history || {}) };
      }
      return PREFERENCE_KEYS.includes(key) ? preference(key, value) : legacyValue(key, value);
    }
    function sourceOrigin() {
      try { const url = new URL(env.location?.origin); return ['https:', 'http:'].includes(url.protocol) ? url.origin : 'unknown'; } catch (_) { return 'unknown'; }
    }
    async function exportBackup(opts) {
      opts = opts || {};
      if (opts.includePersonalCards) fail('個人カードは専用のカードバックアップから書き出してください。');
      const store = storage();
      const backup = { format: FORMAT, schemaVersion: VERSION, exportedAt: now(), source: { origin: sourceOrigin() }, legacy: {} };
      for (const key of LEGACY_KEYS) {
        if (key !== 'favorites' && opts.includeHistory !== true) continue;
        let raw = read(store, key);
        if (key === 'quizRuns' && (raw == null || raw === '')) raw = read(store, 'quizCount');
        if (raw != null) backup.legacy[key] = localValue(key, raw);
      }
      if (opts.includePreferences === true) {
        backup.preferences = {};
        for (const key of PREFERENCE_KEYS) { const raw = read(store, key); if (raw != null) backup.preferences[key] = localValue(key, raw); }
      }
      if (opts.includeFreeText === true) { const raw = read(store, 'freeSpeakText'); if (raw != null) backup.freeText = { freeSpeakText: raw }; }
      return validate(backup);
    }
    function mergeHistory(existing, incoming) {
      const merged = clone(existing);
      for (const [id, item] of Object.entries(incoming)) {
        const previous = own(merged, id) ? merged[id] : null;
        if (!previous) { merged[id] = item; continue; }
        const newer = Date.parse(item.updatedAt) > Date.parse(previous.updatedAt) ? item : previous;
        const tie = Date.parse(item.updatedAt) === Date.parse(previous.updatedAt);
        merged[id] = { result: tie && (item.result === 'notyet' || previous.result === 'notyet') ? 'notyet' : newer.result, attempts: Math.max(item.attempts, previous.attempts), updatedAt: newer.updatedAt };
      }
      return merged;
    }
    function buildPlan(store, backup, opts) {
      const observed = new Map(), writes = [], skipped = [];
      const get = key => { if (!observed.has(key)) observed.set(key, read(store, key)); return observed.get(key); };
      const put = (key, value, plain = false) => { const next = plain ? String(value) : JSON.stringify(value); const before = get(key); if (next !== before) writes.push({ key, before, next }); };
      for (const [key, incoming] of Object.entries(backup.legacy)) {
        if (key !== 'favorites' && opts.includeHistory !== true) { skipped.push(key); continue; }
        let raw = get(key);
        if (key === 'quizRuns' && (raw == null || raw === '')) raw = get('quizCount');
        const existing = raw == null ? null : localValue(key, raw);
        if (SET_KEYS.includes(key)) put(key, stringSet([...new Set([...(existing || []), ...incoming])], key));
        else if (COUNT_KEYS.includes(key)) {
          const merged = { ...(existing || {}) };
          for (const [id, value] of Object.entries(incoming)) merged[id] = Math.max(own(merged, id) ? merged[id] : 0, value);
          put(key, counts(merged, key));
        } else if (key === 'quizRuns') put(key, Math.max(existing || 0, incoming), true);
        else if (key === 'chengciRecallV1') {
          const saved = raw == null ? {} : parse(raw, key);
          put(key, { ...saved, history: recallHistory(mergeHistory(existing?.history || {}, incoming.history)) });
        } else if (existing == null) put(key, incoming);
        else skipped.push(key);
      }
      for (const [key, value] of Object.entries(backup.preferences || {})) {
        if (opts.includePreferences !== true || get(key) != null) { skipped.push(key); continue; }
        put(key, value, key === 'audioQuizMode');
      }
      if (backup.freeText) {
        if (opts.includeFreeText === true && get('freeSpeakText') == null) put('freeSpeakText', backup.freeText.freeSpeakText, true);
        else skipped.push('freeSpeakText');
      }
      return { writes, skipped, observed };
    }
    function prepareSharedImport(input, opts = {}) {
      const backup = validate(input);
      const sharedSnapshot = {};
      for (const [key, value] of Object.entries(backup.legacy)) {
        if (key === 'favorites' || (opts.includeHistory === true && [...SET_KEYS, ...COUNT_KEYS, 'quizRuns'].includes(key))) sharedSnapshot[key] = clone(value);
      }
      return {backupId:backupFingerprint(backup, sharedSnapshot),sharedSnapshot,summary:summary(backup)};
    }
    async function applyBackup(input, opts) {
      const backup = validate(input);
      const store = storage();
      const sharedSnapshot = {};
      for (const [key, value] of Object.entries(backup.legacy)) {
        if (key === 'favorites' || (opts.includeHistory === true && [...SET_KEYS, ...COUNT_KEYS, 'quizRuns'].includes(key))) sharedSnapshot[key] = clone(value);
      }
      const backupId = backupFingerprint(backup, sharedSnapshot);
      const plan = buildPlan(store, backup, opts);
      // No asynchronous work between snapshot, validation and local writes. A
      // concurrent storage change is detected before the first mutation.
      for (const [key, before] of plan.observed) if (read(store, key) !== before) fail('別の画面で履歴が変わりました。他のタブを閉じて再試行してください。', 'STORAGE_CHANGED');
      const attempted = [];
      try {
        for (const entry of plan.writes) { attempted.push(entry); store.setItem(entry.key, entry.next); }
      } catch (cause) {
        const failedKeys = [];
        for (const entry of attempted.reverse()) {
          try {
            const current = read(store, entry.key);
            if (current === entry.before) continue;
            if (current !== entry.next) { failedKeys.push(entry.key); continue; }
            if (entry.before == null) store.removeItem(entry.key); else store.setItem(entry.key, entry.before);
            if (read(store, entry.key) !== entry.before) failedKeys.push(entry.key);
          } catch (_) { failedKeys.push(entry.key); }
        }
        const error = new Error(failedKeys.length ? '取り込みを完了できず、一部の復元も確認できません。元のアプリとバックアップを残し、この画面では学習を再開しないでください。' : '取り込みに失敗しました。変更した履歴は元に戻しました。容量や保存設定を確認してください。');
        error.code = failedKeys.length ? 'ROLLBACK_FAILED' : 'IMPORT_FAILED'; error.cause = cause; error.failedRollbackKeys = failedKeys;
        throw error;
      }
      const result = { backupId, sharedSnapshot, summary: summary(backup), changedKeys: plan.writes.map(item => item.key), skippedKeys: plan.skipped, reloadRequired: plan.writes.length > 0, freeTextSkipped: plan.skipped.includes('freeSpeakText') };
      // Observers may show an Apply/reload prompt. This event does not authorize
      // replacing drafts, navigation, or uploading newly imported records.
      if (result.changedKeys.length && env.dispatchEvent && env.CustomEvent) {
        try { env.dispatchEvent(new env.CustomEvent('chengci:migration-imported', { detail: { changedKeys: [...result.changedKeys], requiresApply: true } })); } catch (_) {}
      }
      return result;
    }
    return {
      exportBackup,
      prepareSharedImport,
      inspectBackup: input => summary(validate(input)),
      importBackup(input, opts) { const run = tail.then(() => applyBackup(input, opts || {})); tail = run.catch(() => {}); return run; },
      format: FORMAT, schemaVersion: VERSION
    };
  }
  const exported = { createMigration, FORMAT, VERSION, LEGACY_KEYS, PREFERENCE_KEYS };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  else root.ChengciLegacyMigration = createMigration();
})(typeof window !== 'undefined' ? window : globalThis);
