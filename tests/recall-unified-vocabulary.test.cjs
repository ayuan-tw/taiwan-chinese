// Node VM DOM coverage, including real store epochs. Not a layout/browser test.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createStore, memoryAdapter, active, PREFERENCE } = require('../js/card-store.js');
const source = fs.readFileSync(path.join(__dirname, '../js/recall-cards.js'), 'utf8');
const LEGACY_KEY = 'chengciRecallV1';
const UNIFIED_KEY = 'chengciRecallV1:epoch:1';
const tick = () => new Promise(resolve => setImmediate(resolve));
const escape = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
let sequence = 0;
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function session(queue, fields = {}) {
  return JSON.stringify({ range:'all', history:{}, queue, signature:'word|all|all', total:queue.length, completed:0, started:!!queue.length, ...fields });
}
async function harness(options = {}) {
  const local = options.local instanceof Map ? options.local : new Map(options.local), elements = new Map(), events = new Map(), audio = [];
  const base = options.base || [
    { id:'word-a', word:'敢', zhuyin:'ㄍㄢˇ', meaning:'あえて', example:'原來的例句。', exampleZhuyin:'原來的注音' },
    { id:'word-b', word:'剛好', zhuyin:'ㄍㄤ ㄏㄠˇ', meaning:'ちょうど', example:'時間剛好。' }
  ];
  const localStorage = { getItem:key => local.get(key) || null, setItem(key, value) { if (options.storageError) throw Error('quota'); local.set(key, value); }, removeItem:key => local.delete(key) };
  const store = createStore({ env:{ localStorage }, ...(options.preferenceTracked ? {deviceAdapter:options.adapter || memoryAdapter()} : {adapter:options.adapter || memoryAdapter()}), broadcast:false, uuid:() => `recall-${++sequence}` });
  await store.ready;
  await options.beforeLoad?.(store);
  function element(id) {
    if (!elements.has(id)) elements.set(id, { id, value:id === 'recallRange' ? 'all' : '', innerHTML:'', textContent:'', disabled:false, checked:false, hidden:false, classList:{toggle(){}}, listeners:{}, focus(){}, scrollIntoView(){}, querySelectorAll(){return [];}, addEventListener(type, fn){this.listeners[type] = fn;} });
    return elements.get(id);
  }
  function emit(type, event = {}) { return Promise.all((events.get(type) || []).map(fn => fn(event))); }
  let loaded = !options.ready;
  const ready = options.ready ? options.ready.then(value => { loaded = value === true; return value; }) : Promise.resolve(true);
  const provider = {
    ready,
    allWords() {
      if (!loaded) return base;
      const records = new Map(store.list({includeDeleted:true}).map(item => [item.id, item]));
      const result = base.map(item => { const record = records.get(item.id); records.delete(item.id); return {...item,...record}; });
      return [...result,...records.values()].filter(item => !item.deleted);
    },
    learningWords() { return this.allWords().filter(item => !this.isRemembered(item.id)); },
    isRemembered(id) { return active(store.getShared('remembered', id)); },
    async setRemembered(id, remembered) { await store.updateShared('device-recall', [{kind:'remembered',id,active:remembered}], {expectedEpoch:store.getState().vocabulary.epoch}); }
  };
  const context = { console, localStorage, words:base, document:{getElementById:element,querySelector:() => ({focus(){}}),addEventListener(type, fn){events.set('document:'+type,[...(events.get('document:'+type) || []),fn]);}},
    ChengciCardStore:store, ChengciPersonalCards:provider, escapeHtml:escape,
    audioButton(text, label) { audio.push({text,label}); return `<button data-audio="${escape(text)}">${label}</button>`; },
    shuffleArray:items => [...items], itemMatchesStudyScope:item => !options.excluded?.includes(item.id), studyScopeSignature:() => 'word|all',
    showTab(){}, CustomEvent:class { constructor(type, options = {}){this.type=type;this.detail=options.detail;} }, dispatchEvent(event){return emit(event.type,event);},
    confirm:() => true, addEventListener(type, fn){events.set(type,[...(events.get(type) || []),fn]);} };
  context.window = context;
  vm.createContext(context);
  if (options.actualProvider) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/personal-cards.js'), 'utf8'), context);
  vm.runInContext(source, context);
  if (!options.actualProvider) store.subscribe(() => emit('chengci-user-cards-changed', {detail:{cardsChanged:true}}));
  const loading = emit('load');
  if (!options.deferLoad) await loading;
  const click = (action, token) => element('recallPanel').listeners.click?.({target:{closest:() => ({dataset:{recallAction:action,recallToken:token}})}});
  return { store, provider:context.ChengciPersonalCards, local, audio, base, loading, emit, e:element, context,
    html:() => element('recallArea').innerHTML,
    start:() => element('recallStart').listeners.click?.(), click,
    reveal:() => click('reveal'), token:() => /data-recall-token="(\d+)"/.exec(element('recallArea').innerHTML)?.[1],
    rate(action) { click(action, /data-recall-token="(\d+)"/.exec(element('recallArea').innerHTML)?.[1]); },
    state:() => JSON.parse(local.get(store.getState().vocabulary.epoch ? UNIFIED_KEY : LEGACY_KEY)),
    range(value) { element('recallRange').value = value; element('recallRange').listeners.change(); }
  };
}
const adopt = store => store.adoptVocabulary({version:1,epoch:1,ready:true}, []);

test('full inventory stays intact while new/resumed recall excludes remembered and scopes learning words', async () => {
  const t = await harness({local:[[LEGACY_KEY,session(['word-a','word-b'])]], beforeLoad:store => store.updateShared('other-device',[{kind:'remembered',id:'word-a',active:true}])});
  assert.deepEqual(t.provider.allWords().map(item => item.id), ['word-a','word-b']);
  assert.deepEqual(t.state().queue, ['word-b']);
  assert.match(t.html(), /剛好/); assert.doesNotMatch(t.html(), /敢/);
  t.reveal(); assert.match(t.html(), /type="checkbox" data-personal-remembered="word-b" data-remembered="true"/);
  t.rate('read'); await tick();
  assert.equal(t.provider.isRemembered('word-b'), false, 'per-round read is not a remembered mutation');
  assert.equal(t.store.getProgress('word-b').result, 'read');
  t.start(); assert.deepEqual(t.state().queue, ['word-b'], 'read can be practiced again in the all range');
  await t.provider.setRemembered('word-a', false);
  t.start(); assert.deepEqual(t.state().queue, ['word-a','word-b'], 'unremembered words return to future rounds');
  const scoped = await harness({excluded:['word-b']}); scoped.start(); assert.deepEqual(scoped.state().queue,['word-a']);
});

test('remote remembered changes prune the current queue and cannot rate the replacement with a stale click', async () => {
  const t = await harness(); t.start(); t.reveal(); const token = t.token();
  await t.store.applyRemote('remembered', [{schemaVersion:1,id:'word-a',revision:1,operationId:'remember-other-device',deleted:false,updatedAt:'2026-10-06T00:00:00Z',data:{adds:{other:1},removes:{}}}]);
  assert.deepEqual(t.state().queue,['word-b']); assert.equal(t.state().completed,0); assert.equal(t.state().total,1);
  assert.doesNotMatch(t.html(), /recall-answer/);
  t.click('read',token); await tick(); assert.equal(t.store.getProgress('word-a'),null); assert.equal(t.store.getProgress('word-b'),null);
  t.reveal(); await t.provider.setRemembered('word-b',true);
  assert.deepEqual(t.state().queue,[]); assert.equal(t.state().completed,0);
  assert.match(t.html(),/練習するカードはありません/); assert.doesNotMatch(t.html(),/この山札は読めた/);
  assert.equal(t.provider.allWords().length,2);
});

test('notyet stays a per-round retry and remembering it retains that history without claiming read', async () => {
  const t = await harness(); t.start(); t.reveal(); t.rate('notyet'); await tick();
  assert.deepEqual(t.state().queue,['word-b','word-a']); assert.equal(t.provider.isRemembered('word-a'),false);
  await t.provider.setRemembered('word-a',true);
  assert.deepEqual(t.state().queue,['word-b']);
  assert.equal(t.state().history['word-a'].result,'notyet'); assert.equal(t.store.getProgress('word-a').result,'notyet');
  assert.equal(t.state().completed,0);
});

test('recalled built-in edits immediately refresh revealed pronunciation/example and exact audio text', async () => {
  const t = await harness(); const bundled = {...t.base[0]}; t.start(); t.reveal(); const token = t.token();
  const example = `改好的例句'和"引用"。<img src=x onerror=bad()>`;
  await t.store.save({...bundled,example,zhuyin:'ㄍㄢˋ',exampleZhuyin:'修正した注音',meaning:'修正した意味'});
  assert.match(t.html(),/recall-answer/); assert.match(t.html(),/ㄍㄢˋ/); assert.match(t.html(),/修正した注音/);
  assert.ok(t.html().includes(escape(example))); assert.doesNotMatch(t.html(),/<img\b/);
  assert.equal(t.audio.at(-1).text,example); assert.equal(t.audio.at(-2).text,'敢');
  assert.deepEqual(t.base[0],bundled,'The built-in dictionary is never mutated');
  t.click('read',token); await tick(); assert.equal(t.store.getProgress('word-a'),null,'Old answer tokens cannot rate edited content');
});

test('readiness preserves stored IDs until checkpoint inventory and remembered state are authoritative', async () => {
  const gate = deferred(), saved = session(['personal-late','word-a','word-b']);
  const t = await harness({ready:gate.promise,deferLoad:true,local:[[LEGACY_KEY,saved]],beforeLoad:async store => {
    await store.save({id:'personal-late',word:'読み込み後の単語'});
    await store.updateShared('other-device',[{kind:'remembered',id:'word-a',active:true}]);
  }});
  t.context.ChengciRecall.refresh(); await t.emit('chengci-user-cards-changed',{detail:{cardsChanged:true}});
  assert.equal(t.local.get(LEGACY_KEY),saved); assert.equal(t.e('recallStart').disabled,true);
  gate.resolve(true); await t.loading;
  assert.deepEqual(t.state().queue,['personal-late','word-b']); assert.match(t.html(),/読み込み後の単語/);
});

test('failed readiness preserves both legacy and unified sessions unchanged', async () => {
  const old = session(['word-a']), current = session(['word-b'],{epoch:1});
  const t = await harness({ready:Promise.resolve(false),local:[[LEGACY_KEY,old],[UNIFIED_KEY,current]],beforeLoad:adopt});
  t.context.ChengciRecall.refresh(); await t.emit('chengci-user-cards-changed');
  assert.equal(t.local.get(LEGACY_KEY),old); assert.equal(t.local.get(UNIFIED_KEY),current);
  assert.match(t.html(),/再開できません/); assert.equal(t.e('recallStart').disabled,true);
});

test('epoch adoption retires local recall history and queue while leaving the legacy archive recoverable', async () => {
  const history = {'word-a':{result:'read',attempts:4,updatedAt:'2026-10-06T00:00:00Z'}};
  const saved = session(['word-b'],{history,completed:1,total:2});
  const t = await harness({local:[[LEGACY_KEY,saved]],beforeLoad:store => store.saveProgress('word-a',history['word-a'])});
  t.reveal(); const token = t.token(); await adopt(t.store);
  assert.match(t.html(),/思い出そう/); assert.match(t.e('recallSummary').textContent,/読めた：0語/);
  assert.equal(t.local.get(LEGACY_KEY),saved);
  assert.equal(t.store.getVocabularyArchive().beforeAdoption.localStorage[LEGACY_KEY],saved);
  t.click('read',token); await tick(); assert.equal(t.store.getProgress('word-b'),null);
  t.start(); assert.equal(t.state().epoch,1); assert.deepEqual(t.state().history,{}); assert.deepEqual(t.state().queue,['word-a','word-b']);
  const unified = t.local.get(UNIFIED_KEY);
  // An old, still-open client can update its old key without reviving history.
  const resumed = await harness({local:[[LEGACY_KEY,session(['word-a'],{history})],[UNIFIED_KEY,unified]],beforeLoad:adopt});
  assert.deepEqual(resumed.state().history,{}); assert.match(resumed.html(),/敢/); assert.match(resumed.e('recallSummary').textContent,/読めた：0語/);
});

test('initializing directly in epoch 1 never resumes or imports a legacy round', async () => {
  const saved = session(['word-b'],{history:{'word-a':{result:'read',attempts:9}},completed:1,total:2});
  const t = await harness({local:[[LEGACY_KEY,saved]],beforeLoad:adopt});
  assert.match(t.html(),/思い出そう/); assert.equal(t.local.get(LEGACY_KEY),saved);
  t.range('pending'); t.start(); assert.deepEqual(t.state().queue,['word-a','word-b']); assert.deepEqual(t.state().history,{});
});

test('an in-flight old rating is epoch-fenced and its completion cannot overwrite a new pending rating', async () => {
  const t = await harness({base:[{id:'word-a',word:'敢'}]});
  const oldGate = deferred(), oldEntered = deferred(), newGate = deferred(), newEntered = deferred();
  const save = t.store.saveProgress.bind(t.store), calls = [];
  t.store.saveProgress = async (...args) => {
    calls.push(args); const old = args[2].expectedEpoch === 0;
    (old ? oldEntered : newEntered).resolve(); await (old ? oldGate : newGate).promise;
    return save(...args);
  };
  t.start(); t.reveal(); t.rate('notyet'); await oldEntered.promise;
  await adopt(t.store); t.start(); t.reveal(); t.rate('notyet'); await newEntered.promise;
  assert.deepEqual(calls.map(args => args[2].expectedEpoch),[0,1]);
  oldGate.resolve(); await tick();
  assert.equal(t.store.getProgress('word-a'),null); assert.equal(t.state().history['word-a'].attempts,1);
  assert.doesNotMatch(t.e('recallStorageStatus').textContent,/移行状態が更新/);
  newGate.resolve(); await tick();
  assert.equal(t.store.getProgress('word-a').attempts,1); assert.equal(t.store.getProgress('word-a').result,'notyet');
  assert.deepEqual(t.state().queue,['word-a']);
});

test('a missing UI notification still prevents rating a remembered card or an old epoch', async () => {
  const t = await harness(); t.start(); t.reveal(); const token = t.token();
  const was = t.provider.isRemembered.bind(t.provider); t.provider.isRemembered = id => id === 'word-a' || was(id);
  t.click('read',token); await tick();
  assert.deepEqual(t.state().queue,['word-b']); assert.equal(t.store.getProgress('word-a'),null);
  t.reveal(); const nextToken = t.token();
  const getState = t.store.getState.bind(t.store); t.store.getState = () => ({...getState(),vocabulary:{epoch:1}});
  t.click('read',nextToken); await tick(); assert.equal(t.store.getProgress('word-b'),null); assert.match(t.html(),/思い出そう/);
});


test('the actual provider handles the revealed remembered checkbox, prunes recall, and keeps the word editable', async () => {
  const t = await harness({actualProvider:true});
  assert.equal(await t.provider.ready,true);
  t.start(); t.reveal();
  const id = t.html().match(/data-personal-remembered="([^"]+)"/)[1];
  const checkbox = {disabled:false,dataset:{personalRemembered:id,remembered:'true'}};
  await t.emit('document:click',{target:{closest:selector => selector === '[data-personal-remembered]' ? checkbox : null}});
  assert.equal(checkbox.disabled,false); assert.equal(t.provider.isRemembered('word-a'),true);
  assert.deepEqual(t.state().queue,['word-b']); assert.equal(t.store.getProgress('word-a'),null);
  assert.equal(t.provider.get('word-a').word,'敢');
  assert.match(t.e('personalCardList').innerHTML,/敢/);
  await t.emit('document:click',{target:{closest:selector => selector === '[data-personal-edit]' ? {dataset:{personalEdit:id}} : null}});
  assert.equal(t.e('personalWord').value,'敢');
  checkbox.dataset.remembered='false';
  await t.emit('document:click',{target:{closest:selector => selector === '[data-personal-remembered]' ? checkbox : null}});
  t.start(); assert.deepEqual(t.state().queue,['word-a','word-b']);
});


for (const epoch of [0,1]) test(`cross-tab device opt-out prevents stale-tab recall writes in epoch ${epoch} without a broadcast`, async () => {
  for (const saved of [undefined,session(['word-a','word-b'],{epoch})]) {
    const key = epoch ? UNIFIED_KEY : LEGACY_KEY;
    const local = new Map([[PREFERENCE,'device'],...(saved ? [[key,saved]] : [])]);
    const disk = memoryAdapter();
    const first = await harness({local,adapter:disk,preferenceTracked:true,beforeLoad:epoch ? adopt : undefined});
    const stale = await harness({local,adapter:disk,preferenceTracked:true});
    assert.equal(stale.store.getState().persistence,'device');
    await first.store.setPersistence(false);
    assert.equal(local.has(PREFERENCE),false);
    assert.equal(stale.store.getState().persistence,'device','No broadcast or store reload has updated the second tab');
    const afterOptOut = local.get(key);
    stale.start();
    assert.equal(local.get(key),afterOptOut,'Starting recall cannot create or rewrite a durable session after opt-out');
    stale.reveal(); stale.rate('notyet');
    assert.equal(local.get(key),afterOptOut,'The synchronous rating path also checks the live preference');
    await tick();
    stale.range('pending');
    assert.equal(local.get(key),afterOptOut);
    assert.equal(stale.store.getState().persistence,'memory');
    const persisted = await disk.read();
    assert.deepEqual(persisted.progress,{},'The store also keeps the rating off disk');
    assert.equal(persisted.persistenceDisabled,true);
  }
});


test('memory-only initialization does not restore private epoch-1 session contents or history', async () => {
  const saved = session(['word-b'],{epoch:1,history:{'word-a':{result:'read',attempts:99}},completed:1,total:2});
  const t = await harness({local:[[UNIFIED_KEY,saved]],preferenceTracked:true,beforeLoad:adopt});
  assert.equal(t.store.getState().persistence,'memory');
  assert.match(t.html(),/思い出そう/); assert.match(t.e('recallSummary').textContent,/読めた：0語/);
  assert.doesNotMatch(t.html(),/読めた 1/);
  t.start(); assert.match(t.html(),/読めた 0 \/ 2語/); assert.match(t.html(),/敢/);
  assert.equal(t.local.get(UNIFIED_KEY),saved,'A passive read never rewrites or exposes the recoverable session');
});
