// Baseline fingerprints were generated from the exact upstream Ver.6.9.4 source snapshot.
// They remain usable in a release ZIP or shallow checkout without Git history.
// The pattern fingerprint below includes the separately approved 11-card metadata review;
// complement-organization.test.cjs independently verifies that only those tags/notes changed.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/baseline-v6.9.4.json'), 'utf8'));
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const source = fs.readFileSync(path.join(root, 'data/words.js'), 'utf8');
const current = JSON.parse(vm.runInNewContext(source + '; JSON.stringify({words, patterns, phrases, idioms, compositionPrompts})'));

for (const [name, original] of Object.entries(baseline.collections)) {
  assert.ok(current[name].length >= original.count, `${name}: an original item was removed`);
  assert.equal(sha256(JSON.stringify(canonical(current[name].slice(0, original.count)))), name === 'patterns' ? '2683acc43043601bc331c89c5fcd4b05fc5b8f727023e6dc6bdf8dda208621b1' : original.sha256,
    `${name}: an original item changed or moved from baseline ${baseline.baselineCommit}`);
}
for (const [file, expected] of Object.entries(baseline.files)) {
  assert.equal(sha256(fs.readFileSync(path.join(root, file))), expected, `${file}: dictionary bytes changed`);
}

const expectedAdditions = {
  words: ['word', ['很愛到處插一腳', '敢', '弄東弄西']],
  patterns: ['pattern', ['沒那麼～', '只好＋V', '記牢／記得很牢']],
  phrases: ['text', ['才沒有！今天只是剛好啦。']]
};
for (const [name, [key, expected]] of Object.entries(expectedAdditions)) {
  const added = current[name].slice(baseline.collections[name].count);
  assert.deepEqual(added.map(item => item[key]), expected, `${name}: the approved additions changed`);
  for (const item of added) {
    assert.ok(item.zhuyin && item.meaning && item.note, `${item[key]}: learning content is incomplete`);
    assert.equal(current[name].filter(other => other[key] === item[key]).length, 1, `${item[key]}: duplicate card`);
  }
}
assert.equal(current.idioms.length, baseline.collections.idioms.count, 'No idiom additions were requested');
assert.equal(current.compositionPrompts.length, baseline.collections.compositionPrompts.count + 6);
assert.equal(current.words.find(item => item.word === '敢').example, '妳還真敢說耶～');
assert.equal(current.words.find(item => item.word === '很愛到處插一腳').example, '就真的很愛到處插一腳。');
assert.equal(current.words.find(item => item.word === '弄東弄西').example, '我一到週末就會一直弄東弄西。');
assert.equal(current.patterns.find(item => item.pattern === '沒那麼～').example, '其實沒那麼難。');
assert.equal(current.patterns.find(item => item.pattern === '只好＋V').example, '不行的話，我只好一直用了。');
console.log(`Data preservation passed against ${baseline.baselineCommit.slice(0, 12)}: 149 words, 11 phrases, 33 idioms and 244 prompts unchanged; 97 original patterns preserved with approved complement metadata; six prior additions and one complement comparison present; dictionary SHA-256 unchanged.`);
