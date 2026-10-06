const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

test('actual HTML exposes one searchable word-management list with all words as the default',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(ids.length,new Set(ids).size,'DOM IDs must remain unique');
  assert.ok(!ids.includes('personalCardList'),'the home editor must not contain a second live management list');
  const panel=html.slice(html.indexOf('id="wordListPanel"'),html.indexOf('id="tab-pronunciation"'));
  for(const id of ['wordList','personalListFilter','personalListSearch','personalListCount'])assert.ok(panel.includes(`id="${id}"`),id);
  assert.match(panel,/id="personalListFilter"><option value="all">/);
  for(const filter of ['remembered','unremembered','deleted'])assert.ok(panel.includes(`value="${filter}"`));
  assert.match(panel,/チェックしても一覧には残り/);
  for(const id of ['personalCategory','personalTags','personalConfuse','vocabularySetupPanel','vocabularyBootstrap','vocabularyStatus','vocabularyArchiveExport'])assert.ok(ids.includes(id),id);
});

function converter(){
  const source=fs.readFileSync(path.join(root,'js/zhuyin-lite.js'),'utf8');
  let vocabulary=null;
  const context={words:[{word:'測試',zhuyin:'ㄘㄜˋ ㄕˋ',example:'測試今天',exampleZhuyin:'ㄘㄜˋ ㄕˋ ㄐㄧㄣ ㄊㄧㄢ'}],patterns:[],phrases:[],window:{}};
  vm.createContext(context);vm.runInContext(source,context);
  return {context,convert:value=>context.window.ChengciZhuyinLite.convert(value),use(items){vocabulary=items;context.window.ChengciPersonalCards={allWords:()=>vocabulary};},set(items){vocabulary=items;}};
}

test('pronunciation candidates refresh after canonical word/example edits without mutating the Studio dictionary',()=>{
  const c=converter();
  assert.equal(c.convert('測試'),'ㄘㄜˋ ㄕˋ');
  c.use([{word:'測試',zhuyin:'ㄘㄜˊ ㄕˊ',example:'測試今天',exampleZhuyin:'ㄘㄜˊ ㄕˊ ㄐㄧㄣ ㄊㄧㄢ'}]);
  assert.equal(c.convert('測試'),'ㄘㄜˊ ㄕˊ');
  assert.equal(c.convert('測試今天'),'ㄘㄜˊ ㄕˊ ㄐㄧㄣ ㄊㄧㄢ');
  c.set([{word:'測試',zhuyin:'ㄘㄜˇ ㄕˇ',example:'測試今天',exampleZhuyin:'ㄘㄜˇ ㄕˇ ㄐㄧㄣ ㄊㄧㄢ'}]);
  assert.equal(c.convert('測試'),'ㄘㄜˇ ㄕˇ','a prior conversion must not freeze later edits');
});

test('empty canonical vocabulary does not fall back to deleted seed phrase entries',()=>{
  const c=converter();assert.equal(c.convert('測試'),'ㄘㄜˋ ㄕˋ');c.use([]);
  assert.notEqual(c.convert('測試'),'ㄘㄜˋ ㄕˋ');
  assert.equal(c.context.words[0].zhuyin,'ㄘㄜˋ ㄕˋ','the seed itself remains unchanged');
});

test('saved canonical pronunciation wins over overlapping bundled phrase hints',()=>{
  const c=converter();c.context.phrases.push({text:'測試',zhuyin:'ㄘㄜˋ ㄕˋ'});c.use([{word:'測試',zhuyin:'ㄘㄜˇ ㄕˇ'}]);
  assert.equal(c.convert('測試'),'ㄘㄜˇ ㄕˇ');
});
