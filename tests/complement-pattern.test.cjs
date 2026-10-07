'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'data/words.js'), 'utf8');
const items = JSON.parse(vm.runInNewContext(source + ';JSON.stringify({words,patterns,phrases,idioms,compositionPrompts})'));
const key = '記牢／記得很牢';
const card = items.patterns.find(item => item.pattern === key);
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('one complement comparison uses the existing pattern-card fields and tags', () => {
  assert.equal(items.patterns.filter(item => item.pattern === key).length, 1);
  assert.equal(card.category, '補語');
  assert.deepEqual(card.tags, ['補語', '牢', '学習']);
  for (const field of ['pattern', 'zhuyin', 'meaning', 'note', 'example', 'exampleZhuyin']) {
    assert.equal(typeof card[field], 'string');
    assert.ok(card[field].length > 0);
    assert.doesNotMatch(card[field], /<[^>]*>/, 'Content does not need embedded markup or a new renderer');
  }
  assert.match(card.note, /記＋牢.*結果/);
  assert.match(card.note, /記＋得＋很牢.*確かさ/);
  assert.match(card.note, /時制の区別ではない/);
  assert.match(card.note, /組み合わせは表現ごと/);
});

test('the same-verb comparison has complete Traditional Chinese, Japanese and Taiwan zhuyin', () => {
  assert.equal(card.zhuyin, 'ㄐㄧˋ ㄌㄠˊ／ㄐㄧˋ ˙ㄉㄜ ㄏㄣˇ ㄌㄠˊ');
  assert.deepEqual(card.prompts, [
    { ja:'この一言はしっかり覚えた（記＋牢で）', answer:'這句話，我記牢了。', zhuyin:'ㄓㄜˋ ㄐㄩˋ ㄏㄨㄚˋ，ㄨㄛˇ ㄐㄧˋ ㄌㄠˊ ˙ㄌㄜ' },
    { ja:'この一言はしっかり覚えている（記＋得＋很牢で）', answer:'這句話，我記得很牢。', zhuyin:'ㄓㄜˋ ㄐㄩˋ ㄏㄨㄚˋ，ㄨㄛˇ ㄐㄧˋ ˙ㄉㄜ ㄏㄣˇ ㄌㄠˊ' }
  ]);
  assert.equal(card.example, card.prompts[0].answer);
  assert.equal(card.exampleZhuyin, card.prompts[0].zhuyin);
  assert.match(card.note, /抓牢（ㄓㄨㄚ ㄌㄠˊ）＝しっかりつかむ/);
});

test('the comparison enters the existing composition pool exactly twice', () => {
  const prompts = items.compositionPrompts.filter(item => item.source === key);
  assert.equal(prompts.length, 2);
  assert.deepEqual(prompts.map(({ type, source, category, ...prompt }) => {
    assert.equal(type, 'pattern');
    assert.equal(source, key);
    assert.equal(category, '補語');
    return prompt;
  }), card.prompts);
});

test('all pre-prototype learning content is unchanged and the dictionary is byte-identical', () => {
  const previous = { ...items,
    patterns: items.patterns.filter(item => item.pattern !== key),
    compositionPrompts: items.compositionPrompts.filter(item => item.source !== key)
  };
  const expected = {
    words: [152, 'e08197177aecc8305589cd5fbb1ca967e6c83c0b6131fca6dbad6c0e058249b5'],
    patterns: [99, '3ba6336172c5c631a8a58ff7202747930184a6733b7f1b5db584e6484139a8b4'],
    phrases: [12, '3479637259f8deca5c2bdfb411c3029212cbb4cb01f17ca1f9ea9555298574a6'],
    idioms: [33, '667bb2739341c476bfb9d212055250bc78272cd3cea6a2aff6aac000f3eb630b'],
    compositionPrompts: [248, '96deb8f54279cede0b895b6cd3d1ed6b96f50181f64f0b15e4933834aebd5368']
  };
  for (const [name, [count, fingerprint]] of Object.entries(expected)) {
    assert.equal(previous[name].length, count, name);
    assert.equal(hash(previous[name]), fingerprint, name + ' content must not change');
  }
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'data/zhuyin-dict.js'))).digest('hex'),
    '3bb394ca800b9aca6641162d8c7a1b19cbad8e760e392debd8d1ff64f323b453');
});

test('existing model gives the card a stable ID and a complement grammar filter', () => {
  const context = { window: { dispatchEvent() {} }, CustomEvent: class {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/data-model.js'), 'utf8'), context);
  const model = context.window.CHENGCI_DATA_MODEL;
  const normalized = model.filterByType('pattern').find(item => item.pattern === key);
  assert.match(normalized.id, /^pattern-/);
  assert.equal(model.getById(normalized.id), normalized);
  assert.equal(model.filterByTag('補語').filter(item => item.pattern === key).length, 1);
  assert.equal(model.getTagGroup('補語'), 'grammar');
});

test('existing card renderer shows both practice examples and the comparison explanation', () => {
  const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const renderSource = app.slice(app.indexOf('function createPatternCard(item){'), app.indexOf('\nfunction renderPatternList('));
  assert.ok(renderSource.startsWith('function createPatternCard(item){'));
  const context = { card, weakCards: [], patternMistakeCounts: {},
    getPatternTags: item => item.tags, patternScore: () => 0,
    escapeWordText: value => value, escapeHtml: value => value,
    audioButton: () => '<button>音声</button>' };
  const html = vm.runInNewContext(renderSource + ';createPatternCard(card)', context);
  assert.match(html, /記牢／記得很牢/);
  for (const prompt of card.prompts) {
    assert.ok(html.includes(prompt.ja));
    assert.ok(html.includes(prompt.answer));
    assert.ok(html.includes(prompt.zhuyin));
  }
  assert.ok(html.includes(card.note));
  assert.match(html, /#補語/);
  assert.doesNotMatch(html, /undefined/);
});
