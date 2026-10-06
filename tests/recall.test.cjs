const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness(saved, options = {}) {
  const elements = new Map();
  const events = new Map();
  const storage = new Map(saved ? [['chengciRecallV1', saved]] : []);
  const sample = [
    { id: 'word-a', word: '敢', zhuyin: 'ㄍㄢˇ', meaning: 'あえて〜する', example: '妳還真敢說耶～' },
    { id: 'word-b', word: '剛好', zhuyin: 'ㄍㄤ ㄏㄠˇ', meaning: 'ちょうど', example: '時間剛好。' },
    { id: 'word-c', word: '<img src=x onerror="bad()">', zhuyin: 'ㄊㄚ', meaning: '<script>bad()</script>', example: '& " < >' }
  ];
  function element(id) {
    if (!elements.has(id)) elements.set(id, { value: id === 'recallRange' ? 'all' : '', innerHTML: '', textContent: '', focus(){}, listeners: {}, addEventListener(type, callback) { this.listeners[type] = callback; } });
    return elements.get(id);
  }
  const context = {
    localStorage: { getItem: key => storage.get(key) || null, setItem(key, value) { if(options.storageError) throw Error('quota'); storage.set(key, value); } },
    document: { getElementById: element, querySelector: () => ({focus(){}}) },
    words: sample,
    scopedStudyItems: () => sample.filter(item => !options.empty),
    studyScopeSignature: () => options.scope || 'word|all',
    shuffleArray: array => [...array],
    audioButton: () => '',
    escapeHtml: value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c])),
    console,
    window: { confirm: () => options.confirm !== false, addEventListener(type, callback){ events.set(type, callback); } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/recall-cards.js'), 'utf8'), context);
  events.get('load')();
  const click = (action, token) => element('recallPanel').listeners.click({target:{closest:()=>({dataset:{recallAction:action,recallToken:token}})}});
  return {
    elements, options, sample, storage, events,
    start: () => element('recallStart').listeners.click(),
    click,
    reveal: () => click('reveal'),
    rate: action => click(action, /data-recall-token="(\d+)"/.exec(element('recallArea').innerHTML)?.[1]),
    range(value) {element('recallRange').value=value;element('recallRange').listeners.change();},
    html: () => element('recallArea').innerHTML,
    state: () => JSON.parse(storage.get('chengciRecallV1'))
  };
}

let t = harness();
t.start();
assert.match(t.html(), /敢/);
assert.doesNotMatch(t.html(), /ㄍㄢ|あえて|妳還/);
t.rate('read');
assert.equal(t.state().queue.length, 3, 'cannot rate before reveal');
t.reveal();
assert.match(t.html(), /ㄍㄢˇ/);
assert.match(t.html(), /声調：3/);
assert.match(t.html(), /妳還真敢說耶/);
const staleToken = /data-recall-token="(\d+)"/.exec(t.html())[1];
t.rate('notyet');
assert.deepEqual(t.state().queue, ['word-b','word-c','word-a']);
t.click('notyet', staleToken);
assert.equal(t.state().history['word-a'].attempts, 1, 'double click only rates once');
t.reveal();t.rate('read');
assert.match(t.html(), /&lt;img/);
assert.doesNotMatch(t.html(), /<img/);
t.reveal();
assert.doesNotMatch(t.html(), /<script>/);
t.rate('read');t.reveal();t.rate('read');
assert.deepEqual(t.state().queue, []);
assert.equal(t.state().completed, 3);
assert.match(t.html(), /この山札は読めた/);
t.range('pending');t.start();assert.match(t.html(), /カードはありません/);

t = harness();t.start();t.reveal();t.rate('notyet');
let resumed = harness(t.storage.get('chengciRecallV1'));
assert.match(resumed.html(), /剛好/);
assert.doesNotMatch(resumed.html(), /ㄍㄤ|ちょうど/);
resumed.range('pending');resumed.start();
assert.equal(resumed.state().queue[0], 'word-a', 'not yet gets priority');
resumed = harness(resumed.storage.get('chengciRecallV1'));
assert.equal(resumed.elements.get('recallRange').value, 'pending');

t = harness();t.range('pending');assert.equal(harness(t.storage.get('chengciRecallV1')).elements.get('recallRange').value, 'pending');
t.start();t.range('all');assert.equal(harness(t.storage.get('chengciRecallV1')).elements.get('recallRange').value, 'all');
t = harness('{not-json');t.start();assert.equal(t.state().queue.length, 3);
t = harness(null, {empty:true});t.start();assert.match(t.html(), /カードはありません/);
t = harness(null, {storageError:true});t.start();t.reveal();t.rate('read');
assert.match(t.elements.get('recallStorageStatus').textContent, /保存できません/);
assert.match(t.html(), /剛好/);
t = harness();t.start();t.reveal();t.rate('read');t.options.confirm=false;t.start();assert.equal(t.state().queue[0],'word-b');
t.options.scope='different';t.events.get('chengci-user-cards-changed')();assert.match(t.html(), /思い出そう/);
console.log('Recall tests passed: answer hiding, tones, retry queue, stale clicks, escaping, completion, pending filter, resume, malformed storage, quota failure, restart cancel, scope change.');
