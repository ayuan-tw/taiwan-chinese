// Separate recognition practice. Existing dictionary cards and quiz history stay intact.
(function () {
  'use strict';
  const STORAGE_KEY = 'chengciRecallV1';
  const MAX_HISTORY = 5000;
  let revealed = false;
  let generation = 0;
  let storageWarning = '';
  let initialized = false;
  let vocabularyEpoch = 0;
  let state = readState();
  const pendingProgress = new Map();

  // Old clients may keep writing the legacy key after vocabulary adoption.
  // Never let their session or round history re-enter the new vocabulary.
  function storageKey(epoch = vocabularyEpoch) { return epoch ? `${STORAGE_KEY}:epoch:${epoch}` : STORAGE_KEY; }
  function emptyState() { return { range: 'all', history: {}, queue: [], signature: '', total: 0, completed: 0, started: false }; }
  function currentEpoch() { return window.ChengciCardStore?.getState().vocabulary?.epoch || 0; }
  function canPersistLocally() {
    const store = window.ChengciCardStore;
    return !store || (store.canPersistLocally ? store.canPersistLocally() : store.getState().persistence === 'device');
  }
  function readState(epoch = vocabularyEpoch) {
    try {
      // Private unified sessions are only restored while device saving is on.
      if (epoch && !canPersistLocally()) return emptyState();
      const value = JSON.parse(localStorage.getItem(storageKey(epoch)) || '{}');
      if (value.epoch != null && value.epoch !== epoch) return emptyState();
      return {
        range: value.range === 'pending' || (!value.range && value.signature?.endsWith('|pending')) ? 'pending' : 'all',
        history: value.history && typeof value.history === 'object' && !Array.isArray(value.history) ? value.history : {},
        queue: Array.isArray(value.queue) ? value.queue.filter(id => typeof id === 'string') : [],
        signature: typeof value.signature === 'string' ? value.signature : '',
        total: Number.isFinite(value.total) ? value.total : 0,
        completed: Number.isFinite(value.completed) ? value.completed : 0,
        started: value.started === true
      };
    } catch (_) {
      storageWarning = '前の練習記録を読み込めませんでした。新しい練習を始められます。';
      return emptyState();
    }
  }

  function syncVocabularyEpoch() {
    const epoch = currentEpoch();
    if (epoch === vocabularyEpoch) return false;
    vocabularyEpoch = epoch;
    state = readState(epoch);
    revealed = false;
    generation += 1;
    pendingProgress.clear();
    document.getElementById('recallRange').value = state.range;
    return true;
  }

  function persist() {
    if (currentEpoch() !== vocabularyEpoch) return false;
    try {
      // Another tab may have opted out before its broadcast reaches this one.
      // The store distinguishes actual device preferences from injected adapters.
      if (!canPersistLocally()) return true;
      localStorage.setItem(storageKey(), JSON.stringify({...state, epoch:vocabularyEpoch}));
      return true;
    } catch (_) {
      storageWarning = '練習記録を保存できません。この画面では続けられますが、閉じると記録が残らない場合があります。';
      return false;
    }
  }

  function keyOf(item) { return item.id || 'word:' + item.word; }
  function escape(value) { return escapeHtml(String(value || '')); }
  function allWords() {return window.ChengciPersonalCards ? window.ChengciPersonalCards.allWords() : words;}
  function learningWords() {
    const provider = window.ChengciPersonalCards;
    return provider?.learningWords ? provider.learningWords() : allWords().filter(item => !provider?.isRemembered?.(keyOf(item)));
  }
  function selectedPool() {
    if (window.ChengciPersonalCards) return learningWords().filter(item => typeof itemMatchesStudyScope !== 'function' || itemMatchesStudyScope(item, 'word'));
    return typeof scopedStudyItems === 'function' ? scopedStudyItems('word') : words;
  }
  function syncProgress() {
    const progress = window.ChengciCardStore?.getProgress() || {};
    for(const [id, item] of Object.entries(progress)) {
      if (!pendingProgress.has(id)) state.history[id] = {result:item.result,attempts:item.attempts,updatedAt:item.updatedAt};
    }
  }
  function signature() {
    return (typeof studyScopeSignature === 'function' ? studyScopeSignature() : 'all') + '|' + document.getElementById('recallRange').value;
  }
  function practicePool() {
    const onlyPending = document.getElementById('recallRange').value === 'pending';
    return selectedPool().filter(item => !onlyPending || state.history[keyOf(item)]?.result !== 'read');
  }
  function currentItem() {
    return learningWords().find(item => keyOf(item) === state.queue[0]);
  }
  function reconcile() {
    const before = JSON.stringify([state.queue, state.total, state.started]);
    const previousId = state.queue[0];
    const available = new Set(learningWords().map(keyOf));
    state.queue = [...new Set(state.queue.filter(id => available.has(id)))];
    if (state.started) state.total = state.completed + state.queue.length;
    if (state.started && state.signature !== signature()) {
      state.started = false;
      state.queue = [];
      revealed = false;
    }
    if (previousId !== state.queue[0]) revealed = false;
    if (before !== JSON.stringify([state.queue, state.total, state.started])) persist();
  }
  function tones(zhuyin) {
    const syllables = String(zhuyin || '').match(/[˙]?[ㄅ-ㄩ]+[ˊˇˋ˙]?/g) || [];
    return syllables.map(syllable => syllable.includes('˙') ? '軽声' : syllable.includes('ˊ') ? '2' : syllable.includes('ˇ') ? '3' : syllable.includes('ˋ') ? '4' : '1').join('・');
  }

  function render() {
    const area = document.getElementById('recallArea');
    if (!area || !initialized) return;
    syncVocabularyEpoch();
    syncProgress();
    reconcile();
    const pool = practicePool();
    const summary = document.getElementById('recallSummary');
    const scopeWords = selectedPool();
    const readCount = scopeWords.filter(item => state.history[keyOf(item)]?.result === 'read').length;
    summary.textContent = `今の学習範囲：${scopeWords.length}語 / 読めた：${readCount}語 / 未練習・まだ：${scopeWords.length - readCount}語`;
    document.getElementById('recallStorageStatus').textContent = storageWarning;
    const restart = document.getElementById('recallStart');
    restart.textContent = state.started && state.queue.length ? '最初から練習' : '練習を始める';
    if (!state.started) {
      area.innerHTML = `<div class="recall-empty">${pool.length ? '繁體字を見て、読み方と意味を思い出そう。' : 'この範囲のカードはありません。学習範囲や「出題」を変えてね。'}</div>`;
      return;
    }
    const item = currentItem();
    if (!item && !state.total) {
      area.innerHTML = '<div class="recall-empty">練習するカードはありません。「覚えた」の単語は単語帳から確認できます。</div>';
      return;
    }
    if (!item) {
      area.innerHTML = `<div class="recall-complete" tabindex="-1" aria-label="この山札は読めた"><div aria-hidden="true">🌱</div><h3>この山札は読めた！</h3><p>${state.total}語を練習しました。「まだ」のカードも、最後まで読み直せました。</p><button type="button" data-recall-action="restart">もう一度練習する</button></div>`;
      return;
    }
    const token = ++generation;
    const answer = revealed ? `<div class="recall-answer" id="recallAnswer" tabindex="-1" role="group" aria-label="答え" aria-describedby="recallPronunciation recallMeaning recallExample"><div id="recallPronunciation" class="zhuyin" lang="zh-Bopo">${escape(item.zhuyin || '注音は未登録')}</div>${item.zhuyin ? `<div class="recall-tones">声調：${escape(tones(item.zhuyin))}</div>` : ''}${item.pronunciationStatus === 'candidate' ? '<p class="recall-caution">注音は自動候補です。多音字・軽声を確認してね。</p>' : ''}<div id="recallMeaning" class="meaning">${escape(item.meaning || '意味は未入力。あとから編集できます。')}</div>${item.example ? `<div id="recallExample" class="recall-source"><span>元の例文</span><p lang="zh-Hant-TW">${escape(item.example)}</p>${item.exampleZhuyin ? `<div class="zhuyin">${escape(item.exampleZhuyin)}</div>` : ''}</div>` : '<p id="recallExample" class="hint">元の例文は未登録です。</p>'}<div class="audio-row">${audioButton(item.word, '🔊 單字')}${audioButton(item.example, '🔊 例文')}</div><div class="recall-edit">${window.ChengciPersonalCards ? `<button type="button" class="secondary small" data-personal-edit="${escape(encodeURIComponent(keyOf(item)))}">このカードを編集</button>${window.ChengciPersonalCards.setRemembered ? `<label class="personal-remembered-control"><input type="checkbox" data-personal-remembered="${escape(encodeURIComponent(keyOf(item)))}" data-remembered="true"> 覚えた</label>` : ''}` : ''}</div><div class="recall-rating"><button class="secondary" type="button" data-recall-action="notyet" data-recall-token="${token}">まだ ↻</button><button type="button" data-recall-action="read" data-recall-token="${token}">読めた →</button></div><p class="recall-help">「まだ」は山札の後ろへ戻ります。「覚えた」は単語帳に残したまま練習から外します。</p></div>` : `<button class="recall-reveal" type="button" data-recall-action="reveal">答えを見る</button>`;
    area.innerHTML = `<article class="recall-card"><div class="recall-progress">読めた ${state.completed} / ${state.total}語 · 残り ${state.queue.length}語</div><h3 class="recall-front" tabindex="-1" lang="zh-Hant-TW">${escape(item.word)}</h3>${answer}</article>`;
  }

  function start() {
    syncVocabularyEpoch();
    syncProgress();
    reconcile();
    if (state.started && state.queue.length && !window.confirm('今の山札を最初から練習しますか？「読めた・まだ」の記録は残ります。')) return;
    const pool = shuffleArray(practicePool());
    pool.sort((a, b) => (state.history[keyOf(b)]?.result === 'notyet' ? 1 : 0) - (state.history[keyOf(a)]?.result === 'notyet' ? 1 : 0));
    state.queue = pool.map(keyOf);
    state.range = document.getElementById('recallRange').value;
    state.signature = signature();
    state.total = pool.length;
    state.completed = 0;
    state.started = pool.length > 0;
    revealed = false;
    persist();
    render();
    focusCard();
  }
  function focusCard() {
    document.querySelector('#recallArea .recall-front, #recallArea .recall-complete')?.focus({ preventScroll: true });
  }
  function rate(result, token) {
    if (!['read', 'notyet'].includes(result) || !revealed || Number(token) !== generation || !state.queue.length) return;
    // A store change may arrive before its UI notification. Do not rate a
    // remembered/deleted card, or interpret an old answer in a new epoch.
    if (currentEpoch() !== vocabularyEpoch || !currentItem()) { render(); return; }
    const epoch = vocabularyEpoch;
    const id = state.queue.shift();
    const previous = state.history[id];
    state.history[id] = { result, attempts: (Number(previous?.attempts) || 0) + 1, updatedAt: new Date().toISOString() };
    if (result === 'notyet') state.queue.push(id);
    else state.completed += 1;
    if (Object.keys(state.history).length > MAX_HISTORY) {
      const keep = Object.entries(state.history).sort((a, b) => String(b[1].updatedAt).localeCompare(String(a[1].updatedAt))).slice(0, MAX_HISTORY);
      state.history = Object.fromEntries(keep);
    }
    revealed = false;
    persist();
    if(window.ChengciCardStore) {
      const pending = pendingProgress.get(id) || { count:0 };
      pending.count += 1;
      pendingProgress.set(id, pending);
      const progress = {...state.history[id]};
      Promise.resolve().then(() => window.ChengciCardStore.saveProgress(id, progress, {increment:true, expectedEpoch:epoch})).catch(error => {
        if (epoch === vocabularyEpoch && epoch === currentEpoch()) storageWarning = error?.message || '進捗を保存できませんでした。';
      }).finally(() => {
        // An old save must not consume a new-epoch pending write for this ID.
        if (pendingProgress.get(id) === pending && !--pending.count) pendingProgress.delete(id);
        render();
      });
    }
    render();
    focusCard();
  }
  async function init() {
    const panel = document.getElementById('recallPanel');
    if (!panel) return;
    document.getElementById('recallRange').value = state.range;
    if (window.ChengciCardStore && window.ChengciPersonalCards?.ready) {
      const startButton = document.getElementById('recallStart');
      const range = document.getElementById('recallRange');
      const area = document.getElementById('recallArea');
      startButton.disabled = range.disabled = true;
      area.innerHTML = '<div class="recall-empty">カードを読み込んでいます…</div>';
      let loaded = false;
      try { loaded = await window.ChengciPersonalCards.ready === true; } catch (_) {}
      if (!loaded) {
        area.innerHTML = '<div class="recall-empty">カードを読み込めなかったため、練習を再開できません。ページを開き直してね。</div>';
        document.getElementById('recallStorageStatus').textContent = '保存済みの山札と練習記録は残しています。';
        return;
      }
      startButton.disabled = range.disabled = false;
    }
    initialized = true;
    document.getElementById('recallStart').addEventListener('click', start);
    document.getElementById('recallRange').addEventListener('change', () => { const range = document.getElementById('recallRange').value; syncVocabularyEpoch(); state.range = range; document.getElementById('recallRange').value = range; state.started = false; state.queue = []; revealed = false; persist(); render(); });
    panel.addEventListener('click', event => {
      const button = event.target.closest('[data-recall-action]');
      if (!button) return;
      const action = button.dataset.recallAction;
      if (action === 'reveal') { revealed = true; render(); document.getElementById('recallAnswer')?.focus({ preventScroll: true }); }
      else if (action === 'restart') start();
      else rate(action, button.dataset.recallToken);
    });
    document.getElementById('studyScopePanel')?.addEventListener('click', render);
    window.addEventListener('chengci-user-cards-changed', render);
    render();
  }
  window.ChengciRecall = { refresh: render };
  window.addEventListener('load', init);
})();
