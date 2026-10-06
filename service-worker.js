const CACHE_NAME = 'chengci-v6-10-1-offline';
const APP_VERSION = '6.10.1';
const OFFLINE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/recall-cards.js',
  './sync-config.js',
  './js/card-store.js',
  './js/cloudflare-sync.js',
  './js/study-sync.js',
  './js/auth-handoff.js',
  './js/legacy-migration.js',
  './js/migration-ui.js',
  './js/personal-cards.js',
  './js/shortcut-export.js',
  './js/data-model.js',
  './data/words.js',
  './data/zhuyin-dict.js',
  './js/zhuyin-lite.js',
  './js/speech-recognition.js',
  './manifest.json',
  './assets/icon.svg',
  './version.json',
  './CHANGELOG.md'
];
const APP_BASE_URL = self.registration?.scope || self.location?.href || location.href;
const OFFLINE_PATHS = new Set(OFFLINE_ASSETS.map(asset => new URL(asset, APP_BASE_URL).pathname));

async function assetHash(response) {
  const digest=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer());
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
async function installAppAssets() {
  const cache=await caches.open(CACHE_NAME);
  let revisions;
  try {
    if(typeof crypto==='undefined' || !crypto.subtle)throw new Error('No digest support');
    const manifest=await fetch('./asset-revisions.json',{cache:'no-store'});
    if(!manifest.ok || manifest.redirected)throw new Error('No revision manifest');
    revisions=await manifest.json();
    if(!revisions || Array.isArray(revisions) || OFFLINE_ASSETS.some(asset=>!/^[a-f0-9]{64}$/.test(revisions[asset] || '')))throw new Error('Incomplete revision manifest');
  } catch(error) {
    // Compatibility for an old static deployment without the optional manifest.
    await cache.addAll(OFFLINE_ASSETS);
    return;
  }
  const sources=[];
  for(const name of await caches.keys()){
    if(!name.startsWith('chengci-'))continue;
    const previous=await caches.open(name);
    try{const manifest=await previous.match('./asset-revisions.json');if(manifest)sources.push({cache:previous,revisions:await manifest.json()});}catch(error){}
  }
  for(const asset of OFFLINE_ASSETS){
    const expected=revisions[asset];
    let response=null;
    for(const source of sources){
      if(source.revisions[asset]!==expected)continue;
      const cached=await source.cache.match(asset,{ignoreSearch:true});
      if(cached && cached.ok && await assetHash(cached)===expected){response=cached;break;}
    }
    if(!response){
      response=await fetch(asset,{cache:'no-store'});
      if(!response.ok || response.redirected || await assetHash(response)!==expected)throw new Error('App update verification failed');
    }
    await cache.put(asset,response);
  }
  await cache.put('./asset-revisions.json',new Response(JSON.stringify(revisions),{headers:{'Content-Type':'application/json'}}));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    installAppAssets()
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('chengci-') && key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== location.origin) return;
  // Only public application assets belong in the PWA cache. Future same-origin
  // sync/auth APIs must never persist personal data on a memory-only device.
  const isPublicAsset = OFFLINE_PATHS.has(requestUrl.pathname);
  if (!isPublicAsset) return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(event.request,{ignoreSearch:true});
    // Installed app files stay local. Only the small release information needs
    // a fresh request; a new service-worker version installs changed app assets.
    const releaseInfo=/\/(version\.json|CHANGELOG\.md)$/.test(requestUrl.pathname);
    if(cached && !releaseInfo)return cached;
    try{
      const response=await fetch(event.request, {cache:'no-store'});
      if(response && response.ok && !response.redirected && isPublicAsset){
        const copy=response.clone();
        // Don't retain authentication or other query parameters in cache keys.
        await cache.put(requestUrl.origin + requestUrl.pathname, copy);
      }
      return response;
    }catch(e){
      // HTML uses versioned URLs, while installation precaches unversioned assets.
      // Only this release's cache may satisfy them; never return HTML as JavaScript.
      if(cached)return cached;
      if(event.request.mode==='navigate'){
        const page=await cache.match('./index.html');
        if(page)return page;
      }
      return new Response('Offline asset unavailable',{status:503});
    }
  })());
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'GET_VERSION' && event.source) {
    event.source.postMessage({type:'APP_VERSION', version:APP_VERSION});
  }
});
