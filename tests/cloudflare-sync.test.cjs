const test=require('node:test');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const {createStore,memoryAdapter}=require('../js/card-store.js');
const {createSync}=require('../js/cloudflare-sync.js');

function server() {
  const records=new Map(), calls=[];
  let clock=0;
  const state={authenticated:true,networkError:false,writeStatus:0,loseAck:false,pageSize:2,epoch:1};
  const key=(kind,id)=>kind+':'+id;
  const reply=(data,status=200)=>new Response(status===204?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  function insert(kind,id,data){const old=records.get(key(kind,id));const doc={schemaVersion:1,id,operationId:'remote-'+(++clock),revision:(old?.document.revision||0)+1,deleted:false,updatedAt:new Date().toISOString(),data};records.set(key(kind,id),{kind,sequence:clock,document:doc});return doc;}
  async function fetch(path,options) {
    calls.push({path,options});
    assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');
    if(state.networkError)throw Error('Network unavailable');
    const url=new URL(path,'https://study.example');
    if(url.pathname==='/api/config')return reply({enabled:true,loginUrl:'/auth/login'});
    if(!state.authenticated)return reply({error:'unauthenticated'},401);
    if(url.pathname==='/api/session')return reply({authenticated:true,user:{uid:'owner-123',email:'owner@example.test',emailVerified:true},csrfToken:'csrf-test',persistent:true,expiresAt:Date.now()+100000,vocabulary:{version:state.epoch,epoch:state.epoch,ready:state.epoch===1}});
    if(options.method==='POST')assert.equal(options.headers['X-CSRF-Token'],'csrf-test');
    if(url.pathname==='/api/logout'){state.authenticated=false;return reply(null,204);}
    if(url.pathname==='/api/vocabulary/bootstrap'){state.epoch=1;for(const [id,row] of records)if(row.kind!=='cards')records.delete(id);return reply({vocabulary:{version:1,epoch:1,ready:true,backupId:'unified-words-v1'}});}
    if(url.pathname!=='/api/logout' && options.headers['X-Chengci-Epoch']!==String(state.epoch))return reply({error:'vocabulary_epoch_changed'},409);
    if(url.pathname==='/api/sync') {
      if(state.writeStatus)return reply({error:'write denied'},state.writeStatus);
      const results=[];
      for(const op of JSON.parse(options.body).operations){
        let row=records.get(key(op.kind,op.id));
        if(row?.document.operationId===op.operationId)results.push({kind:op.kind,id:op.id,operationId:op.operationId,status:'accepted',document:row.document});
        else if((row?.document.revision||0)!==op.baseRevision)results.push({kind:op.kind,id:op.id,operationId:op.operationId,status:'conflict',document:row?.document||null});
        else {const document={schemaVersion:1,id:op.id,operationId:op.operationId,revision:op.baseRevision+1,deleted:op.deleted,updatedAt:op.updatedAt,data:op.data};row={kind:op.kind,sequence:++clock,document};records.set(key(op.kind,op.id),row);results.push({kind:op.kind,id:op.id,operationId:op.operationId,status:'accepted',document});}
      }
      if(state.loseAck){state.loseAck=false;throw Error('Lost acknowledgement');}
      return reply({epoch:state.epoch,results});
    }
    const kind=url.pathname.slice('/api/'.length), since=Number(url.searchParams.get('since')||0),until=Number(url.searchParams.get('until')||clock),cursor=Number(url.searchParams.get('cursor')||0);
    if(since>clock)return reply({error:'checkpoint_ahead'},409);
    const rows=[...records.values()].filter(row=>row.kind===kind&&row.sequence>Math.max(since,cursor)&&row.sequence<=until).sort((a,b)=>a.sequence-b.sequence);
    const page=rows.slice(0,state.pageSize);
    return reply({epoch:state.epoch,documents:page.map(row=>row.document),cursor:rows.length>page.length?String(page.at(-1).sequence):null,checkpoint:until});
  }
  return {state,records,calls,fetch,insert,get clock(){return clock;}};
}
function environment(online=true) {
  const storage=new Map(),events=new Map(),timers=new Map();let tid=0;
  return {crypto:webcrypto,console,location:{origin:'https://study.example'},navigator:{onLine:online},document:{visibilityState:'visible',addEventListener:(type,fn)=>events.set(type,fn)},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    addEventListener:(type,fn)=>events.set(type,fn),setTimeout:(fn,ms)=>{timers.set(++tid,{fn,ms});return tid;},clearTimeout:id=>timers.delete(id),events,timers};
}
async function setup(options={}) {
  const remote=options.remote||server(),env=environment(options.online!==false),adapter=options.adapter||memoryAdapter();
  const store=createStore({env,adapter,broadcast:false});await store.ready;
  const sync=createSync(store,{env,config:{enabled:options.enabled!==false,provider:'cloudflare',pollIntervalMs:15000},fetch:remote.fetch});await sync.ready;
  return {remote,env,adapter,store,sync};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('disabled configuration performs no network requests',async()=>{const t=await setup({enabled:false});await t.store.save({word:'敢'});await settle();assert.equal(t.remote.calls.length,0);assert.equal(t.sync.getState().status,'disabled');});
test('existing first-party session pulls paginated initial records and sends CSRF-protected local updates',async()=>{const remote=server();for(let i=0;i<5;i++)remote.insert('cards','card-'+i,{word:'詞'+i});const t=await setup({remote});assert.equal(t.store.list().length,5);const card=await t.store.save({word:'新語'});await t.sync.retry();assert.equal(t.store.get(card.id).syncStatus,'synced');assert.equal(remote.records.get('cards:'+card.id).document.data.word,'新語');});
test('initial authentication failure never redirects automatically; interactive connect requests login',async()=>{const remote=server();remote.state.authenticated=false;const t=await setup({remote});assert.equal(t.sync.getState().connected,false);assert.equal(t.sync.getState().status,'login-required');await assert.rejects(t.sync.connect(),e=>e.code==='LOGIN_REQUIRED');assert.equal(t.sync.loginUrl({rememberDevice:true}),'/auth/login?rememberDevice=1');});
test('expired auth preserves cached cards and new pending edits without pretending they are synced',async()=>{const t=await setup();const card=await t.store.save({word:'敢'});await t.sync.retry();t.remote.state.authenticated=false;await t.store.save({...card,meaning:'更新'});await settle();await t.sync.retry();assert.equal(t.sync.getState().connected,false);assert.equal(t.store.get(card.id).meaning,'更新');assert.notEqual(t.store.get(card.id).syncStatus,'synced');});
test('trusted-device offline reload retains cards and progress and makes zero requests',async()=>{const t=await setup();const card=await t.store.save({word:'敢'});await t.store.saveProgress(card.id,{result:'read',attempts:1,updatedAt:new Date().toISOString()});await t.sync.retry();const next=await setup({remote:t.remote,adapter:t.adapter,online:false});assert.equal(next.store.get(card.id).word,'敢');assert.equal(next.store.getProgress(card.id).result,'read');const before=t.remote.calls.length;await next.store.save({word:'離線'});await settle();assert.equal(t.remote.calls.length,before);next.env.navigator.onLine=true;await next.sync.retry();assert.equal(next.store.getState().pendingCount,0);});
test('network failure and lost acknowledgement retain pending content and retry idempotently',async()=>{const t=await setup();t.remote.state.loseAck=true;const card=await t.store.save({word:'不會丟失'});await settle();assert.ok(t.store.getState().pendingCount);const revision=t.remote.records.get('cards:'+card.id).document.revision;await t.sync.retry();assert.equal(t.store.get(card.id).syncStatus,'synced');assert.equal(t.remote.records.get('cards:'+card.id).document.revision,revision);});
test('delta checkpoints avoid full-deck polls and survive a trusted-device reload',async()=>{const remote=server();remote.insert('cards','card-one',{word:'原本'});const t=await setup({remote});remote.calls.length=0;await t.sync.retry();const reads=remote.calls.filter(call=>/^\/api\/(cards|progress|favorites|study)\?/.test(call.path));assert.ok(reads.length);assert.ok(reads.every(call=>new URL(call.path,'https://x').searchParams.get('since')==='1'));remote.insert('cards','card-two',{word:'後來'});await t.sync.retry();assert.equal(t.store.list().length,2);remote.calls.length=0;const next=await setup({remote,adapter:t.adapter});const nextCards=remote.calls.find(call=>call.path.startsWith('/api/cards?'));assert.equal(new URL(nextCards.path,'https://x').searchParams.get('since'),'2');assert.equal(next.store.list().length,2);});
test('concurrent remote change is an explicit conflict and old offline copies cannot overwrite it',async()=>{const t=await setup();const card=await t.store.save({word:'第一版'});await t.sync.retry();t.env.navigator.onLine=false;await t.store.save({...t.store.get(card.id),meaning:'本機修改'});t.remote.insert('cards',card.id,{word:'第一版',meaning:'另一台修改'});t.env.navigator.onLine=true;await t.sync.retry();assert.equal(t.store.get(card.id).syncStatus,'conflict');assert.equal(t.store.get(card.id).conflict.remote.meaning,'另一台修改');});
test('hidden app does not push queued changes and permission errors do not loop',async()=>{const t=await setup();t.env.document.visibilityState='hidden';const card=await t.store.save({word:'等一下'});await settle();assert.ok(!t.remote.records.has('cards:'+card.id));t.env.document.visibilityState='visible';t.remote.state.writeStatus=403;await t.sync.retry();assert.equal(t.sync.getState().status,'error');assert.equal(t.env.timers.size,0);assert.ok(t.store.getState().pendingCount);});
test('logout revokes the server session, stops timers, and preserves the local outbox',async()=>{const t=await setup();t.env.navigator.onLine=false;const card=await t.store.save({word:'尚未同步'});t.env.navigator.onLine=true;await t.sync.disconnect();assert.equal(t.remote.state.authenticated,false);assert.equal(t.env.timers.size,0);assert.equal(t.store.get(card.id).word,'尚未同步');assert.equal(t.sync.getState().connected,false);});
