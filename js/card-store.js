/* Personal cards are overlays. The bundled dictionary and its storage are never changed. */
(function (root) {
  'use strict';
  const DATABASE = 'chengciPersonalCardsV1';
  const PREFERENCE = 'chengciPersonalPersistenceV1';
  const KINDS = ['cards', 'progress', 'favorites', 'study'];
  const SHARED = ['favorites', 'study'];
  const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  const SHARED_FIELDS = { favorites: ['adds', 'removes'], study: ['adds', 'removes', 'counts', 'cleared'] };
  const MAX_COUNTER = 1000000000;
  const FIELDS = { word: 300, zhuyin: 1000, meaning: 4000, example: 8000, exampleZhuyin: 16000, note: 8000 };
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const empty = () => ({ schemaVersion: 1, cards: {}, progress: {}, favorites: {}, study: {}, syncCheckpoints: {}, studyActorId: null });
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  function validId(id) { return typeof id === 'string' && !BAD_KEYS.has(id) && /^[A-Za-z0-9][A-Za-z0-9_-]{0,149}$/.test(id); }
  function assertId(id) { if (!validId(id)) throw new Error('カードIDが正しくありません。'); return id; }
  function vector(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 256) throw new Error('共有学習記録の端末数または形式が正しくありません。');
    const result = {};
    for (const key of Object.keys(value).sort()) {
      if (!validId(key) || !Number.isSafeInteger(value[key]) || value[key] < 0 || value[key] > MAX_COUNTER) throw new Error('共有学習記録の回数が正しくありません。');
      if (value[key]) result[key] = value[key];
    }
    return result;
  }
  function maxVector(a, b) {
    const result = { ...a };
    for (const [key, value] of Object.entries(b || {})) result[key] = Math.max(result[key] || 0, value);
    return vector(result);
  }
  function sharedEmpty(kind) { return Object.fromEntries(SHARED_FIELDS[kind].map(key => [key, {}])); }
  function mergeShared(a, b, kind) {
    return Object.fromEntries(SHARED_FIELDS[kind].map(key => [key, maxVector(a?.[key] || {}, b?.[key] || {})]));
  }
  function active(data) { return Object.entries(data?.adds || {}).some(([key, value]) => value > (data.removes[key] || 0)); }
  function total(data) { return Object.entries(data?.counts || {}).reduce((sum, [key, value]) => sum + Math.max(0, value - (data.cleared?.[key] || 0)), 0); }
  function normalize(data, kind, deleted) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('カードの形式が正しくありません。');
    if (SHARED.includes(kind)) {
      if (deleted || Object.keys(data).some(key => !SHARED_FIELDS[kind].includes(key))) throw new Error('共有学習記録の形式が正しくありません。');
      return Object.fromEntries(SHARED_FIELDS[kind].map(key => [key, vector(data[key])]));
    }
    if (kind === 'progress') {
      if (!['read', 'notyet'].includes(data.result) || !Number.isSafeInteger(data.attempts) || data.attempts < 0 || data.attempts > 1000000000) throw new Error('練習記録の形式が正しくありません。');
      if (typeof data.updatedAt !== 'string' || !Number.isFinite(Date.parse(data.updatedAt))) throw new Error('練習記録の日時が正しくありません。');
      return { result: data.result, attempts: data.attempts, updatedAt: data.updatedAt };
    }
    const result = {};
    Object.entries(FIELDS).forEach(([field, limit]) => {
      const value = data[field] == null ? '' : data[field];
      if (typeof value !== 'string' || value.length > limit) throw new Error(`${field} が長すぎるか、形式が正しくありません。`);
      result[field] = value.trim();
    });
    if (!deleted && !result.word) throw new Error('繁體字を入力してください。');
    result.pronunciationStatus = data.pronunciationStatus || 'candidate';
    if (!['candidate', 'confirmed', 'missing'].includes(result.pronunciationStatus)) throw new Error('注音の確認状態が正しくありません。');
    return result;
  }
  function validRemote(document, kind) {
    if (!document || document.schemaVersion !== 1 || !validId(document.id) || !validId(document.operationId) || !Number.isSafeInteger(document.revision) || document.revision < 1 || typeof document.deleted !== 'boolean' || typeof document.updatedAt !== 'string' || !Number.isFinite(Date.parse(document.updatedAt))) throw new Error('同期データの形式が正しくありません。');
    return { schemaVersion: 1, id: document.id, operationId: document.operationId, revision: document.revision, deleted: document.deleted, updatedAt: document.updatedAt, data: normalize(document.data, kind, document.deleted) };
  }
  function validCheckpoint(key, value) {
    if (typeof key !== 'string' || !key.length || key.length > 1024 || BAD_KEYS.has(key) || !Number.isSafeInteger(value) || value < 0) throw new Error('同期位置の形式が正しくありません。');
  }
  function validateState(value) {
    // Schema 1 backups made before shared study records remain readable.
    if (value && value.schemaVersion === 1) for (const kind of SHARED) if (!own(value, kind)) value[kind] = {};
    if (!value || value.schemaVersion !== 1 || KINDS.some(kind => !value[kind] || typeof value[kind] !== 'object' || Array.isArray(value[kind]))) throw new Error('保存データを読み込めません。既存データは上書きしていません。');
    if (!own(value, 'studyActorId')) value.studyActorId = null;
    if (value.studyActorId != null && !validId(value.studyActorId)) throw new Error('学習記録の端末IDが正しくありません。');
    if (!own(value, 'syncCheckpoints')) value.syncCheckpoints = {};
    if (!value.syncCheckpoints || typeof value.syncCheckpoints !== 'object' || Array.isArray(value.syncCheckpoints) || Object.keys(value.syncCheckpoints).length > 128) throw new Error('同期位置の保存データが正しくありません。');
    for (const [key, checkpoint] of Object.entries(value.syncCheckpoints)) validCheckpoint(key, checkpoint);
    for (const kind of KINDS) {
      if (Object.keys(value[kind]).length > 10000) throw new Error('保存データの件数が上限を超えています。');
      for (const [id, record] of Object.entries(value[kind])) {
        assertId(id);
        if (!record || record.id !== id || !validId(record.operationId) || !Number.isSafeInteger(record.baseRevision) || record.baseRevision < 0 || !['pending', 'synced', 'error', 'conflict'].includes(record.syncStatus) || typeof record.deleted !== 'boolean') throw new Error('保存データが壊れています。既存データは上書きしていません。');
        normalize(record.data, kind, record.deleted);
        if (SHARED.includes(kind) && (record.conflict || record.importConflicts?.length)) throw new Error('共有学習記録に未対応の競合があります。');
        if (record.conflict) validRemote(record.conflict, kind);
        if (record.importConflicts) {
          if (!Array.isArray(record.importConflicts) || record.importConflicts.length > 100) throw new Error('バックアップの競合データが正しくありません。');
          for (const alternative of record.importConflicts) { if (typeof alternative.deleted !== 'boolean') throw new Error('バックアップの競合データが正しくありません。'); normalize(alternative.data, kind, alternative.deleted); }
        }
        if (record.inflight && (!validId(record.inflight.operationId) || record.inflight.id !== id || !Number.isSafeInteger(record.inflight.baseRevision))) throw new Error('未同期データが壊れています。');
      }
    }
    return value;
  }
  function memoryAdapter(initial) {
    let state = clone(initial || empty());
    return { read: async () => clone(state), transact: async transform => { const next = validateState(clone(state)); const result = transform(next); validateState(next); state = next; return { state: clone(state), result: clone(result) }; } };
  }
  function indexedDBAdapter(indexedDB) {
    let connection;
    const open = () => connection || (connection = new Promise((resolve, reject) => {
      if (!indexedDB) { reject(new Error('このブラウザーでは端末保存を利用できません。')); return; }
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('state')) request.result.createObjectStore('state'); };
      request.onerror = () => reject(request.error || new Error('端末保存を開けません。'));
      request.onblocked = () => reject(new Error('別のタブを閉じてから端末保存を再試行してください。'));
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    }));
    async function transaction(transform) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('state', transform ? 'readwrite' : 'readonly');
        const store = tx.objectStore('state');
        const read = store.get('records');
        let state, result, failure;
        read.onsuccess = () => {
          try {
            state = validateState(read.result == null ? empty() : read.result);
            if (transform) { result = transform(state); validateState(state); store.put(state, 'records'); }
          } catch (error) { failure = error; tx.abort(); }
        };
        tx.oncomplete = () => resolve({ state: clone(state), result: clone(result) });
        tx.onerror = tx.onabort = () => reject(failure || tx.error || new Error('端末保存に失敗しました。容量やブラウザーの設定を確認してください。'));
      });
    }
    return { read: async () => (await transaction()).state, transact: transaction };
  }
  function createStore(options) {
    options = options || {};
    const env = options.env || root;
    const now = options.now || (() => new Date().toISOString());
    const uuid = options.uuid || (() => {
      if (env.crypto?.randomUUID) return env.crypto.randomUUID();
      if (env.crypto?.getRandomValues) return Array.from(env.crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
      throw new Error('安全なカードIDを作れません。HTTPSのページで開いてください。');
    });
    let state = empty(), adapter = options.adapter || memoryAdapter(), persistence = options.adapter ? 'device' : 'memory';
    let warning = '', blocked = false, tail = Promise.resolve(), channel;
    const listeners = new Set();
    function publish() { for (const fn of listeners) { try { fn(api.getState()); } catch (error) { env.console?.error(error); } } }
    function serial(task) { const run = tail.then(task); tail = run.catch(() => {}); return run; }
    async function change(transform) {
      await api.ready;
      return serial(async () => {
        if (blocked) throw new Error(warning || '保存データの読み込みに失敗しています。');
        try {
          const changed = await adapter.transact(transform);
          const dataChanged = JSON.stringify(state) !== JSON.stringify(changed.state);
          const hadWarning = !!warning; state = changed.state; warning = '';
          if (dataChanged || hadWarning) publish();
          if (dataChanged) channel?.postMessage('changed');
          return changed.result;
        } catch (error) { warning = error.message; publish(); throw error; }
      });
    }
    function comparisonToken(record) {
      if (record.conflict) return JSON.stringify([record.operationId, 'cloud', record.conflict.operationId, record.conflict.revision]);
      const alternative = record.importConflicts?.[0];
      // New imports have unique tokens. Legacy local backups fall back to the exact
      // compared value, avoiding a lossy hash and requiring no asynchronous crypto.
      return alternative ? JSON.stringify([record.operationId, 'backup', alternative.token || alternative]) : null;
    }
    function publicRecord(record) {
      if (!record) return null;
      const result = { ...clone(record.data), id: record.id, deleted: record.deleted, updatedAt: record.updatedAt, revision: record.baseRevision, localVersion: record.operationId, syncStatus: record.syncStatus };
      if (record.error) result.error = record.error;
      const alternative = record.conflict || record.importConflicts?.[0];
      if (alternative) result.conflict = {
        source: record.conflict ? 'cloud' : 'backup',
        comparisonToken: comparisonToken(record),
        localVersion: record.operationId,
        remoteRevision: record.conflict?.revision || record.baseRevision,
        local: { ...clone(record.data), id: record.id, deleted: record.deleted, updatedAt: record.updatedAt },
        remote: { ...clone(alternative.data), id: record.id, deleted: alternative.deleted, updatedAt: alternative.updatedAt, revision: alternative.revision || record.baseRevision }
      };
      return result;
    }
    function makeRecord(id, data, deleted, previous) {
      return { id, data, deleted, operationId: 'op-' + uuid(), updatedAt: now(), baseRevision: previous?.baseRevision || 0, baseOperationId: previous?.baseOperationId || null, syncStatus: previous?.conflict || previous?.importConflicts?.length ? 'conflict' : 'pending', inflight: previous?.inflight || null, conflict: previous?.conflict || null, importConflicts: clone(previous?.importConflicts || []) };
    }
    function fromRemote(remote) {
      return { id: remote.id, data: remote.data, deleted: remote.deleted, operationId: remote.operationId, updatedAt: remote.updatedAt, baseRevision: remote.revision, baseOperationId: remote.operationId, syncStatus: 'synced', inflight: null, conflict: null, importConflicts: [] };
    }
    function preserveImports(record, previous) {
      record.importConflicts = clone(previous?.importConflicts || []);
      if (record.importConflicts.length) record.syncStatus = 'conflict';
      return record;
    }
    function mergeRemote(current, remote, kind) {
      if (SHARED.includes(kind)) {
        if (!current) return fromRemote(remote);
        if (remote.revision < current.baseRevision) return current;
        const data = mergeShared(current.data, remote.data, kind);
        if (JSON.stringify(data) === JSON.stringify(remote.data)) return fromRemote(remote);
        // The remote revision is the new compare-and-set base. Rebase only the
        // component-wise union, never silently select a winning device snapshot.
        if (remote.revision === current.baseRevision && remote.operationId === current.baseOperationId && JSON.stringify(data) === JSON.stringify(current.data)) return current;
        const next = makeRecord(remote.id, data, false, fromRemote(remote));
        next.inflight = null;
        return next;
      }

      if (!current) return fromRemote(remote);
      if (remote.revision < current.baseRevision) return current;
      if (current.conflict && remote.revision < current.conflict.revision) {
        // An acknowledgement can arrive after a newer server edit. Retain the newer conflict.
        if (remote.operationId === current.operationId || remote.operationId === current.inflight?.operationId) {
          current.baseRevision = remote.revision; current.baseOperationId = remote.operationId;
          if (current.inflight?.operationId === remote.operationId) current.inflight = null;
        }
        return current;
      }
      if (remote.operationId === current.operationId) return preserveImports(fromRemote(remote), current);
      if (remote.operationId === current.inflight?.operationId) {
        current.baseRevision = remote.revision; current.baseOperationId = remote.operationId; current.inflight = null;
        if (!current.conflict || current.conflict.revision <= remote.revision) { current.conflict = null; current.syncStatus = current.importConflicts?.length ? 'conflict' : 'pending'; delete current.error; }
        return current;
      }
      if (remote.revision === current.baseRevision && remote.operationId === current.baseOperationId) return current;
      if (current.syncStatus === 'synced' || (!current.conflict && current.operationId === current.baseOperationId)) return preserveImports(fromRemote(remote), current);
      if (!current.conflict || remote.revision >= current.conflict.revision) current.conflict = remote;
      current.syncStatus = 'conflict'; delete current.error; return current;
    }
    const api = {
      ready: null,
      getKinds() { return [...KINDS]; },
      // The actor and its counters share a cache lineage. Restoring a backup or
      // deleting device data must not reuse a counter actor with lost history.
      async ensureStudyActorId(proposed) {
        assertId(proposed);
        return change(next => { if (!next.studyActorId) next.studyActorId = proposed; return next.studyActorId; });
      },
      getSyncCheckpoint(key) { validCheckpoint(key, 0); return own(state.syncCheckpoints, key) ? state.syncCheckpoints[key] : 0; },
      async setSyncCheckpoint(key, value) { validCheckpoint(key, value); await change(next => { next.syncCheckpoints[key] = value; }); },
      getShared(kind, id) {
        if (!SHARED.includes(kind)) throw new Error('共有学習記録の種別が正しくありません。');
        if (id != null) return own(state[kind], id) ? publicRecord(state[kind][id]) : null;
        return Object.fromEntries(Object.entries(state[kind]).map(([key, record]) => [key, publicRecord(record)]));
      },
      // All mutations in one user action commit atomically. Observed vectors are
      // captured at the action, so an unseen concurrent add/reset is not erased.
      async updateShared(actorId, changes) {
        assertId(actorId);
        if (!Array.isArray(changes) || changes.length > 10000) throw new Error('共有学習記録の変更が多すぎます。');
        const checked = changes.map(item => {
          assertId(item.id);
          if (!SHARED.includes(item.kind) || (item.active != null && typeof item.active !== 'boolean') || (item.increment != null && (!Number.isSafeInteger(item.increment) || item.increment < 0 || item.increment > MAX_COUNTER)) || (item.kind === 'favorites' && (item.increment || item.clearCounts))) throw new Error('共有学習記録の変更が正しくありません。');
          return { ...item, observedAdds: item.observedAdds == null ? null : vector(item.observedAdds), observedCounts: item.observedCounts == null ? null : vector(item.observedCounts) };
        });
        return change(next => {
          const results = [];
          for (const item of checked) {
            const previous = next[item.kind][item.id];
            const data = clone(previous?.data || sharedEmpty(item.kind));
            if (item.active === true) data.adds[actorId] = Math.max(data.adds[actorId] || 0, data.removes[actorId] || 0) + 1;
            else if (item.active === false) {
              const observed = { ...(item.observedAdds || data.adds) };
              data.removes = maxVector(data.removes, observed);
            }
            if (item.clearCounts) {
              const observed = { ...(item.observedCounts || data.counts) };
              data.cleared = maxVector(data.cleared, observed);
            }
            if (item.increment) data.counts[actorId] = (data.counts[actorId] || 0) + item.increment;
            const checkedData = normalize(data, item.kind, false);
            if (JSON.stringify(checkedData) !== JSON.stringify(previous?.data || sharedEmpty(item.kind))) next[item.kind][item.id] = makeRecord(item.id, checkedData, false, previous);
            results.push({ kind: item.kind, id: item.id, adds: clone(checkedData.adds), counts: clone(checkedData.counts || {}) });
          }
          return results;
        });
      },
      // Legacy backups use a stable provenance actor. Max-merging makes repeated
      // imports idempotent and preserves any later observed removals/clears.
      async seedShared(actorId, entries) {
        assertId(actorId);
        if (!Array.isArray(entries) || entries.length > 10000) throw new Error('取り込む学習記録が多すぎます。');
        const checked = entries.map(item => {
          assertId(item.id);
          if (!SHARED.includes(item.kind) || (item.active != null && typeof item.active !== 'boolean') || (item.count != null && (!Number.isSafeInteger(item.count) || item.count < 0 || item.count > MAX_COUNTER)) || (item.kind === 'favorites' && item.count)) throw new Error('取り込む学習記録の形式が正しくありません。');
          const data = sharedEmpty(item.kind);
          if (item.active) data.adds[actorId] = 1;
          if (item.count) data.counts[actorId] = item.count;
          return { ...item, data: normalize(data, item.kind, false) };
        });
        await change(next => {
          for (const item of checked) {
            const previous = next[item.kind][item.id];
            const data = mergeShared(previous?.data, item.data, item.kind);
            if (JSON.stringify(data) !== JSON.stringify(previous?.data || sharedEmpty(item.kind))) next[item.kind][item.id] = makeRecord(item.id, data, false, previous);
          }
        });
      },
      list(opts) { return Object.values(state.cards).filter(record => opts?.includeDeleted || !record.deleted).map(publicRecord); },
      get(id) { return own(state.cards, id) ? publicRecord(state.cards[id]) : null; },
      getProgress(id) {
        if (id != null) return own(state.progress, id) ? publicRecord(state.progress[id]) : null;
        return Object.fromEntries(Object.entries(state.progress).filter(([, value]) => !value.deleted).map(([key, value]) => [key, publicRecord(value)]));
      },
      getState() {
        const records = KINDS.flatMap(kind => Object.values(state[kind]));
        return { persistence, warning, blocked, pendingCount: records.filter(record => ['pending', 'error'].includes(record.syncStatus)).length, conflictCount: records.filter(record => record.syncStatus === 'conflict').length, errorCount: records.filter(record => record.syncStatus === 'error').length, conflicts: api.getConflicts() };
      },
      getConflicts() { return KINDS.flatMap(kind => Object.values(state[kind]).filter(record => record.conflict || record.importConflicts?.length).map(record => ({ kind, id: record.id, ...publicRecord(record).conflict }))); },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      async save(fields, opts) {
        const id = fields.id ? assertId(fields.id) : 'personal-' + uuid();
        const data = normalize(fields, 'cards', false);
        await change(next => {
          const current = next.cards[id];
          if ((opts?.expectedRevision != null && opts.expectedRevision !== (current?.baseRevision || 0)) || (opts?.expectedLocalVersion != null && opts.expectedLocalVersion !== (current?.operationId || ''))) {
            const error = new Error('編集中に別の変更が届きました。入力は残っています。最新のカードと比較してください。'); error.code = 'STALE_CARD'; throw error;
          }
          next.cards[id] = makeRecord(id, data, false, current);
        });
        return api.get(id);
      },
      async remove(id, opts) {
        assertId(id);
        await change(next => {
          const current = next.cards[id];
          if ((opts?.expectedRevision != null && opts.expectedRevision !== (current?.baseRevision || 0)) || (opts?.expectedLocalVersion != null && opts.expectedLocalVersion !== (current?.operationId || ''))) { const error = new Error('削除の確認中にカードが更新されました。最新の内容を確認してください。'); error.code = 'STALE_CARD'; throw error; }
          next.cards[id] = makeRecord(id, normalize(current?.data || {}, 'cards', true), true, current);
        });
        return api.get(id);
      },
      async saveProgress(id, fields, opts) {
        assertId(id); const data = normalize(fields, 'progress', false);
        await change(next => {
          const current = next.progress[id];
          if (opts?.expectedLocalVersion != null && opts.expectedLocalVersion !== (current?.operationId || '')) { const error = new Error('練習記録が別の画面で更新されました。'); error.code = 'STALE_CARD'; throw error; }
          const merged = { ...data, attempts: opts?.increment ? Math.max(data.attempts, (current?.data.attempts || 0) + 1) : Math.max(data.attempts, current?.data.attempts || 0) };
          next.progress[id] = makeRecord(id, merged, false, current);
        });
        return api.getProgress(id);
      },
      async resolveConflict(id, choice, opts) {
        assertId(id); const kind = opts?.kind || 'cards';
        if (!['cards', 'progress'].includes(kind) || !['local', 'remote', 'both'].includes(choice) || (kind === 'progress' && choice === 'both')) throw new Error('競合の解決方法が正しくありません。');
        await change(next => {
          const record = next[kind][id];
          if ((opts?.expectedComparisonToken != null && opts.expectedComparisonToken !== comparisonToken(record || {})) ||
              (opts?.expectedLocalVersion != null && opts.expectedLocalVersion !== record?.operationId) ||
              (opts?.expectedRemoteRevision != null && opts.expectedRemoteRevision !== (record?.conflict?.revision || record?.baseRevision || 0))) {
            const error = new Error('比較中にカードが更新されました。最新の2つの内容を確認してから、もう一度選んでください。'); error.code = 'STALE_CARD'; throw error;
          }
          if (!record?.conflict && !record?.importConflicts?.length) throw new Error('このカードには未解決の競合がありません。');
          if (!record.conflict) {
            const imported = record.importConflicts.shift();
            if (choice === 'remote') next[kind][id] = makeRecord(id, imported.data, imported.deleted, record);
            else if (choice === 'local') record.syncStatus = record.importConflicts.length ? 'conflict' : record.operationId === record.baseOperationId ? 'synced' : 'pending';
            else throw new Error('バックアップの練習記録は一方を選んでください。');
            return;
          }
          const remote = record.conflict;
          if (choice === 'remote') next[kind][id] = preserveImports(fromRemote(remote), record);
          else if (choice === 'local') next[kind][id] = makeRecord(id, record.data, record.deleted, preserveImports(fromRemote(remote), record));
          else {
            // Keep the cloud version at its stable ID and preserve the local version as a new card.
            next[kind][id] = fromRemote(remote);
            const newId = 'personal-' + uuid();
            next[kind][newId] = makeRecord(newId, record.data, record.deleted, null);
          }
        });
      },
      exportBackup() {
        if (blocked) throw new Error(warning);
        const backupState = clone(state);
        // Transport cursors belong to a cache and account, never to an imported
        // backup. New caches must read the server from checkpoint zero.
        delete backupState.syncCheckpoints;
        delete backupState.studyActorId;
        return { format: 'chengci-personal-cards', schemaVersion: 1, exportedAt: now(), state: backupState };
      },
      async importBackup(input) {
        const backup = typeof input === 'string' ? JSON.parse(input) : input;
        if (!backup || backup.format !== 'chengci-personal-cards' || backup.schemaVersion !== 1) throw new Error('澄詞のカードバックアップではありません。');
        const incoming = clone(validateState(backup.state));
        let added = 0, duplicates = 0;
        await change(next => {
          next.syncCheckpoints = {};
          for (const kind of KINDS) for (const source of Object.values(incoming[kind])) {
            const existing = next[kind][source.id];
            const same = (a, b) => JSON.stringify(a.data) === JSON.stringify(b.data) && a.deleted === b.deleted;
            if (SHARED.includes(kind)) {
              const data = mergeShared(existing?.data, source.data, kind);
              if (!existing || JSON.stringify(data) !== JSON.stringify(existing.data)) { next[kind][source.id] = makeRecord(source.id, data, false, existing); added++; }
              continue;
            }
            if (kind === 'progress') {
              const target = existing || makeRecord(source.id, source.data, source.deleted, null);
              if (!existing) added++;
              const alternatives = [source, ...(source.conflict ? [source.conflict] : []), ...(source.importConflicts || [])];
              target.importConflicts = target.importConflicts || [];
              for (const alternative of alternatives) {
                if (same(target, alternative) || target.importConflicts.some(item => same(item, alternative))) continue;
                target.importConflicts.push({ token: 'backup-' + uuid(), data: clone(alternative.data), deleted: alternative.deleted, updatedAt: alternative.updatedAt }); duplicates++;
              }
              if (target.importConflicts.length) target.syncStatus = 'conflict';
              next.progress[source.id] = target;
              continue;
            }
            if (!existing || !same(existing, source)) {
              const id = existing ? 'personal-' + uuid() : source.id;
              next.cards[id] = makeRecord(id, source.data, source.deleted, null);
              added++; if (existing) duplicates++;
            }
            if (source.conflict) {
              const other = source.conflict;
              if (!Object.values(next.cards).some(item => same(item, other))) {
                const otherId = 'personal-' + uuid();
                next.cards[otherId] = makeRecord(otherId, other.data, other.deleted, null); added++;
              }
            }
          }
        });
        return { added, duplicates };
      },
      async setPersistence(enabled) {
        await api.ready;
        return serial(async () => {
          if (enabled && persistence === 'device' && !blocked) return;
          if (!enabled && persistence === 'memory' && !blocked) return;
          try {
            if (enabled) {
              const target = options.deviceAdapter || indexedDBAdapter(env.indexedDB);
              const local = clone(state);
              const merged = await target.transact(next => {
                next.syncCheckpoints = {};
                for (const kind of KINDS) for (const [id, record] of Object.entries(local[kind])) {
                  if (!next[kind][id]) next[kind][id] = record;
                  else if (JSON.stringify(next[kind][id]) !== JSON.stringify(record)) {
                    // Do not overwrite another tab's local edit while enabling persistence.
                    if (SHARED.includes(kind)) {
                      const existing = next[kind][id];
                      const data = mergeShared(existing.data, record.data, kind);
                      if (JSON.stringify(data) !== JSON.stringify(existing.data)) next[kind][id] = makeRecord(id, data, false, existing);
                    } else if (kind === 'cards') { const copyId = 'personal-' + uuid(); next.cards[copyId] = makeRecord(copyId, record.data, record.deleted, null); }
                    else throw new Error('別のタブの練習記録があります。バックアップしてから開き直してください。');
                  }
                }
              });
              env.localStorage?.setItem(PREFERENCE, 'device');
              adapter = target; state = merged.state; persistence = 'device'; blocked = false;
            } else {
              if (blocked) throw new Error('読み込めない保存データがあります。消去せず、別のブラウザーで続けるかバックアップを確認してください。');
              // Disable device storage only through this explicit user action. Existing dictionary/recall keys are untouched.
              let current;
              env.localStorage?.removeItem(PREFERENCE);
              try { const removed = await adapter.transact(next => { const preserved = clone(next); for (const kind of KINDS) next[kind] = {}; next.syncCheckpoints = {}; next.studyActorId = null; return preserved; }); current = removed.result; }
              catch (error) { try { env.localStorage?.setItem(PREFERENCE, 'device'); } catch (_) {} throw error; }
              state = current; adapter = memoryAdapter(current); persistence = 'memory';
            }
            warning = ''; publish(); channel?.postMessage('changed');
          } catch (error) { warning = error.message; publish(); throw error; }
        });
      },
      async reload() {
        await api.ready;
        return serial(async () => {
          try { const current = validateState(await adapter.read()); const changed = JSON.stringify(state) !== JSON.stringify(current) || !!warning; state = current; warning = ''; if (changed) publish(); }
          catch (error) { warning = error.message; blocked = true; publish(); throw error; }
        });
      },
      // Transport interface. Each outgoing operation is durably reserved before any network call.
      async prepareNext(excluded) {
        let operation = null;
        await change(next => {
          for (const kind of KINDS) for (const record of Object.values(next[kind])) {
            if (operation || !['pending', 'error'].includes(record.syncStatus) || excluded?.has(kind + ':' + record.id)) continue;
            if (!record.inflight) record.inflight = { id: record.id, operationId: record.operationId, baseRevision: record.baseRevision, deleted: record.deleted, updatedAt: record.updatedAt, data: clone(record.data) };
            operation = { kind, ...clone(record.inflight) };
          }
        });
        return operation;
      },
      async applyRemote(kind, documents, opts) {
        if (opts?.checkpointKey != null) validCheckpoint(opts.checkpointKey, opts.checkpoint);
        if (!KINDS.includes(kind)) throw new Error('同期データ種別が正しくありません。');
        const checked = documents.map(document => validRemote(document, kind));
        await change(next => {
          for (const remote of checked) next[kind][remote.id] = mergeRemote(next[kind][remote.id], remote, kind);
          if (opts?.checkpointKey != null) next.syncCheckpoints[opts.checkpointKey] = Math.max(next.syncCheckpoints[opts.checkpointKey] || 0, opts.checkpoint);
        });
      },
      async markError(operation, message) {
        await change(next => { const record = next[operation.kind]?.[operation.id]; if (record?.inflight?.operationId === operation.operationId && record.syncStatus !== 'conflict') { record.syncStatus = 'error'; record.error = String(message).slice(0, 300); } });
      }
    };
    api.ready = (async () => {
      try {
        if (!options.adapter && env.localStorage?.getItem(PREFERENCE) === 'device') { adapter = options.deviceAdapter || indexedDBAdapter(env.indexedDB); persistence = 'device'; }
        state = validateState(await adapter.read());
        if (options.broadcast !== false && env.BroadcastChannel) {
          channel = new env.BroadcastChannel(DATABASE);
          channel.onmessage = () => { if (persistence === 'device') api.reload().catch(() => {}); };
          channel.unref?.();
        }
      } catch (error) { blocked = true; warning = error.message; }
      publish(); return api.getState();
    })();
    return api;
  }
  const exported = { createStore, memoryAdapter, indexedDBAdapter, validRemote, mergeShared, active, total, DATABASE, PREFERENCE };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  else root.ChengciCardStore = createStore();
})(typeof window !== 'undefined' ? window : globalThis);
