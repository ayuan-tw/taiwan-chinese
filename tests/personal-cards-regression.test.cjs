// Regression coverage for the personal-card UI and recall/store boundary.
// These are Node VM DOM simulations, not browser or layout verification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
const {createStore, memoryAdapter} = require('../js/card-store.js');
const {createHandoff, KEY:HANDOFF_KEY} = require('../js/auth-handoff.js');

async function harness(options = {}) {
  const elements = new Map(), events = new Map(), local = new Map(options.local);
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
    document:{getElementById:id=>options.missing?.includes(id) ? null : element(id), querySelector:()=>({focus(){}}), addEventListener:(type,fn)=>listen('document:'+type,fn), body:{appendChild(){}}, createElement:()=>element('download')},
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
    if (file === 'card-store.js' && options.storeFactory) context.ChengciCardStore = options.storeFactory(context);
  }
  await options.beforeLoad?.(context);
  // Dispatch all load listeners together, like a browser; awaiting each one
  // in turn would hide the storage/handoff race.
  const loaded = emit('load');
  if (!options.deferLoad) await loaded;
  return {
    context, options, cloud, base, local, loaded, e:element, store:context.ChengciCardStore,
    set:(id,value)=>element(id).value=value,
    submit:()=>element('personalCardForm').listeners.submit({preventDefault(){}}),
    action:data=>emit('document:click',{target:{closest(selector){
      const key=Object.keys(data).find(key=>selector.includes('data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())));
      return key ? {dataset:data} : null;
    }}}),
    emit
  };
}

function deferred() {
  let resolve;
  const promise = new Promise(done=>{resolve=done;});
  return {promise,resolve};
}
function recallState(queue, history = {}, completed = 0) {
  return JSON.stringify({range:'all',history,queue,signature:'word|all|all',total:queue.length+completed,completed,started:true});
}
function recallClick(t, action, token) {
  t.e('recallPanel').listeners.click?.({target:{closest:()=>({dataset:{recallAction:action,recallToken:token}})}});
}
function recallRate(t, result) {
  recallClick(t,'reveal');
  recallClick(t,result,/data-recall-token="(\d+)"/.exec(t.e('recallArea').innerHTML)?.[1]);
}

test('recall waits for delayed device cards before restoring and pruning its saved queue', async()=>{
  const disk=memoryAdapter(), donor=createStore({adapter:disk,broadcast:false});
  await donor.ready;
  const card=await donor.save({word:'再読み込みする語',meaning:'保存済みの意味'});
  const progress={result:'notyet',attempts:3,updatedAt:'2026-10-06T00:00:00.000Z'};
  await donor.saveProgress(card.id,progress);
  const saved=recallState([card.id,'word-base'],{[card.id]:progress});
  const before=await disk.read(), gate=deferred();
  const t=await harness({recall:true,deferLoad:true,local:[['chengciRecallV1',saved]],storeFactory:env=>createStore({env,broadcast:false,adapter:{read:async()=>{await gate.promise;return disk.read();},transact:disk.transact}})});
  t.context.ChengciRecall.refresh();
  await t.emit('chengci-user-cards-changed',{detail:{cardsChanged:true}});
  assert.equal(t.e('recallStart').disabled,true);
  assert.match(t.e('recallArea').innerHTML,/読み込んでいます/);
  assert.equal(t.local.get('chengciRecallV1'),saved);
  gate.resolve();await t.loaded;
  assert.equal(await t.context.ChengciPersonalCards.ready,true);
  assert.match(t.e('recallArea').innerHTML,/再読み込みする語/);
  assert.match(t.e('recallArea').innerHTML,/読めた 0 \/ 2語 · 残り 2語/);
  assert.equal(t.e('recallStart').disabled,false);
  assert.deepEqual(await disk.read(),before,'Initialization must not rewrite cards or progress');
  recallRate(t,'notyet');
  const resumed=JSON.parse(t.local.get('chengciRecallV1'));
  assert.deepEqual(resumed.queue,['word-base',card.id]);
  assert.equal(resumed.history[card.id].attempts,4);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(t.store.getProgress(card.id).attempts,4);
  assert.equal(t.store.get(card.id).meaning,'保存済みの意味');
});

test('recall waits for delayed login checkpoint import and draft restoration', async()=>{
  const checkpoint=new Map(), env={location:{origin:'https://recall.example'},sessionStorage:{getItem:key=>checkpoint.get(key)||null,setItem:(key,value)=>checkpoint.set(key,value),removeItem:key=>checkpoint.delete(key)}};
  const donor=createStore({broadcast:false});await donor.ready;
  const card=await donor.save({word:'ログイン前の語',note:'残しておくメモ'});
  const progress={result:'notyet',attempts:2,updatedAt:'2026-10-06T00:00:00.000Z'};
  await donor.saveProgress(card.id,progress);
  await createHandoff(donor,env).prepare({editorId:'',fields:{word:'未保存の入力',meaning:'下書きの意味'}});
  const saved=recallState([card.id,'word-base'],{[card.id]:progress}), gate=deferred(), entered=deferred();
  const t=await harness({recall:true,deferLoad:true,local:[['chengciRecallV1',saved]],beforeLoad:context=>{
    const store=context.ChengciCardStore, importBackup=store.importBackup.bind(store);
    store.importBackup=async backup=>{entered.resolve();await gate.promise;return importBackup(backup);};
    context.ChengciAuthHandoff=createHandoff(store,env);
  }});
  await entered.promise;
  t.context.ChengciRecall.refresh();
  await t.emit('chengci-user-cards-changed',{detail:{cardsChanged:true}});
  assert.equal(t.e('recallStart').disabled,true);
  assert.equal(t.local.get('chengciRecallV1'),saved);
  gate.resolve();await t.loaded;
  assert.equal(await t.context.ChengciPersonalCards.ready,true);
  assert.match(t.e('recallArea').innerHTML,/ログイン前の語/);
  assert.match(t.e('recallArea').innerHTML,/読めた 0 \/ 2語 · 残り 2語/);
  assert.equal(t.e('personalWord').value,'未保存の入力');
  assert.equal(t.e('personalMeaning').value,'下書きの意味');
  assert.equal(t.store.get(card.id).note,'残しておくメモ');
  assert.equal(t.store.getProgress(card.id).attempts,2);
  assert.equal(checkpoint.has(HANDOFF_KEY),false,'The real handoff completes normally');
});

test('failed or unavailable personal-card initialization settles and preserves saved recall', async()=>{
  const saved=recallState(['personal-unloaded','word-base']);
  const scenarios=[
    {storeFactory:env=>createStore({env,broadcast:false,adapter:{read:async()=>({schemaVersion:99}),transact(){throw Error('must not write');}}})},
    {missing:['personalCardsPanel']},
    {missing:['personalCardForm']},
    {beforeLoad:context=>{context.ChengciAuthHandoff={restore:async()=>{throw Error('checkpoint unavailable');}};}},
    {beforeLoad:context=>{context.ChengciCardStore.ready=Promise.reject(Error('storage unavailable'));}}
  ];
  for (const scenario of scenarios) {
    const t=await harness({recall:true,local:[['chengciRecallV1',saved]],...scenario});
    assert.equal(await t.context.ChengciPersonalCards.ready,false);
    t.context.ChengciRecall.refresh();
    assert.equal(t.local.get('chengciRecallV1'),saved);
    assert.match(t.e('recallArea').innerHTML,/再開できません/);
    assert.match(t.e('recallStorageStatus').textContent,/残しています/);
    assert.equal(t.e('recallStart').disabled,true);
  }
});

test('dictionary recall still starts if the personal card store is absent', async()=>{
  const t=await harness({recall:true,storeFactory:()=>undefined});
  t.e('recallStart').listeners.click();
  assert.match(t.e('recallArea').innerHTML,/敢/);
  assert.match(t.e('recallArea').innerHTML,/読めた 0 \/ 1語 · 残り 1語/);
});

test('deleting a queued card after readiness keeps completed, remaining, and total consistent', async()=>{
  const disk=memoryAdapter(), donor=createStore({adapter:disk,broadcast:false});await donor.ready;
  const removed=await donor.save({word:'外す語'}), kept=await donor.save({word:'残す語'});
  const history={[removed.id]:{result:'notyet',attempts:2,updatedAt:'2026-10-06T00:00:00.000Z'}};
  const saved=recallState(['word-base',removed.id,kept.id],history);
  const t=await harness({recall:true,local:[['chengciRecallV1',saved]],storeFactory:env=>createStore({env,adapter:disk,broadcast:false})});
  recallRate(t,'read');
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(t.e('recallArea').innerHTML,/読めた 1 \/ 3語 · 残り 2語/);
  recallClick(t,'reveal');
  const oldToken=/data-recall-token="(\d+)"/.exec(t.e('recallArea').innerHTML)[1];
  await t.action({personalDelete:removed.id});
  assert.match(t.e('recallArea').innerHTML,/残す語/);
  assert.match(t.e('recallArea').innerHTML,/読めた 1 \/ 2語 · 残り 1語/);
  recallClick(t,'read',oldToken);
  assert.match(t.e('recallArea').innerHTML,/読めた 1 \/ 2語 · 残り 1語/);
  recallRate(t,'read');
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(t.e('recallArea').innerHTML,/2語を練習しました/);
  const completed=JSON.parse(t.local.get('chengciRecallV1'));
  assert.equal(completed.total,2);assert.equal(completed.completed,2);assert.deepEqual(completed.queue,[]);
  assert.deepEqual(completed.history[removed.id],history[removed.id],'Removing from the queue must not erase prior attempts');
  assert.equal(t.store.get(removed.id).deleted,true);assert.equal(t.store.get(kept.id).word,'残す語');
});

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

test('canonical word inventory replaces bundled fallback, including intentionally empty inventory', async()=>{
  const t=await harness({beforeLoad:async context=>{
    await context.ChengciCardStore.ready;
    await context.ChengciCardStore.adoptVocabulary({version:1,epoch:1,ready:true},[remote('cloud-only',1,{word:'雲端專用',meaning:'クラウドだけ',category:'会話',tags:['同期'],confuse:'似た語メモ'})]);
  }});
  assert.deepEqual(Array.from(t.context.ChengciPersonalCards.allWords(),item=>item.word),['雲端專用']);
  assert.equal(t.context.ChengciPersonalCards.allWords()[0].confuse,'似た語メモ');
  const empty=await harness({beforeLoad:async context=>{await context.ChengciCardStore.ready;await context.ChengciCardStore.adoptVocabulary({version:1,epoch:1,ready:true},[]);}});
  assert.equal(empty.context.ChengciPersonalCards.allWords().length,0,'No hidden resurrection of bundled defaults');
});

test('editing a canonical built-in preserves metadata and updates shared provider without mutating bundle', async()=>{
  const t=await harness({recall:true,beforeLoad:async context=>{
    await context.ChengciCardStore.ready;
    await context.ChengciCardStore.adoptVocabulary({version:1,epoch:1,ready:true},[remote('word-base',1,{word:'敢',zhuyin:'ㄍㄢˇ',meaning:'あえて',example:'クラウドの旧例文',exampleZhuyin:'ㄐㄧㄡˋ',category:'会話',tags:['声調注意','会話'],confuse:'旧対比',pronunciationStatus:'confirmed'})]);
  }});
  await t.action({personalEdit:'word-base'});
  assert.equal(t.e('personalCategory').value,'会話');assert.equal(t.e('personalTags').value,'声調注意、会話');
  t.set('personalExample','這是自己改的例句。');t.set('personalExampleZhuyin','ㄓㄜˋ ㄕˋ');t.set('personalConfuse','新しい対比');
  await t.submit();
  const edited=t.store.get('word-base');assert.equal(edited.example,'這是自己改的例句。');assert.equal(edited.confuse,'新しい対比');assert.equal(edited.category,'会話');assert.deepEqual(Array.from(edited.tags),['声調注意','会話']);
  assert.equal(t.e('personalListFilter').value,'all','Saving selects an option present in the unified list');
  assert.equal(t.context.ChengciPersonalCards.allWords()[0].example,edited.example);
  assert.equal(t.base[0].example,'妳還真敢說耶～');
  t.e('recallStart').listeners.click();recallClick(t,'reveal');
  assert.match(t.e('recallArea').innerHTML,/這是自己改的例句/);
  assert.doesNotMatch(t.e('recallArea').innerHTML,/クラウドの旧例文/);
});

test('remembered checkbox keeps management search inventory and reversibly excludes learning', async()=>{
  const t=await harness();
  await t.action({personalRemembered:'word-base',remembered:'true'});
  assert.equal(t.context.ChengciPersonalCards.isRemembered('word-base'),true);
  assert.equal(t.context.ChengciPersonalCards.allWords().length,1);
  assert.equal(t.context.ChengciPersonalCards.learningWords().length,0);
  await t.action({personalRemembered:'word-base',remembered:'false'});
  assert.equal(t.context.ChengciPersonalCards.isRemembered('word-base'),false);
  assert.equal(t.context.ChengciPersonalCards.learningWords().length,1);
});

test('sole word-list renderer receives canonical search results and remembered words remain searchable', async()=>{
  let rendered=[];
  const t=await harness({beforeLoad:context=>{context.renderWordList=list=>{rendered=[...list];};}});
  t.set('personalListFilter','all');
  await t.context.ChengciPersonalCards.setRemembered('word-base',true);
  t.set('personalListSearch','敢');t.context.ChengciPersonalCards.refreshList();
  assert.equal(rendered.length,1);assert.equal(rendered[0].id,'word-base');
  t.set('personalListFilter','unremembered');t.context.ChengciPersonalCards.refreshList();assert.equal(rendered.length,0);
  t.set('personalListFilter','remembered');t.context.ChengciPersonalCards.refreshList();assert.equal(rendered.length,1);
});

test('vocabulary bootstrap is explicit and cancel preserves the current word inventory', async()=>{
  let calls=0;
  const cloud={configured:true,connected:true,status:'synced',vocabulary:{version:0,epoch:0,ready:false,clientReady:false}};
  const t=await harness({cloud,beforeLoad:context=>{context.ChengciCloudSync.bootstrapVocabulary=async()=>{calls++;await context.ChengciCardStore.adoptVocabulary({version:1,epoch:1,ready:true},[remote('word-base',1,{word:'敢',meaning:'あえて'})]);return {vocabulary:{clientReady:true}};};}});
  assert.equal(calls,0);assert.equal(t.e('vocabularyBootstrap').disabled,false);
  t.options.confirm=false;await t.e('vocabularyBootstrap').listeners.click();assert.equal(calls,0);assert.equal(t.context.ChengciPersonalCards.allWords().length,1);
  t.options.confirm=true;await t.e('vocabularyBootstrap').listeners.click();assert.equal(calls,1);assert.equal(t.store.getVocabulary().clientReady,true);assert.match(t.e('personalEditorStatus').textContent,/まとめました/);
});

test('migration archive export describes local-only scope instead of claiming a server backup', async()=>{
  const t=await harness({beforeLoad:context=>{context.ChengciCloudSync.exportVocabularyArchive=async()=>({format:'chengci-vocabulary-recovery',scope:'local-only',local:{archive:{}},server:null});}});
  await t.e('vocabularyArchiveExport').listeners.click();
  assert.match(t.e('personalEditorStatus').textContent,/この端末の控えだけ/);
});

test('remembered removal cannot erase an add arriving while actor initialization waits',async()=>{
  const t=await harness();
  await t.store.updateShared('seen',[{kind:'remembered',id:'word-base',active:true}]);
  const gate=deferred(),ensure=t.store.ensureStudyActorId.bind(t.store);
  t.store.ensureStudyActorId=async proposed=>{await gate.promise;return ensure(proposed);};
  const remove=t.context.ChengciPersonalCards.setRemembered('word-base',false);
  await t.store.updateShared('unseen',[{kind:'remembered',id:'word-base',active:true}]);
  gate.resolve();await remove;
  assert.equal(t.context.ChengciPersonalCards.isRemembered('word-base'),true,'Unseen concurrent add remains');
  assert.equal(t.store.getShared('remembered','word-base').removes.seen,1);
  assert.equal(t.store.getShared('remembered','word-base').removes.unseen,undefined);
});

test('queued remembered gestures retain their original epoch and do not replay after migration',async()=>{
  const t=await harness(),gate=deferred(),ensure=t.store.ensureStudyActorId.bind(t.store);
  t.store.ensureStudyActorId=async proposed=>{await gate.promise;return ensure(proposed);};
  const first=t.context.ChengciPersonalCards.setRemembered('word-base',true);
  const second=t.context.ChengciPersonalCards.setRemembered('word-base',false);
  const result=Promise.allSettled([first,second]);
  await t.store.adoptVocabulary({version:1,epoch:1,ready:true},[remote('word-base',1,{word:'敢',meaning:'あえて'})]);
  gate.resolve();const outcomes=await result;
  assert.equal(outcomes.every(item=>item.status==='rejected'&&item.reason.code==='vocabulary_epoch_changed'),true);
  assert.equal(t.store.getShared('remembered','word-base'),null);
  assert.equal(t.store.getVocabularyArchive().studyQueues.length,2);
});

test('rapid remembered check then uncheck observes this UI own queued add',async()=>{
  const t=await harness(),gate=deferred(),ensure=t.store.ensureStudyActorId.bind(t.store);
  t.store.ensureStudyActorId=async proposed=>{await gate.promise;return ensure(proposed);};
  const first=t.context.ChengciPersonalCards.setRemembered('word-base',true);
  const second=t.context.ChengciPersonalCards.setRemembered('word-base',false);
  gate.resolve();await Promise.all([first,second]);
  assert.equal(t.context.ChengciPersonalCards.isRemembered('word-base'),false);
});

test('metadata-only card conflicts show both categories tags and contrast notes for review',async()=>{
  const t=await harness();
  const item=await t.store.save({word:'比較',meaning:'比べる',category:'local<分類>',tags:['local&tag'],confuse:'local対比'});
  await t.store.applyRemote('cards',[remote(item.id,1,{word:'比較',meaning:'比べる',category:'cloud分類',tags:['cloudタグ'],confuse:'cloud対比'})]);
  const html=t.e('personalCardList').innerHTML;
  for(const value of ['local&lt;分類&gt;','local&amp;tag','local対比','cloud分類','cloudタグ','cloud対比'])assert.ok(html.includes(value),value);
  assert.doesNotMatch(html,/<分類>/);
});

test('management category/search view survives model notifications and resets with explicit list selection',async()=>{
  let rendered=[];
  const t=await harness({beforeLoad:async context=>{
    context.renderWordList=list=>{rendered=[...list];};await context.ChengciCardStore.ready;
    await context.ChengciCardStore.adoptVocabulary({version:1,epoch:1,ready:true},[remote('word-base',1,{word:'敢',meaning:'あえて',category:'会話'}),remote('word-other',1,{word:'書',meaning:'本',category:'名詞'})]);
  }});
  t.set('personalListFilter','all');t.set('personalListSearch','敢');
  t.context.ChengciPersonalCards.setListView(items=>items.filter(item=>item.category==='会話'),'分類：会話');
  await t.store.saveProgress('word-other',{result:'read',attempts:1,updatedAt:'2026-10-06T00:00:00.000Z'});
  assert.deepEqual(rendered.map(item=>item.id),['word-base']);assert.equal(t.e('personalListCount').textContent,'分類：会話 / 1件');
  t.set('personalListSearch','');t.set('personalListFilter','all');t.e('personalListFilter').listeners.change();
  assert.equal(rendered.length,2);assert.equal(t.e('personalListCount').textContent,'2件');
});


test('reopening an interrupted dirty editor keeps fields, and cancel respects the confirmation', async()=>{
  const routes=[];
  const t=await harness({beforeLoad:context=>{
    context.openPracticePanel=id=>routes.push(id);
    context.jumpToStudyPanel=id=>routes.push(id);
  }});
  await t.action({personalEdit:'word-base'});t.set('personalMeaning','編集中の意味');
  await t.action({personalEdit:'word-base'});
  assert.equal(t.e('personalMeaning').value,'編集中の意味','same card reopens without resetting the draft');
  t.options.confirm=false;await t.e('personalCancel').listeners.click();
  assert.equal(t.e('personalMeaning').value,'編集中の意味');assert.notEqual(routes.at(-1),'wordListPanel');
  t.options.confirm=true;await t.e('personalCancel').listeners.click();
  assert.equal(routes.at(-1),'wordListPanel');assert.equal(t.e('personalMeaning').value,'');
});
