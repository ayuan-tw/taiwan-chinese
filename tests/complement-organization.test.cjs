'use strict';
// Approved scope: add the umbrella tag to 11 existing cards and append 8 short notes.
// Frozen pre-change data is from deployed commit 30bf9523a13aed4dd85a42d65e5c1c139f30b9fd.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'data/words.js'), 'utf8');
const items = JSON.parse(vm.runInNewContext(source + ';JSON.stringify({words,patterns,phrases,idioms,compositionPrompts})'));
const metadata = {
  "approved": [
    {
      "pattern": "V 完了",
      "originalNote": "言い換え集から。日常動作に便利。",
      "originalTags": [
        "日常"
      ],
      "addition": "補語の完は「し終える」という結果を補う。了とは役割が別。"
    },
    {
      "pattern": "把 A 換成 B",
      "originalNote": "把で対象Aを前に出し、換成で変更後のBを示す。注文変更にも便利。",
      "originalTags": [
        "型",
        "把構文",
        "変更"
      ],
      "addition": ""
    },
    {
      "pattern": "V＋成＋結果",
      "originalNote": "聽成・看成・寫成・說成など。成の後ろに、実際になった結果や取り違えた内容を置く。",
      "originalTags": [
        "結果",
        "作文",
        "学習"
      ],
      "addition": ""
    },
    {
      "pattern": "V 得到／V 不到",
      "originalNote": "買得到＝買える、聽得到＝聞こえる。",
      "originalTags": [
        "旅行",
        "会話"
      ],
      "addition": "V＋得＋到／V＋不＋到で、到が表す結果まで実現できるかを言う。"
    },
    {
      "pattern": "想不起來",
      "originalNote": "記憶にあるはずなのに出てこない。",
      "originalTags": [
        "何度も質問した"
      ],
      "addition": "想＋不＋起來。思い出すという結果を実現できない形。"
    },
    {
      "pattern": "想不出來",
      "originalNote": "言い方・答え・案が出てこない時。",
      "originalTags": [
        "何度も質問した"
      ],
      "addition": "想＋不＋出來。考えても言葉や案を出せない形。"
    },
    {
      "pattern": "看起來～",
      "originalNote": "食べ物・体調・雰囲気に便利。",
      "originalTags": [
        "旅行",
        "感想"
      ],
      "addition": "起來には、見た印象や判断を述べる補語の派生用法もある。"
    },
    {
      "pattern": "看起來像～",
      "originalNote": "看起來很好吃より少し具体的。",
      "originalTags": [
        "感想"
      ],
      "addition": "看＋起來で見た印象を述べ、その後の像で「何に似ているか」を言う。"
    },
    {
      "pattern": "聽起來～",
      "originalNote": "説明を聞いた感想に使う。",
      "originalTags": [
        "感想"
      ],
      "addition": "起來には、聞いた印象や判断を述べる補語の派生用法もある。"
    },
    {
      "pattern": "動詞＋得＋程度",
      "originalNote": "得の後ろに程度や状態を置く。目的語がある場合は語順に注意。",
      "originalTags": [
        "型",
        "程度補語"
      ],
      "addition": ""
    },
    {
      "pattern": "V＋個不停",
      "originalNote": "同じ動作がずっと続いて止まらない様子。話す・笑う・泣くなどによく使う。",
      "originalTags": [
        "継続",
        "会話",
        "台湾人よく使う"
      ],
      "addition": "個が動詞と補語をつなぎ、不停が動作の続く様子を補う。"
    }
  ],
  "snapshots": {
    "words": {
      "count": 152,
      "sha256": "e08197177aecc8305589cd5fbb1ca967e6c83c0b6131fca6dbad6c0e058249b5"
    },
    "patterns": {
      "count": 100,
      "sha256": "5f706774a8b53ac424e99d493a0eb89d5cad40aa2531e614103a79ad6f5e268f"
    },
    "phrases": {
      "count": 12,
      "sha256": "3479637259f8deca5c2bdfb411c3029212cbb4cb01f17ca1f9ea9555298574a6"
    },
    "idioms": {
      "count": 33,
      "sha256": "667bb2739341c476bfb9d212055250bc78272cd3cea6a2aff6aac000f3eb630b"
    },
    "compositionPrompts": {
      "count": 250,
      "sha256": "9134d4ebd70dbe2ca26547cd2f9d9254fb9d8cb48d9aedf8416c728a1f674eb3"
    }
  },
  "idsSha256": "8cf991af0c043dd42f5db92159f0d2c4bee4d2c8deb53f2b9507c661a77e0eb8",
  "canonicalFirst97": "2683acc43043601bc331c89c5fcd4b05fc5b8f727023e6dc6bdf8dda208621b1",
  "rawFirst99": "9b3f4378da0b88a229b6371cb45cbb1b0b3de7b8255b5def491c5fed1f88e79c"
};
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('only the approved 11 cards gain a tag; only the approved 8 notes gain an explanation', () => {
  assert.equal(metadata.approved.length, 11);
  assert.equal(metadata.approved.filter(item => item.addition).length, 8);
  const restored = JSON.parse(JSON.stringify(items.patterns));
  for (const review of metadata.approved) {
    const matches = restored.filter(item => item.pattern === review.pattern);
    assert.equal(matches.length, 1, review.pattern + ' stays unique');
    const item = matches[0];
    assert.deepEqual(item.tags, [...review.originalTags, '補語'], review.pattern + ' retains all existing tags in order');
    assert.equal(item.note, review.originalNote + (review.addition ? ' ' + review.addition : ''), review.pattern);
    item.note = review.originalNote;
    item.tags = review.originalTags;
  }
  assert.equal(restored.length, 100, 'No cards are added or removed');
  assert.equal(hash(restored), metadata.snapshots.patterns.sha256,
    'Undoing only the approved tags/notes must recover all 100 exact pre-change cards, including the unchanged 牢 card');
});

test('all non-pattern collections, composition prompts and the generated dictionary remain unchanged', () => {
  for (const [name, snapshot] of Object.entries(metadata.snapshots)) {
    if (name === 'patterns') continue;
    assert.equal(items[name].length, snapshot.count, name);
    assert.equal(hash(items[name]), snapshot.sha256, name);
  }
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'data/zhuyin-dict.js'))).digest('hex'),
    '3bb394ca800b9aca6641162d8c7a1b19cbad8e760e392debd8d1ff64f323b453');
});

function model() {
  const context = { window: { dispatchEvent() {} }, CustomEvent: class {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/data-model.js'), 'utf8'), context);
  return context.window.CHENGCI_DATA_MODEL;
}

test('all 100 pattern names and stable IDs remain exactly the same', () => {
  const identities = model().filterByType('pattern').map(item => [item.pattern, item.id]);
  assert.equal(identities.length, 100);
  assert.equal(hash(identities), metadata.idsSha256);
});

test('the existing complement filter contains exactly the 11 reviewed patterns and the 牢 card', () => {
  const data = model();
  const actual = Array.from(data.filterByTag('補語').filter(item => item.type === 'pattern'), item => item.pattern).sort();
  const expected = [...metadata.approved.map(item => item.pattern), '記牢／記得很牢'].sort();
  assert.deepEqual(actual, expected);
  assert.equal(actual.length, 12);
  assert.equal(data.getTagGroup('補語'), 'grammar');
  assert.ok(data.filterByType('pattern').find(item => item.pattern === '動詞＋得＋程度').tags.includes('程度補語'),
    'The existing subtype remains available');
});

test('incidental examples and lexical 得 do not broaden the complement filter', () => {
  for (const key of ['我覺得～', '記得要～', '懶得＋V', '害我＋（結果）', 'V著V著，就～', '沒想到～', '說到～', '等一下再～', '可以～多一點嗎？']) {
    const card = items.patterns.find(item => item.pattern === key);
    assert.ok(card, key);
    assert.ok(!card.tags.includes('補語'), key + ' is outside this review scope');
  }
});

test('the existing renderer displays each reviewed note and tag without new UI or fields', () => {
  const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const renderer = app.slice(app.indexOf('function createPatternCard(item){'), app.indexOf('\nfunction renderPatternList('));
  assert.ok(renderer.startsWith('function createPatternCard(item){'));
  for (const review of metadata.approved) {
    const card = items.patterns.find(item => item.pattern === review.pattern);
    const context = { card, weakCards: [], patternMistakeCounts: {},
      getPatternTags: item => item.tags, patternScore: () => 0,
      escapeWordText: value => value, escapeHtml: value => value, audioButton: () => '' };
    const html = vm.runInNewContext(renderer + ';createPatternCard(card)', context);
    assert.ok(html.includes(card.note));
    assert.ok(html.includes(card.example));
    assert.match(html, /#補語/);
    assert.doesNotMatch(html, /undefined/);
  }
});
