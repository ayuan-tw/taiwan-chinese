// Regression coverage for the personal-card UI and recall/store boundary.
// These are Node VM DOM simulations, not browser or layout verification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

async function harness(options = {}) {
  const elements = new Map(), events = new Map(), local = new Map();
  const cloud = {configured:false, connected:false, status:'disabled', ...options.cloud};
  const base = [{id:'word-base', type:'word', word:'敢', zhuyin:'ㄍㄢˇ', meaning:'あえて〜する', example:'妳還真敢說耶～', note:'元の説明', tags:['会話'], category:'会話'}];
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, value:id === 'personalListFilter' ? 'mine' : id === 'recallRange' ? 'all' : '', textContent:'', innerHTML:'', checked:false, hidden:false, open:false, disabled:false,
      listeners:{}, classList:{toggle(){}}, addEventListener(type, fn){this.listeners[type] = fn;},
      focus(){}, scrollIntoView(){}, reportValidity(){return true;},
      querySelectorAll(selector){
        return this.id === 'personalCardForm' && selector === 'input,textarea,button'
          ? ['personalWord','personalExample','personalZhuyin','personalReadingChecked','personalMeaning','personalExampleZhuyin','personalNote','personalSuggest','personalSave','personalCancel','personalSaveCopy'].map(element)
          : [];
      },
      click(){}, remove(){}
    });
    return elements.get(id);
  }
  function listen(type, fn){events.set(type, [...(events.get(type) || []), fn]);}
  function emit(type, event){return Promise.all((events.get(type) || []).map(fn => fn(event)));}
  const context = {
    console, crypto:webcrypto, words:base, CHENGCI_SYNC_CONFIG:null, Blob, URL,
    localStorage:{getItem:key=>local.get(key)||null, setItem:(key,value)=>local.set(key,value), removeItem:key=>local.delete(key)},
    document:{getElementById:element, querySelector:()=>({focus(){}}), addEventListener:(type,fn)=>listen('document:'+type,fn), body:{appendChild(){}}, createElement:()=>element('download')},
    addEventListener:listen, dispatchEvent:event=>emit(event.type,event),
    CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    confirm:()=>options.confirm !== false, setTimeout:()=>0, showTab(){}, shuffleArray:items=>[...items], audioButton:()=>'',
    itemMatchesStudyScope:()=>true, studyScopeSignature:()=> 'word|all',
    escapeHtml:value=>String(value || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    ChengciZhuyinLite:{convert:text=>'注音候補:'+text},
    ChengciCloudSync:{getState:()=>cloud, subscribe(){}, async connect(){}, async disconnect(){}, async retry(){}}
  };
  context.window=context;
  vm.createContext(context);
  for (const file of ['card-store.js','personal-cards.js',...(options.recall ? ['recall-cards.js'] : [])]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file),'utf8'),context,{filename:file});
  }
  await emit('load');
  return {
    context, options, cloud, base, local, e:element, store:context.ChengciCardStore,
    set:(id,value)=>element(id).value=value,
    submit:()=>element('personalCardForm').listeners.submit({preventDefault(){}}),
    action:data=>emit('document:click',{target:{closest(selector){
      const key=Object.keys(data).find(key=>selector.includes('data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())));
      return key ? {dataset:data} : null;
    }}}),
    emit
  };
}

function remote(id, revision, fields, options={}) {
  return {id, schemaVersion:1, revision, operationId:'op-remote-'+revision, deleted:false,
    updatedAt:options.updatedAt || '2026-01-01T00:00:00.000Z', data:fields};
}

test('unchecking a confirmed pronunciation actually removes confirmation', async()=>{
  const t=await harness();
  await t.action({personalEdit:'word-base'});
  assert.equal(t.e('personalReadingChecked').checked,true);
  t.e('personalReadingChecked').checked=false;
  t.e('personalReadingChecked').listeners.change?.();
  await t.submit();
  assert.notEqual(t.store.get('word-base').pronunciationStatus,'confirmed');
});

test('inputs typed while an asynchronous save is pending are preserved or disabled', async()=>{
  const t=await harness();
  let release;
  const gate=new Promise(resolve=>release=resolve), save=t.store.save.bind(t.store);
  t.store.save=async(...args)=>{await gate;return save(...args);};
  t.set('personalWord','先に保存する語');
  const saving=t.submit();
  const editable=!t.e('personalWord').disabled;
  if (editable) t.set('personalWord','保存中に入力した次の語');
  release();
  await saving;
  assert.equal(t.store.list()[0].word,'先に保存する語');
  if (editable) assert.equal(t.e('personalWord').value,'保存中に入力した次の語');
});

test('duplicate detection does not discard newly entered meaning and note without approval', async()=>{
  const t=await harness({confirm:false});
  t.set('personalWord','重複語');t.set('personalExample','同じ例文');await t.submit();
  t.set('personalWord','重複語');t.set('personalExample','同じ例文');
  t.set('personalMeaning','今回だけの意味');t.set('personalNote','書き留めた大切なメモ');
  await t.submit();
  assert.equal(t.e('personalMeaning').value,'今回だけの意味');
  assert.equal(t.e('personalNote').value,'書き留めた大切なメモ');
});

test('offline and actively syncing states are explicitly visible', async()=>{
  const offline=await harness({cloud:{configured:true,connected:true,status:'offline'}});
  assert.match(offline.e('personalSyncStatus').textContent,/オフライン|通信できません|ネットワーク未接続/);
  const syncing=await harness({cloud:{configured:true,connected:true,status:'syncing'}});
  assert.match(syncing.e('personalSyncStatus').textContent,/同期中|同期しています/);
});

test('conflict comparison displays differences in note and example pronunciation', async()=>{
  const t=await harness();
  const card=await t.store.save({word:'競合',zhuyin:'ㄐㄧㄥˋ ㄏㄜˊ',note:'LOCAL_NOTE_MARKER',exampleZhuyin:'LOCAL_READING_MARKER',pronunciationStatus:'confirmed'});
  await t.store.applyRemote('cards',[remote(card.id,1,{...card,note:'REMOTE_NOTE_MARKER',exampleZhuyin:'REMOTE_READING_MARKER',pronunciationStatus:'candidate'})]);
  const html=t.e('personalCardList').innerHTML;
  for (const marker of ['LOCAL_NOTE_MARKER','REMOTE_NOTE_MARKER','LOCAL_READING_MARKER','REMOTE_READING_MARKER']) assert.ok(html.includes(marker),`Missing conflict field: ${marker}`);
});

test('recall accepts authoritative progress revisions even if the other device clock is older', async()=>{
  const t=await harness({recall:true});
  await t.store.applyRemote('progress',[remote('word-base',1,{result:'read',attempts:1,updatedAt:'2026-02-01T00:00:00.000Z'},{updatedAt:'2026-02-01T00:00:00.000Z'})]);
  assert.match(t.e('recallSummary').textContent,/読めた：1語/);
  await t.store.applyRemote('progress',[remote('word-base',2,{result:'notyet',attempts:2,updatedAt:'2026-01-01T00:00:00.000Z'})]);
  assert.equal(t.store.getProgress('word-base').result,'notyet');
  assert.match(t.e('recallSummary').textContent,/読めた：0語/);
});

test('choosing cloud progress in a conflict is immediately reflected in recall', async()=>{
  const t=await harness({recall:true});
  await t.store.saveProgress('word-base',{result:'read',attempts:1,updatedAt:'2026-02-01T00:00:00.000Z'});
  await t.store.applyRemote('progress',[remote('word-base',1,{result:'notyet',attempts:2,updatedAt:'2025-01-01T00:00:00.000Z'},{updatedAt:'2025-01-01T00:00:00.000Z'})]);
  assert.equal(t.store.getState().conflictCount,1);
  await t.action({progressResolve:'remote',id:'word-base'});
  assert.equal(t.store.getProgress('word-base').result,'notyet');
  assert.match(t.e('recallSummary').textContent,/読めた：0語/);
});

test('unsynced conflicting changes in memory still warn before the page closes', async()=>{
  const t=await harness();
  const card=await t.store.save({word:'端末だけの変更'});
  await t.store.applyRemote('cards',[remote(card.id,1,{word:'クラウドの変更'})]);
  assert.equal(t.store.getState().pendingCount,0);
  assert.equal(t.store.getState().conflictCount,1);
  let prevented=false;
  await t.emit('beforeunload',{preventDefault(){prevented=true;}});
  assert.equal(prevented,true,'An unresolved local version is not safely synced');
});

test('backup progress conflict is labeled as a backup rather than a cloud version', async()=>{
  const t=await harness();
  await t.store.saveProgress('word-base',{result:'read',attempts:1,updatedAt:'2026-01-01T00:00:00.000Z'});
  const backup=t.store.exportBackup();
  backup.state.progress['word-base'].data={result:'notyet',attempts:2,updatedAt:'2026-01-02T00:00:00.000Z'};
  await t.store.importBackup(backup);
  assert.equal(t.store.getState().conflicts[0].source,'backup');
  assert.match(t.e('personalProgressConflicts').innerHTML,/バックアップ/);
  assert.doesNotMatch(t.e('personalProgressConflicts').innerHTML,/クラウドの記録を使う/);
});

test('a conflict choice cannot silently select a newer unseen remote version', async()=>{
  const t=await harness();
  const card=await t.store.save({word:'この端末の内容'});
  await t.store.applyRemote('cards',[remote(card.id,1,{word:'比較済みのクラウド内容'})]);
  assert.match(t.e('personalCardList').innerHTML,/比較済みのクラウド内容/);
  const encodedToken=t.e('personalCardList').innerHTML.match(/data-personal-resolve="remote"[^>]*data-conflict-token="([^"]*)"/)?.[1];
  assert.ok(encodedToken,'The rendered choice must identify the exact compared versions');
  const conflictToken=encodedToken.replace(/&(quot|#39|lt|gt|amp);/g,(_,entity)=>({quot:'"','#39':"'",lt:'<',gt:'>',amp:'&'}[entity]));
  assert.equal(conflictToken,t.store.get(card.id).conflict.comparisonToken);
  // The new snapshot is queued but has not been rendered when the user chooses.
  const incoming=t.store.applyRemote('cards',[remote(card.id,2,{word:'まだ比較していないクラウド内容'})]);
  const choice=t.action({personalResolve:'remote',id:card.id,conflictToken});
  await Promise.all([incoming,choice]);
  assert.equal(t.store.getState().conflictCount,1,'The new versions must remain available for explicit comparison');
  assert.equal(t.store.get(card.id).word,'この端末の内容');
});

test('deleted cards with unresolved conflicts remain visible in the default manager', async()=>{
  const t=await harness();
  await t.action({personalDelete:'word-base'});
  assert.equal(t.context.ChengciPersonalCards.allWords().length,0,'Deleted card stays out of practice');
  await t.store.applyRemote('cards',[remote('word-base',1,{word:'敢',meaning:'別の端末からの編集'})]);
  assert.equal(t.e('personalListFilter').value,'mine');
  assert.match(t.e('personalCardList').innerHTML,/別の端末からの編集/);
  assert.match(t.e('personalCardList').innerHTML,/data-personal-resolve="remote"/);
  assert.equal(t.context.ChengciPersonalCards.allWords().length,0,'Conflict visibility does not restore the deleted card');
});
