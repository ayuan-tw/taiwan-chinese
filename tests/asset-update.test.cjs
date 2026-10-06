const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createHash,webcrypto}=require('node:crypto');
const source=fs.readFileSync(require('node:path').join(__dirname,'../service-worker.js'),'utf8');
const hash=text=>createHash('sha256').update(text).digest('hex');
function setup({corruptOld=false,corruptNew=false}={}){
  const listeners=new Map(),collections=new Map(),requested=[];
  const base='https://study.example/';
  const key=input=>new URL(typeof input==='string'?input:input.url,base).pathname;
  function cache(name){
    if(!collections.has(name))collections.set(name,new Map());
    const values=collections.get(name);
    return {async match(input){return values.get(key(input))?.clone();},async put(input,response){values.set(key(input),response.clone());},async addAll(paths){for(const path of paths)await this.put(path,new Response(bodies[path]));}};
  }
  let skipped=false;
  const context={crypto:webcrypto,Response,URL,Uint8Array,location:{origin:new URL(base).origin,href:base+'service-worker.js'},self:{registration:{scope:base},location:{href:base+'service-worker.js'},addEventListener:(type,fn)=>listeners.set(type,fn),skipWaiting:async()=>{skipped=true;}},caches:{open:async name=>cache(name),keys:async()=>[...collections.keys()]}};
  vm.createContext(context);vm.runInContext(source+'\nglobalThis.testAssets=OFFLINE_ASSETS;globalThis.testCacheName=CACHE_NAME;',context);
  const bodies=Object.fromEntries(context.testAssets.map(asset=>[asset,'public bytes '+asset]));
  const revisions=Object.fromEntries(Object.entries(bodies).map(([asset,body])=>[asset,hash(body)]));
  const oldRevisions={...revisions};oldRevisions['./css/style.css']=hash('old css');
  const previous=cache('chengci-previous-version');
  for(const [asset,body] of Object.entries(bodies))collections.get('chengci-previous-version').set(key(asset),new Response(asset==='./css/style.css'?'old css':corruptOld&&asset==='./data/zhuyin-dict.js'?'tampered':body));
  collections.get('chengci-previous-version').set('/asset-revisions.json',new Response(JSON.stringify(oldRevisions)));
  context.fetch=async path=>{requested.push(path);if(path==='./asset-revisions.json')return new Response(JSON.stringify(revisions));return new Response(corruptNew&&path==='./css/style.css'?'unexpected changed bytes':bodies[path]);};
  return {requested,cache,name:context.testCacheName,skipped:()=>skipped,async install(){let promise;listeners.get('install')({waitUntil:value=>{promise=value;}});return promise;}};
}
test('app update downloads only changed public files and reuses byte-verified dictionary',async()=>{
  const t=setup();await t.install();
  assert.deepEqual(t.requested,['./asset-revisions.json','./css/style.css']);
  assert.equal(await (await t.cache(t.name).match('./data/zhuyin-dict.js')).text(),'public bytes ./data/zhuyin-dict.js');
  assert.equal(t.skipped(),true);
});
test('tampered cached bytes are fetched again even when old metadata claims same hash',async()=>{
  const t=setup({corruptOld:true});await t.install();assert.ok(t.requested.includes('./data/zhuyin-dict.js'));
});
test('mismatched update bytes never activate a mixed app version',async()=>{
  const t=setup({corruptNew:true});await assert.rejects(t.install(),/verification/);assert.equal(t.skipped(),false);assert.ok(await t.cache('chengci-previous-version').match('./index.html'));
});
