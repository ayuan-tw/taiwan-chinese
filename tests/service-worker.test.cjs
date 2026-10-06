const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

(async () => {
  const base = 'https://ayuan-tw.github.io/taiwan-chinese/';
  const handlers = new Map();
  const saved = new Map();
  const deleted = [];
  let precached = [];
  let online = false;
  let networkCalls = 0;
  const absolute = value => new URL(typeof value === 'string' ? value : value.url, base);
  const cache = {
    async addAll(paths) {precached = paths;},
    async put(request, response) {saved.set(absolute(request).href, response);},
    async match(request, options = {}) {
      const requested = absolute(request);
      for (const [key, response] of saved) {
        const cached = absolute(key);
        if (options.ignoreSearch ? cached.origin === requested.origin && cached.pathname === requested.pathname : cached.href === requested.href) return response.clone();
      }
    }
  };
  const context = {
    self: {registration:{scope:base},location:{href:base+'service-worker.js'},addEventListener:(type, cb)=>handlers.set(type,cb),skipWaiting:async()=>{},clients:{claim:async()=>{}}},
    caches: {open:async()=>cache,keys:async()=>['chengci-v6-9-4-offline','chengci-v6-10-0-offline','chengci-v6-10-1-offline','chengci-v6-10-2-offline','chengci-v6-11-0-offline','chengci-v6-12-0-offline','another-app'],delete:async key=>{deleted.push(key);}},
    location: {origin:new URL(base).origin}, URL, Response,
    fetch:async()=>{networkCalls++;if(!online)throw Error('offline');return new Response('network body');}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../service-worker.js'),'utf8'),context);
  let work;
  handlers.get('install')({waitUntil:promise=>{work=promise;}});await work;
  assert.ok(precached.includes('./js/recall-cards.js'));
  handlers.get('activate')({waitUntil:promise=>{work=promise;}});await work;
  assert.deepEqual(deleted,['chengci-v6-9-4-offline','chengci-v6-10-0-offline','chengci-v6-10-1-offline','chengci-v6-10-2-offline','chengci-v6-11-0-offline']);
  const dispatch = async (url, mode = 'cors', method = 'GET') => {
    let response;
    handlers.get('fetch')({request:{url,method,mode},respondWith(value){response=value;}});
    return response && await response;
  };
  saved.set(base+'js/recall-cards.js',new Response('recall script'));
  saved.set(base+'index.html',new Response('<html>app</html>'));
  let response=await dispatch(base+'js/recall-cards.js?v=6.12.0');
  assert.equal(await response.text(),'recall script','versioned requests use same-release unversioned precache');
  response=await dispatch(base+'js/missing.js?v=6.12.0');
  assert.equal(response,undefined,'unknown paths are not cached or answered with HTML');
  response=await dispatch(base+'css/style.css?v=6.12.0');
  assert.equal(response.status,503,'missing known assets never receive HTML');
  assert.equal(await dispatch(base+'api/cards'),undefined,'private API reads bypass service worker caching');
  assert.equal(await dispatch(base+'cdn-cgi/access/login'),undefined,'auth endpoints bypass service worker caching');
  response=await dispatch(base+'auth/login','navigate');
  assert.equal(response,undefined,'auth navigation is never intercepted by the PWA');
  response=await dispatch(base+'index.html','navigate');
  assert.equal(await response.text(),'<html>app</html>');
  assert.equal(await dispatch('https://another.example/data'),undefined,'other origins untouched');
  assert.equal(await dispatch(base+'data','cors','POST'),undefined,'writes untouched');
  online=true;const before=networkCalls;response=await dispatch(base+'js/recall-cards.js?v=6.12.0');
  assert.equal(await response.text(),'recall script');
  assert.equal(networkCalls,before,'normal app reload reads cached assets without redownloading');
  response=await dispatch(base+'version.json?t=123');
  assert.equal(await response.text(),'network body');
  assert.equal(networkCalls,before+1,'only small version info is refreshed');
  assert.ok(saved.has(base+'js/recall-cards.js'));
  assert.ok(!saved.has(base+'js/recall-cards.js?v=6.12.0'),'queries are not persisted as cache keys');
  console.log('Service-worker tests passed: asset precache, versioned offline lookup, navigation fallback, missing assets, cache isolation, online refresh.');
})();
