/* Shared favorites and study activity. Bundled dictionary objects are read-only. */
(function (root) {
  'use strict';
  const QUIZ_ID = 'study-quiz-runs';
  const TYPES = {
    word: { key: 'word', weak: 'weakWords', counts: 'mistakeCounts' },
    pattern: { key: 'pattern', weak: 'weakCards', counts: 'patternMistakeCounts' },
    idiom: { key: 'text', weak: 'weakIdioms', counts: 'idiomMistakeCounts' }
  };
  const SET_KEYS = ['favorites', 'weakWords', 'weakCards', 'weakIdioms'];
  const COUNT_KEYS = ['mistakeCounts', 'patternMistakeCounts', 'idiomMistakeCounts'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,149}$/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value);
  const active = data => Object.entries(data?.adds || {}).some(([actor, value]) => value > (data.removes?.[actor] || 0));
  const total = data => Object.entries(data?.counts || {}).reduce((sum, [actor, value]) => sum + Math.max(0, value - (data.cleared?.[actor] || 0)), 0);
  function snapshot(value) {
    const result = {};
    for (const key of SET_KEYS) {
      const values = value[key] || [];
      if (!Array.isArray(values) || values.some(item => typeof item !== 'string')) throw new Error('学習一覧の形式が正しくありません。');
      result[key] = [...new Set(values)];
    }
    for (const key of COUNT_KEYS) {
      const values = value[key] || {};
      if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('学習回数の形式が正しくありません。');
      result[key] = {};
      for (const [item, count] of Object.entries(values)) {
        if (['__proto__', 'constructor', 'prototype'].includes(item) || !Number.isSafeInteger(count) || count < 0) throw new Error('学習回数の形式が正しくありません。');
        if (count) result[key][item] = count;
      }
    }
    result.quizRuns = value.quizRuns || 0;
    if (!Number.isSafeInteger(result.quizRuns) || result.quizRuns < 0) throw new Error('練習回数の形式が正しくありません。');
    return result;
  }
  function browserApp() {
    const views = {}, viewNames = {
      word: ['showFavorites', 'showWeakWords', 'showPriorityWords', 'filterByCategory', 'showAllWords'],
      pattern: ['showPatternPriority', 'showAllPatterns'],
      idiom: ['showIdiomPriority', 'showAllIdioms']
    };
    let rendering = false;
    for (const [type, names] of Object.entries(viewNames)) for (const name of names) {
      const original = root[name];
      if (typeof original !== 'function') continue;
      root[name] = function (...args) {
        const result = original.apply(this, args);
        if (!rendering) views[type] = () => original.apply(this, args);
        return result;
      };
    }
    const originalFilter = root.applyTagFilter;
    if (typeof originalFilter === 'function') root.applyTagFilter = function (type) {
      const result = originalFilter.call(this, type);
      if (!rendering) views[type] = () => originalFilter.call(this, type);
      return result;
    };
    return {
      read() { return { favorites, weakWords, weakCards, weakIdioms, mistakeCounts, patternMistakeCounts, idiomMistakeCounts, quizRuns }; },
      write(value) {
        favorites = value.favorites; weakWords = value.weakWords; weakCards = value.weakCards; weakIdioms = value.weakIdioms;
        mistakeCounts = value.mistakeCounts; patternMistakeCounts = value.patternMistakeCounts; idiomMistakeCounts = value.idiomMistakeCounts; quizRuns = value.quizRuns;
      },
      installSave(fn) { const previous = saveAll; saveAll = fn(previous); },
      localRender() { if (typeof updateStats === 'function') updateStats(); },
      render() {
        if (typeof updateStats === 'function') updateStats();
        rendering = true;
        try {
          if (typeof applyTagFilter === 'function') ['word', 'pattern', 'idiom'].forEach(type => views[type] ? views[type]() : applyTagFilter(type));
          if (typeof searchWords === 'function') searchWords();
        } finally { rendering = false; }
      }
    };
  }
  function createStudySync(options) {
    options = options || {};
    const env = options.env || root;
    const store = options.store || env.ChengciCardStore;
    const app = options.app || browserApp();
    const model = options.model || env.CHENGCI_DATA_MODEL;
    // Capture the deployment opt-in once. A temporarily unavailable/disabled
    // backend must never switch back to legacy whole-state localStorage writes.
    const config = options.config === undefined ? env.CHENGCI_SYNC_CONFIG : options.config;
    const configured = config?.enabled === true && config.provider === 'cloudflare';
    const enabled = typeof options.enabled === 'function' ? options.enabled : () => options.enabled != null ? !!options.enabled : configured;
    const uuid = options.uuid || (() => {
      if (env.crypto?.randomUUID) return env.crypto.randomUUID();
      if (env.crypto?.getRandomValues) return Array.from(env.crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
      throw new Error('学習記録の端末IDを作れません。HTTPSで開いてください。');
    });
    const byType = {};
    for (const type of Object.keys(TYPES)) {
      const lookup = new Map();
      for (const item of model?.allItems || []) if (item.type === type && validId(item.id) && !lookup.has(item[TYPES[type].key])) lookup.set(item[TYPES[type].key], item.id);
      byType[type] = lookup;
    }
    let baseline = snapshot(app.read()), applying = false, ready = false, warning = '', running = null, sessionActor;
    const pending = [], listeners = new Set(), observedOwnAdds = new Map(), observedOwnCounts = new Map();
    function publish() {
      const state = api.getState();
      for (const fn of listeners) { try { fn(state); } catch (error) { env.console?.error(error); } }
      if (env.CustomEvent && env.dispatchEvent) env.dispatchEvent(new env.CustomEvent('chengci-study-sync-state', { detail: state }));
    }
    async function actor() {
      if (options.actorId) { if (!validId(options.actorId)) throw new Error('学習記録の端末IDが正しくありません。'); return options.actorId; }
      if (store.getState().persistence !== 'device') return sessionActor || (sessionActor = 'session-' + uuid());
      return store.ensureStudyActorId('device-' + uuid());
    }
    function project() {
      const value = snapshot({});
      const favorites = store.getShared('favorites'), study = store.getShared('study');
      for (const [key, id] of byType.word) if (active(favorites[id])) value.favorites.push(key);
      for (const [type, fields] of Object.entries(TYPES)) for (const [key, id] of byType[type]) {
        if (active(study[id])) value[fields.weak].push(key);
        const count = total(study[id]); if (count) value[fields.counts][key] = count;
      }
      value.quizRuns = total(study[QUIZ_ID]);
      return value;
    }
    function apply() {
      if (!ready || !enabled() || pending.length || applying || store.getState().blocked) return;
      const value = project();
      if (JSON.stringify(value) === JSON.stringify(baseline)) return;
      applying = true;
      try { app.write(clone(value)); baseline = value; app.render(); }
      finally { applying = false; }
    }
    function differences(before, after) {
      const changes = [];
      const oldFavorites = new Set(before.favorites), newFavorites = new Set(after.favorites);
      for (const key of new Set([...oldFavorites, ...newFavorites])) {
        if (oldFavorites.has(key) === newFavorites.has(key)) continue;
        const id = byType.word.get(key); if (!id) throw new Error('元の辞書にないお気に入りがあります。バックアップを残して辞書を更新してください。');
        changes.push({ kind: 'favorites', id, active: newFavorites.has(key), observedAdds: store.getShared('favorites', id)?.adds || {} });
      }
      for (const [type, fields] of Object.entries(TYPES)) {
        const oldWeak = new Set(before[fields.weak]), newWeak = new Set(after[fields.weak]);
        for (const key of new Set([...oldWeak, ...newWeak, ...Object.keys(before[fields.counts]), ...Object.keys(after[fields.counts])])) {
          const previous = before[fields.counts][key] || 0, count = after[fields.counts][key] || 0;
          if (oldWeak.has(key) === newWeak.has(key) && previous === count) continue;
          const id = byType[type].get(key); if (!id) throw new Error('元の辞書にない学習記録があります。バックアップを残して辞書を更新してください。');
          const observed = store.getShared('study', id);
          const change = { kind: 'study', id, observedAdds: observed?.adds || {}, observedCounts: observed?.counts || {} };
          if (oldWeak.has(key) !== newWeak.has(key) || (count > previous && newWeak.has(key))) change.active = newWeak.has(key);
          if (count > previous) change.increment = count - previous;
          else if (count < previous) { change.clearCounts = true; change.increment = count; }
          changes.push(change);
        }
      }
      if (after.quizRuns > before.quizRuns) changes.push({ kind: 'study', id: QUIZ_ID, increment: after.quizRuns - before.quizRuns });
      // quizRuns is intentionally grow-only. Old-history resets are handled by
      // starting the new shared account empty, never by overwriting other devices.
      return changes;
    }
    async function flush() {
      if (running) return running;
      running = (async () => {
        await api.ready;
        while (pending.length) {
          const operation = pending[0];
          try {
            if (!operation.actorId) operation.actorId = await actor();
            const changes = operation.changes.map(item => {
              const key = operation.actorId + ':' + item.kind + ':' + item.id;
              const next = { ...item };
              // Include this tab's earlier queued gestures, without accidentally
              // observing a later event from another tab sharing the same actor.
              if (item.active === false && item.observedAdds) next.observedAdds = { ...item.observedAdds, [operation.actorId]: Math.max(item.observedAdds[operation.actorId] || 0, observedOwnAdds.get(key) || 0) };
              if (item.clearCounts && item.observedCounts) next.observedCounts = { ...item.observedCounts, [operation.actorId]: Math.max(item.observedCounts[operation.actorId] || 0, observedOwnCounts.get(key) || 0) };
              return next;
            });
            const committed = await store.updateShared(operation.actorId, changes);
            committed.forEach((item, index) => {
              const key = operation.actorId + ':' + item.kind + ':' + item.id;
              if (changes[index].active === true) observedOwnAdds.set(key, item.adds[operation.actorId] || 0);
              if (changes[index].increment) observedOwnCounts.set(key, item.counts[operation.actorId] || 0);
            });
            pending.shift(); warning = ''; publish();
          } catch (error) { delete operation.actorId; warning = error.message; publish(); throw error; }
        }
      })();
      try { await running; }
      finally { running = null; if (!pending.length) apply(); }
    }
    function capture() {
      if (applying || !enabled()) return;
      try {
        const next = snapshot(app.read());
        const changes = differences(baseline, next);
        baseline = next;
        if (changes.length) { pending.push({ changes }); publish(); flush().catch(() => {}); }
      } catch (error) { warning = error.message; publish(); throw error; }
    }
    const api = {
      ready: null,
      getState() { return { enabled: enabled(), ready, warning, unsavedCount: pending.length }; },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      retry: flush,
      capture,
      readLegacyStorage() {
        const result = {};
        for (const key of [...SET_KEYS, ...COUNT_KEYS]) { const raw = env.localStorage?.getItem(key); if (raw != null) result[key] = JSON.parse(raw); }
        const count = env.localStorage?.getItem('quizRuns'); if (count != null) result.quizRuns = Number(count);
        return snapshot(result);
      },
      async seedLegacy(value, sourceId) {
        if (!validId(sourceId)) throw new Error('移行データのIDが正しくありません。');
        await api.ready; await flush();
        const checked = snapshot(value), entries = [], skipped = [];
        for (const key of checked.favorites) { const id = byType.word.get(key); if (id) entries.push({ kind: 'favorites', id, active: true }); else skipped.push({ type: 'word', key }); }
        for (const [type, fields] of Object.entries(TYPES)) {
          const weak = new Set(checked[fields.weak]);
          for (const key of new Set([...weak, ...Object.keys(checked[fields.counts])])) {
            const id = byType[type].get(key);
            if (id) entries.push({ kind: 'study', id, active: weak.has(key), count: checked[fields.counts][key] || 0 });
            else skipped.push({ type, key });
          }
        }
        if (checked.quizRuns) entries.push({ kind: 'study', id: QUIZ_ID, count: checked.quizRuns });
        try { await store.seedShared('legacy-baseline-v1', entries); warning = ''; apply(); publish(); return { imported: entries.length, skipped }; }
        catch (error) { warning = error.message; publish(); throw error; }
      }
    };
    app.installSave(original => function () {
      if (!enabled()) return original.apply(this, arguments);
      // The original function writes several legacy localStorage snapshots. Do
      // not call it in session-only/shared mode or when receiving cloud changes.
      capture(); app.localRender?.();
    });
    store.subscribe(() => apply());
    env.addEventListener?.('beforeunload', event => { if (pending.length) { event.preventDefault(); event.returnValue = ''; } });
    api.ready = (async () => { await store.ready; ready = true; apply(); publish(); return api.getState(); })();
    return api;
  }
  const exported = { createStudySync, QUIZ_ID, snapshot, active, total };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  else root.ChengciStudySync = createStudySync();
})(typeof window !== 'undefined' ? window : globalThis);
