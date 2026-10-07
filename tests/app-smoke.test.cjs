// Dependency-free integration smoke test. This checks script wiring, not browser layout.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const elements = new Map();
const events = new Map();
const storage = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    id, innerHTML: '', textContent: '', value: '', checked: false, hidden: false,
    style: {}, dataset: {}, firstChild: {textContent: ""}, classList: {add(){},remove(){},toggle(){}},
    addEventListener(){}, setAttribute(){}, removeAttribute(){},
    querySelector(){return null;}, querySelectorAll(){return [];},
    scrollIntoView(){}, focus(){}, appendChild(){}, remove(){}
  });
  return elements.get(id);
}
for (const match of html.matchAll(/\bid="([^"]+)"/g)) element(match[1]);
element('recallRange').value = 'all';
element('speechRate').value = '0.9';
element('shortcutExportScope').value = 'tag';
element('personalListFilter').value = 'all';
const document = {
  getElementById(id){return elements.get(id) || null;},
  querySelectorAll(){return [];}, querySelector(){return null;},
  createElement: tag => element('created-' + tag), body: element('body'),
  addEventListener(type, callback){events.set('document:'+type,[...(events.get('document:'+type)||[]),callback]);}
};
const context = {
  document, console, crypto:require('node:crypto').webcrypto, navigator: {onLine:true,language:'ja-JP',userAgent:'SmokeTest'},
  location: {hostname:'localhost',href:'http://localhost/',reload(){}},
  localStorage: {getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  addEventListener(type, callback){events.set(type,[...(events.get(type)||[]),callback]);},
  dispatchEvent(event){for(const callback of events.get(event.type)||[])callback(event);},
  CustomEvent: class {constructor(type, options={}){this.type=type;this.detail=options.detail;}},
  setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},
  scrollTo(){},alert(){},confirm(){return true;},
  fetch: async () => ({ok:true,json:async()=>({version:'6.11.0',notes:[]}),text:async()=>''}),
  URL, Blob, Date, Promise, isSecureContext: false
};
context.window = context;
vm.createContext(context);
for(const match of html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)){
  const source = fs.readFileSync(path.join(root, match[1]), 'utf8');
  vm.runInContext(source, context, {filename:match[1]});
}
await context.onload?.();
for(const callback of events.get('load') || []) await callback();
assert.equal(element('totalCount').textContent, 152);
assert.match(element('wordList').innerHTML, /敢/);
assert.match(element('patternList').innerHTML, /只好/);
assert.match(element('phraseList').innerHTML, /才沒有/);
assert.ok(context.CHENGCI_DATA_MODEL.allItems.length >= 296);
assert.ok(element('recallArea').innerHTML.length);
assert.equal(element('personalSave').disabled,false);
assert.match(element('personalSyncStatus').textContent,/設定の準備中/);
const sw = fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
for(const match of html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)){
  assert.ok(sw.includes("'./"+match[1]+"'"), `Offline cache must contain ${match[1]}`);
}
console.log('App smoke tests passed: all index scripts and load handlers execute; existing lists and new cards render; scripts are precached.');

})().catch(error=>{console.error(error);process.exitCode=1;});
