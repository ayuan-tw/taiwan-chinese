const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Pure rendering regression: no browser or network. Exercises the actual
// composition functions and inspects the HTML sink; it does not execute HTML.
const source = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const functions = source.slice(source.indexOf('function showCompositionAnswer(){'), source.indexOf('function markCompositionCorrect(){'));

test('pasted composition answer is text, not executable HTML, in reveal and grading', () => {
  const result = { innerHTML: '' };
  const payload = '<img src=x onerror="window.reviewPayloadExecuted=true">';
  const context = { currentComposition: { answer: '普通答案', zhuyin: '', source: '普通' },
    getCompositionInput: () => payload, document: { getElementById: () => result },
    audioButton: () => '', shouldAutoSpeak: () => false, speakText() {},
    normalizeCompositionText: text => text,
    escapeHtml: text => String(text || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) };
  vm.createContext(context);
  vm.runInContext(functions, context);
  context.showCompositionAnswer();
  assert.doesNotMatch(result.innerHTML, /<img\s/i, 'reveal must escape the pasted answer before innerHTML');
  context.checkCompositionAnswer();
  assert.doesNotMatch(result.innerHTML, /<img\s/i, 'grading must escape the pasted answer before innerHTML');
});
