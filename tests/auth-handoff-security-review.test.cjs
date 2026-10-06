const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
// Actual store/handoff/personal editor scripts with a minimal fake DOM and
// per-tab sessionStorage. This simulates redirect/reload, not a real browser.
async function page(storage, revision, meaning) {
  const elements = new Map(), events = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, { id, value: id==='personalListFilter'?'mine':'', checked:false, hidden:false, disabled:false, innerHTML:'', textContent:'', listeners:{}, classList:{toggle(){}},
      addEventListener(type,fn){this.listeners[type]=fn;}, focus(){}, scrollIntoView(){}, reportValidity(){return true;}, querySelectorAll(){return [];} });
    return elements.get(id);
  }
  const context = { console, crypto:webcrypto, URL, Blob,
    words: [], location: { origin: 'https://review.example', assign() {} },
    localStorage: { getItem(){return null;}, setItem(){}, removeItem(){} },
    sessionStorage: { getItem:key=>storage.get(key)||null, setItem:(key,value)=>storage.set(key,value), removeItem:key=>storage.delete(key) },
    document: { getElementById:element, addEventListener(){}, body:{appendChild(){}}, createElement:()=>element('created') },
    addEventListener(type,fn){events.set(type,[...(events.get(type)||[]),fn]);}, dispatchEvent(){},
    CustomEvent: class {constructor(type,opts={}){this.type=type;this.detail=opts.detail;}}, confirm:()=>true, setTimeout(){}, showTab(){}, openPracticePanel(id){context.openPanel=id;},
    escapeHtml:text=>String(text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    ChengciZhuyinLite:{convert:()=> 'ㄉㄢˋ'},
    ChengciCloudSync:{getState:()=>({configured:true,connected:false,status:'login-required'}),subscribe(){},async connect(){const e=new Error('Login');e.code='LOGIN_REQUIRED';throw e;},loginUrl:()=>'/auth/login'} };
  context.window=context;vm.createContext(context);
  for(const name of ['card-store','auth-handoff','personal-cards'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+name+'.js'),'utf8'),context);
  await context.ChengciCardStore.ready;
  await context.ChengciCardStore.applyRemote('cards',[{schemaVersion:1,id:'card-review',operationId:'remote-'+revision,revision,deleted:false,updatedAt:'2026-10-06T00:00:00.000Z',data:{word:'檢查',zhuyin:'ㄐㄧㄢˇ ㄔㄚˊ',meaning}}]);
  for(const fn of events.get('load')||[])await fn();
  return { context,store:context.ChengciCardStore,e:element };
}

test('draft restored after login cannot silently overwrite a card changed on another device during redirect',async()=>{
  const storage=new Map();
  const before=await page(storage,1,'original meaning');
  before.context.ChengciPersonalCards.open('card-review');
  before.e('personalMeaning').value='my unsaved draft';
  await before.e('personalConnect').listeners.click();
  assert.equal(before.e('personalLoginCheckpoint').hidden,false);
  assert.match(before.e('personalSettingsStatus').textContent,/ログイン画面へ移動する前/,'checkpoint explanation is visible in settings');
  await before.e('personalLoginCheckpoint').listeners.click();
  assert.ok(storage.size>0);
  const after=await page(storage,2,'other device changed meaning');
  assert.equal(after.e('personalMeaning').value,'my unsaved draft','draft survives redirect');
  assert.equal(after.context.openPanel,'personalCardsPanel','auth return reveals restored editor without resetting it');
  await after.e('personalCardForm').listeners.submit({preventDefault(){}});
  assert.equal(after.store.get('card-review').meaning,'other device changed meaning','unseen remote change must remain until explicitly compared');
  assert.ok(after.e('personalMeaning').value==='my unsaved draft'||after.store.list().some(record=>record.id!=='card-review'&&record.meaning==='my unsaved draft'),'draft is retained for comparison or as a separate card');
});

test('redirected editor draft retains category tags and contrast notes',async()=>{
  const storage=new Map(),before=await page(storage,1,'same meaning');
  before.context.ChengciPersonalCards.open('card-review');
  before.e('personalCategory').value='会話';before.e('personalTags').value='声調注意、例文';before.e('personalConfuse').value='混同しやすい語のメモ';
  await before.e('personalConnect').listeners.click();await before.e('personalLoginCheckpoint').listeners.click();
  const after=await page(storage,1,'same meaning');
  assert.equal(after.e('personalCategory').value,'会話');assert.equal(after.e('personalTags').value,'声調注意、例文');assert.equal(after.e('personalConfuse').value,'混同しやすい語のメモ');
});
