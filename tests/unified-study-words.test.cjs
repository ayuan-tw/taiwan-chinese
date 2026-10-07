const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createStore, memoryAdapter } = require('../js/card-store.js');
const { createStudySync, snapshot, active, total } = require('../js/study-sync.js');
const root = path.join(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));
const decode = value => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function browser() {
  const elements = new Map(), events = new Map(), storage = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, { id, innerHTML: '', textContent: '', value: '', checked: false,
      firstChild: { textContent: '' }, dataset: {}, style: {}, classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, scrollIntoView() {}, focus() {}, setAttribute() {}, appendChild() {}, remove() {} });
    return elements.get(id);
  }
  const context = { console, document: { getElementById: element, querySelectorAll(selector) {
    if (selector === '#quizArea .quiz-options button') return [...element('quizArea').innerHTML.matchAll(/<button onclick="checkAnswerEncoded\('[^']*'\)">([^]*?)<\/button>/g)].map(match => ({ textContent: decode(match[1]), disabled: false, classList: { add() {} } }));
    return [];
  }, addEventListener() {} }, navigator: { onLine: true },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    addEventListener(type, callback) { events.set(type, [...(events.get(type) || []), callback]); },
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, confirm: () => true,
    location: { reload() {} }, URL, Blob, CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }, dispatchEvent(event) { for (const callback of events.get(event.type) || []) callback(event); } };
  context.window = context;
  vm.createContext(context);
  for (const name of ['data/words.js', 'js/data-model.js', 'js/app.js', 'js/shortcut-export.js']) vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context, { filename: name });
  context.shouldAutoSpeak = () => false;
  context.stopSpeech = () => {};
  let items = [];
  const remembered = new Set();
  context.ChengciPersonalCards = { allWords: () => items, learningWords: () => items.filter(item => !remembered.has(item.id)), isRemembered: id => remembered.has(id) };
  return { context, element, remembered, setItems(value) { items = value; }, fire(type) { for (const callback of events.get(type) || []) callback({}); }, run: code => vm.runInContext(code, context) };
}
const word = (id, fields = {}) => ({ id, type: 'word', word: id, zhuyin: 'ㄉㄜ˙', meaning: '意味', category: '日常', example: '例文', exampleZhuyin: 'ㄌㄧˋ', note: 'メモ', confuse: '注意', tags: ['共通'], ...fields });

test('list/search/category/export read the full live inventory while every word practice pool excludes remembered words', () => {
  const b = browser();
  const first = word('personal-one', { word: '自分の新単語', tags: ['専用'] });
  const mastered = word('personal-remembered', { word: '覚えた単語', tags: ['専用'] });
  b.setItems([first, mastered]); b.remembered.add(mastered.id);
  b.context.renderWordList();
  assert.match(b.element('wordList').innerHTML, /自分の新単語/);
  assert.match(b.element('wordList').innerHTML, /覚えた単語/);
  assert.match(b.element('wordList').innerHTML, /data-personal-edit="personal-one"/);
  assert.match(b.element('wordList').innerHTML, /data-personal-remembered="personal-remembered" data-remembered="false"/);
  b.element('searchInput').value = '覚えた単語'; b.context.searchWords();
  assert.match(b.element('searchResults').innerHTML, /覚えた単語/);
  b.context.filterByCategory('日常'); assert.match(b.element('wordList').innerHTML, /自分の新単語/);
  assert.deepEqual(clone(b.context.scopedStudyItems('word')).map(item => item.id), [first.id]);
  assert.deepEqual(clone(b.context.scopedQuizItems('word')).map(item => item.key), [first.id]);
  assert.deepEqual(clone(b.context.scopedCompositionPool('word')).map(item => item.key), [first.id]);
  assert.equal(b.context.CHENGCI_SHORTCUT_EXPORT.selectedShortcutExportRecords('tag', '専用').length, 2);
  b.context.startQuiz('word'); assert.equal(b.run('currentQuiz.key'), first.id);
  b.context.startAudioQuiz('choice'); assert.equal(b.run('currentAudioQuiz.id'), first.id);
  b.context.startComposition('word'); assert.equal(b.run('currentComposition.key'), first.id);
  assert.equal(b.run('words.some(item => item.id === "personal-one")'), false, 'the bundled array stays unchanged');
});

test('all user word fields stay text in cards, filter controls, quizzes and composition; action payloads retain exact raw strings', () => {
  const b = browser();
  const payload = `中文'\");globalThis.attack=true;//<img src=x onerror="attack=true">&\n`;
  const item = word('personal-hostile', { word: payload, category: payload, meaning: payload, zhuyin: payload, note: payload, confuse: payload, example: payload, exampleZhuyin: payload, tags: [payload] });
  b.setItems([item]);
  const safe = html => { assert.doesNotMatch(html, /<img\b|<script\b|onerror="/i); assert.match(html, /&lt;img/); };
  safe(b.context.createWordCard(item));
  b.context.renderCategoryButtons(); safe(b.element('categoryButtons').innerHTML);
  b.context.renderTagButtons(); safe(b.element('tagButtons').innerHTML);
  b.context.renderStudyScope(); safe(b.element('studyScopeTagButtons').innerHTML);
  b.context.startQuiz('word'); safe(b.element('quizArea').innerHTML);
  const action = [...b.element('quizArea').innerHTML.matchAll(/onclick="([^"]+)"/g)].map(match => decode(match[1])).find(code => code.startsWith('checkAnswerEncoded('));
  b.run(action); safe(b.element('quizResult').innerHTML); assert.equal(b.context.attack, undefined);
  assert.match(b.element('quizResult').innerHTML, /正解/);
  b.context.startComposition('word'); safe(b.element('compositionArea').innerHTML);
  b.context.showCompositionAnswer(); safe(b.element('compositionResult').innerHTML);
  b.element('compositionInput').value = '別の答え'; b.context.checkCompositionAnswer(); safe(b.element('compositionResult').innerHTML);
  b.context.startAudioQuiz('choice'); safe(b.element('audioQuizArea').innerHTML);
  b.context.revealAudioQuizResult(false, payload); safe(b.element('audioQuizResult').innerHTML);
  const categoryAction = decode(b.element('categoryButtons').innerHTML.match(/onclick="(filterByCategoryEncoded[^\"]+)"/)[1]);
  b.run(categoryAction); assert.equal(b.context.attack, undefined);
  assert.equal(b.context.CHENGCI_SHORTCUT_EXPORT.selectedShortcutExportRecords('tag', payload)[0].chinese, payload, 'export retains the underlying text');
});

test('favorites, mistake keys and queued prompts keep stable IDs and pick up a rename immediately', () => {
  const b = browser(), original = word('personal-stable', { word: '古い単語' });
  b.setItems([original]); b.context.toggleFavorite(original.id); b.context.recordWordMistake(original);
  assert.deepEqual(clone(b.run('favorites')), [original.id]);
  const other = word('personal-other', { word: 'もう一個' });
  b.setItems([original, other]);
  b.run('compositionQueues.test=[allVocabularyWords()[0]]');
  const renamed = { ...original, word: '新しい単語', meaning: '新しい意味' }; b.setItems([renamed, other]);
  assert.equal(b.context.score(renamed), 6);
  assert.equal(b.context.pickFromQueue('test', b.context.allVocabularyWords(), b.context.wordStudyKey).word, renamed.word);
  b.context.showFavorites(); assert.match(b.element('wordList').innerHTML, /新しい単語/);
  assert.doesNotMatch(b.element('wordList').innerHTML, /古い単語/);
  b.context.toggleFavorite(renamed.id); assert.deepEqual(clone(b.run('favorites')), []);
});

test('remembering the last word invalidates active prompts and empty practice has no stale answers', () => {
  const b = browser(), item = word('personal-only'); b.setItems([item]);
  b.context.startQuiz('word'); b.context.startAudioQuiz('typing'); b.context.startComposition('word');
  b.remembered.add(item.id); b.fire('chengci-user-cards-changed');
  assert.equal(b.run('currentQuiz'), null); assert.equal(b.run('currentAudioQuiz'), null); assert.equal(b.run('currentComposition'), null);
  b.context.startQuiz('word'); b.context.startAudioQuiz('typing'); b.context.startComposition('word');
  for (const id of ['quizArea', 'audioQuizArea', 'compositionArea']) assert.match(b.element(id).innerHTML, /ないよ/);
  assert.equal(b.run('quizRuns'), 3, 'empty launches do not create study events');
});

let sequence = 0;
function syncApp(options = {}) {
  let catalog = [word('personal-one', { word: '初名' })], value = snapshot({}), save;
  const store = options.store || createStore({ env: {}, broadcast: false, uuid: () => String(++sequence), adapter: memoryAdapter() });
  const app = { read: () => value, write: next => { value = next; }, localRender() {}, render() {}, installSave(fn) { save = fn(() => {}); } };
  const sync = createStudySync({ store, app, env: {}, enabled: true, actorId: 'device-test', model: { allItems: [] }, getAllWords: () => catalog });
  return { store, sync, read: () => value, mutate(fn) { fn(value); save(); }, rename(name) { catalog = [{ ...catalog[0], word: name }]; sync.refreshCatalog(); } };
}

test('dynamic study bridge resolves new words and preserves favorites/weak history by ID after rename', async () => {
  const a = syncApp(); await a.sync.ready;
  a.mutate(value => { value.favorites = ['personal-one']; value.weakWords = ['personal-one']; value.mistakeCounts['personal-one'] = 2; });
  await a.sync.retry(); assert.equal(active(a.store.getShared('favorites', 'personal-one')), true);
  a.rename('変更名'); assert.deepEqual(a.read().favorites, ['personal-one']); assert.equal(a.read().mistakeCounts['personal-one'], 2);
  a.mutate(value => { value.mistakeCounts['personal-one']++; value.favorites = []; }); await a.sync.retry();
  assert.equal(total(a.store.getShared('study', 'personal-one')), 3);
  assert.equal(active(a.store.getShared('favorites', 'personal-one')), false);
  assert.equal(a.sync.getState().warning, '');
});

test('epoch adoption archives failed old gesture queues and never replays them into reset learning', async () => {
  const backing = memoryAdapter(); let fail = false;
  const store = createStore({ env: {}, broadcast: false, uuid: () => String(++sequence), adapter: { read: backing.read, transact(fn) { if (fail) throw new Error('quota'); return backing.transact(fn); } } });
  const a = syncApp({ store }); await a.sync.ready; fail = true;
  a.mutate(value => { value.favorites = ['personal-one']; value.quizRuns = 8; }); await assert.rejects(a.sync.retry(), /quota/);
  fail = false;
  await store.adoptVocabulary({ version: 1, epoch: 1, ready: true }, []);
  await a.sync.reconcileVocabularyEpoch(); await a.sync.retry();
  assert.equal(a.read().quizRuns, 0); assert.deepEqual(a.read().favorites, []);
  assert.equal(store.getShared('study', 'study-quiz-runs'), null);
  const archive = store.getVocabularyArchive();
  assert.match(JSON.stringify(archive.studyQueues), /personal-one/);
  assert.match(JSON.stringify(archive.studyQueues), /increment[^]*8/);
  a.mutate(value => { value.quizRuns = 1; }); await a.sync.retry();
  assert.equal(total(store.getShared('study', 'study-quiz-runs')), 1, 'new-epoch activity still saves');
});

test('an in-flight pre-reset gesture is atomically rejected at the store and remains recoverable in its archive', async () => {
  const a = syncApp(); await a.sync.ready;
  const original = a.store.updateShared; let release, arrived;
  const gate = new Promise(resolve => { release = resolve; });
  const called = new Promise(resolve => { arrived = resolve; });
  a.store.updateShared = async (...args) => { arrived(); await gate; return original(...args); };
  a.mutate(value => { value.quizRuns = 7; }); await called;
  await a.store.adoptVocabulary({ version: 1, epoch: 1, ready: true }, []);
  await a.sync.reconcileVocabularyEpoch(); release(); await a.sync.retry();
  assert.equal(a.store.getShared('study', 'study-quiz-runs'), null);
  assert.equal(a.read().quizRuns, 0);
  assert.match(JSON.stringify(a.store.getVocabularyArchive().studyQueues), /increment[^]*7/);
});

test('a rejected epoch write with unavailable refreshed state preserves its queue and stops without retrying in a loop', async () => {
  const a = syncApp(); await a.sync.ready;
  const original = a.store.updateShared; let calls = 0;
  a.store.updateShared = async () => { calls++; const error = new Error('epoch refresh unavailable'); error.code = 'vocabulary_epoch_changed'; throw error; };
  a.mutate(value => { value.quizRuns = 4; });
  await assert.rejects(a.sync.retry(), /refresh unavailable/);
  assert.equal(calls, 1); assert.equal(a.sync.getState().unsavedCount, 1);
  assert.match(a.sync.getState().warning, /refresh unavailable/);
  a.store.updateShared = original; await a.sync.retry();
  assert.equal(total(a.store.getShared('study', 'study-quiz-runs')), 4);
});

test('archive failure keeps pre-reset gestures recoverable and blocks their replay until archival succeeds', async () => {
  const a = syncApp(); await a.sync.ready;
  const originalWrite = a.store.updateShared, originalArchive = a.store.archiveStudyQueue;
  a.store.updateShared = async () => { throw new Error('write unavailable'); };
  a.mutate(value => { value.quizRuns = 5; }); await assert.rejects(a.sync.retry(), /write unavailable/);
  a.store.archiveStudyQueue = async () => { throw new Error('archive unavailable'); };
  await a.store.adoptVocabulary({ version: 1, epoch: 1, ready: true }, []);
  await assert.rejects(a.sync.reconcileVocabularyEpoch(), /archive unavailable/);
  assert.equal(a.sync.getState().unsavedCount, 1);
  assert.equal(a.store.getShared('study', 'study-quiz-runs'), null);
  a.store.archiveStudyQueue = originalArchive; a.store.updateShared = originalWrite;
  await a.sync.retry();
  assert.equal(a.sync.getState().unsavedCount, 0);
  assert.match(JSON.stringify(a.store.getVocabularyArchive().studyQueues), /increment[^]*5/);
  assert.equal(a.store.getShared('study', 'study-quiz-runs'), null);
});

test('word labels equal to another card ID cannot redirect favorite actions or inherit its history', () => {
  const b = browser(), label = word('personal-label', { word: 'personal-target' }), target = word('personal-target', { word: '別単語' });
  b.setItems([label, target]); b.context.toggleFavorite('personal-target'); b.context.recordWordMistake(target);
  assert.equal(b.context.score(target), 6);
  assert.equal(b.context.score(label), 0);
  b.context.toggleFavorite('personal-target'); assert.deepEqual(clone(b.run('favorites')), []);
});

test('editing a bundled example updates existing card and quiz display/audio without mutating the bundle', () => {
  const b = browser(), bundled = clone(b.run('words[0]'));
  const editedExample = `編集した例文'と"引用"を含む。`, edited = { ...bundled, example: editedExample, exampleZhuyin: '編集した注音' };
  b.setItems([edited]);
  const expectedAudio = b.context.speechTextAttr(editedExample);
  const card = b.context.createWordCard(edited);
  assert.ok(card.includes(`speakEncoded('${expectedAudio}')`), 'example audio receives the edited raw example');
  assert.ok(card.includes(b.context.escapeHtml(editedExample)));
  assert.match(card, /type="checkbox" data-personal-remembered=/);
  b.context.startQuiz('word');
  assert.equal(b.run('currentQuiz.example'), editedExample);
  b.context.checkAnswer(edited.meaning);
  assert.ok(b.element('quizResult').innerHTML.includes(b.context.escapeHtml(editedExample)));
  b.context.startAudioQuiz('typing'); b.context.revealAudioQuizResult(true);
  assert.ok(b.element('audioQuizResult').innerHTML.includes(`speakEncoded('${expectedAudio}')`));
  assert.ok(b.element('audioQuizResult').innerHTML.includes(b.context.escapeHtml(editedExample)));
  assert.equal(b.run('words[0].example'), bundled.example);
  b.context.ChengciPersonalCards.managementExtras = item => `<span data-management-id="${item.id}">追加管理</span>`;
  assert.match(b.context.createWordCard(edited), /追加管理/);
});

test('incoming shared changes preserve the management favorite/category/tag view together with its search and remembered filter', async () => {
  const b = browser();
  b.setItems([
    word('personal-a', { word: '探す甲', category: '分類A', tags: ['タグA'] }),
    word('personal-b', { word: '探す乙', category: '分類B', tags: ['タグA'] }),
    word('personal-c', { word: '別甲', category: '分類A', tags: ['タグB'] })
  ]);
  let transform = items => items, viewLabel = '', changes = 0;
  b.element('personalListFilter').value = 'all';
  const provider = b.context.ChengciPersonalCards;
  provider.refreshList = () => {
    let items = transform(provider.allWords());
    const query = b.element('personalListSearch').value;
    if (b.element('personalListFilter').value === 'remembered') items = items.filter(item => provider.isRemembered(item.id));
    items = items.filter(item => item.word.includes(query));
    b.context.renderWordList(items);
  };
  provider.setListView = (next, label) => { transform = next; viewLabel = label; changes++; provider.refreshList(); };
  const store = createStore({ env: {}, broadcast: false, uuid: () => String(++sequence), adapter: memoryAdapter() });
  await store.ready;
  b.context.ChengciCardStore = store;
  b.context.CHENGCI_SYNC_CONFIG = { enabled: true, provider: 'cloudflare' };
  b.context.crypto = require('node:crypto').webcrypto;
  vm.runInContext(fs.readFileSync(path.join(root, 'js/study-sync.js'), 'utf8'), b.context, { filename: 'js/study-sync.js' });
  await b.context.ChengciStudySync.ready;
  const revisions = new Map();
  async function remote(kind, id, data) {
    const key = kind + ':' + id, revision = (revisions.get(key) || 0) + 1; revisions.set(key, revision);
    await store.applyRemote(kind, [{ schemaVersion: 1, id, operationId: 'remote-' + (++sequence), revision, deleted: false, updatedAt: '2026-10-06T00:00:00.000Z', data }]);
  }
  const shown = () => [...b.element('wordList').innerHTML.matchAll(/data-word-id="([^"]+)"/g)].map(match => match[1]);
  for (const id of ['personal-a', 'personal-b', 'personal-c']) await remote('favorites', id, { adds: { remote: 1 }, removes: {} });
  b.element('personalListSearch').value = '探す';
  b.context.showFavorites();
  assert.deepEqual(shown(), ['personal-a', 'personal-b']);
  const favoriteChanges = changes;
  await remote('favorites', 'personal-b', { adds: { remote: 1 }, removes: { remote: 1 } });
  assert.deepEqual(shown(), ['personal-a']); assert.equal(viewLabel, 'お気に入り'); assert.equal(changes, favoriteChanges, 'incoming sync refreshes the existing transform instead of selecting another view');
  assert.equal(b.element('personalListSearch').value, '探す');
  b.context.filterByCategory('分類A');
  await remote('favorites', 'personal-a', { adds: { remote: 1 }, removes: { remote: 1 } });
  assert.deepEqual(shown(), ['personal-a']); assert.equal(viewLabel, '分類：分類A');
  await remote('study', 'personal-a', { adds: { remote: 1 }, removes: {}, counts: { remote: 1 }, cleared: {} });
  b.context.showWeakWords(); assert.deepEqual(shown(), ['personal-a']);
  await remote('study', 'personal-b', { adds: { remote: 1 }, removes: {}, counts: { remote: 5 }, cleared: {} });
  assert.deepEqual(shown(), ['personal-a', 'personal-b']); assert.equal(viewLabel, '苦手單字');
  b.context.showPriorityWords(); assert.deepEqual(shown(), ['personal-b', 'personal-a']);
  b.element('personalListSearch').value = '';
  b.context.filterByTag('タグA'); assert.deepEqual(shown(), ['personal-a', 'personal-b']);
  b.run('tagFilterState.word.add("タグB")');
  await remote('study', 'personal-b', { adds: { remote: 1 }, removes: {}, counts: { remote: 6 }, cleared: {} });
  assert.deepEqual(shown(), [], 'the saved tag transform reads the current selected tag set');
  b.remembered.add('personal-c'); b.element('personalListFilter').value = 'remembered';
  b.context.showAllWords(); assert.deepEqual(shown(), ['personal-c']);
  await remote('favorites', 'personal-c', { adds: { remote: 1 }, removes: { remote: 1 } });
  assert.deepEqual(shown(), ['personal-c']); assert.equal(b.element('personalListFilter').value, 'remembered');
  b.context.refresh(); assert.deepEqual(shown(), ['personal-c']); assert.equal(viewLabel, 'すべて');
});
