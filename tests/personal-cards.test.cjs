const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');
const root = path.join(__dirname,'..');

async function harness() {
  const elements = new Map();
  const events = new Map();
  const local = new Map();
  const base = [{id:'word-base',type:'word',word:'敢',zhuyin:'ㄍㄢˇ',meaning:'あえて〜する',example:'妳還真敢說耶～',note:'元の説明',tags:['会話'],category:'会話'}];
  const original = JSON.stringify(base);
  function element(id) {
    if(!elements.has(id)) elements.set(id,{id,value:'',textContent:'',innerHTML:'',checked:false,hidden:false,open:false,disabled:false,listeners:{},classList:{toggle(){}},
      addEventListener(type,fn){this.listeners[type]=fn;},focus(){},scrollIntoView(){},reportValidity(){return true;},querySelectorAll(){return [];},click(){},remove(){}});
    return elements.get(id);
  }
  element('personalListFilter').value='mine';
  const context = {
    console,crypto:webcrypto,words:base,CHENGCI_SYNC_CONFIG:null,Blob,URL,
    localStorage:{getItem:key=>local.get(key)||null,setItem:(key,v)=>local.set(key,v),removeItem:key=>local.delete(key)},
    document:{getElementById:element,addEventListener(type,fn){events.set('document:'+type,fn);},body:{appendChild(){}},createElement:()=>element('download')},
    addEventListener(type,fn){events.set(type,fn);},dispatchEvent(event){events.get(event.type)?.(event);},
    CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    confirm:()=>true,setTimeout:()=>0,showTab(){},
    escapeHtml:value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    ChengciZhuyinLite:{convert:text=>'注音候補:'+text},
    ChengciCloudSync:{getState:()=>({configured:false,connected:false,status:'disabled'}),subscribe(){},async connect(){throw Error('disabled');},async disconnect(){},async retry(){}}
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'js/card-store.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(root,'js/personal-cards.js'),'utf8'),context);
  await events.get('load')();
  const set=(id,value)=>element(id).value=value;
  const action=async(data)=>events.get('document:click')({target:{closest(selector){
    const key=Object.keys(data).find(key=>selector.includes('data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())));
    return key?{dataset:data}:null;
  }}});
  const submit=()=>element('personalCardForm').listeners.submit({preventDefault(){}});
  return {context,e:element,set,action,submit,base,original,store:context.ChengciCardStore};
}

(async()=>{
  const t=await harness();
  assert.equal(t.e('personalConnect').disabled,true);
  assert.match(t.e('personalSyncStatus').textContent,/設定の準備中/);
  await t.submit();assert.equal(t.store.list().length,0);
  t.set('personalWord','新語');t.set('personalExample','これは元の文');await t.submit();
  let card=t.store.list()[0];
  assert.equal(card.word,'新語');assert.equal(card.meaning,'');assert.equal(card.zhuyin,'注音候補:新語');assert.equal(card.example,'これは元の文');
  assert.equal(card.pronunciationStatus,'candidate');
  assert.match(t.e('personalEditorStatus').textContent,/この画面/);
  assert.equal(t.context.ChengciPersonalCards.allWords().length,2);
  assert.equal(JSON.stringify(t.base),t.original,'bundled words never mutated');
  await t.action({personalEdit:encodeURIComponent(card.id)});
  t.set('personalMeaning','意味を編集');t.e('personalReadingChecked').checked=true;await t.submit();
  card=t.store.get(card.id);assert.equal(card.meaning,'意味を編集');assert.equal(card.pronunciationStatus,'confirmed');
  t.set('personalWord','新語');t.set('personalExample','これは元の文');await t.submit();
  assert.equal(t.store.list().length,1,'duplicate opens editor');assert.match(t.e('personalEditorStatus').textContent,/同じ単語/);
  await t.action({personalDelete:encodeURIComponent(card.id)});assert.equal(t.store.list().length,0);
  await t.action({personalRestore:encodeURIComponent(card.id)});assert.equal(t.store.list().length,1);
  await t.action({personalDelete:'word-base'});assert.ok(!t.context.ChengciPersonalCards.get('word-base'));
  await t.action({personalRestore:'word-base'});assert.equal(t.context.ChengciPersonalCards.get('word-base').word,'敢','restore bundled tombstone preserves original fields');
  t.context.ChengciPersonalCards.open();
  t.set('personalWord','<img src=x onerror="bad()">');t.set('personalExample','<script>bad()</script>');await t.submit();
  assert.match(t.e('personalCardList').innerHTML,/&lt;img/);assert.doesNotMatch(t.e('personalCardList').innerHTML,/<img|<script>/);
  await t.action({personalEdit:encodeURIComponent(card.id)});
  t.set('personalMeaning','未保存の変更');
  await t.store.save({...card,meaning:'ほかの画面の変更'});
  await t.submit();assert.equal(t.e('personalMeaning').value,'未保存の変更');assert.equal(t.e('personalSaveCopy').hidden,false);
  assert.equal(t.store.get(card.id).meaning,'ほかの画面の変更','stale editor cannot overwrite latest');
  await t.e('personalSaveCopy').listeners.click();
  // Save-copy listener invokes async submit without returning; wait for store mutation queue.
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(t.store.list().some(item=>item.meaning==='未保存の変更'&&item.id!==card.id));
  assert.equal(JSON.stringify(t.base),t.original);
  console.log('Personal-card UI tests passed: quick add, candidates, optional meaning, edit, duplicate handling, delete/restore including bundled cards, escaping, stale editor and explicit save-copy.');
})().catch(error=>{console.error(error);process.exitCode=1;});
