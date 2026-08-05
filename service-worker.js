const CACHE_NAME = 'chengci-v6-5-0-offline';
const APP_VERSION = '6.5.0';
const OFFLINE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data-model.js',
  './data/words.js',
  './data/zhuyin-dict.js',
  './js/zhuyin-lite.js',
  './manifest.json',
  './assets/icon.svg',
  './version.json',
  './CHANGELOG.md'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== location.origin) return;

  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request, {cache:'no-store'});
      if(response && response.ok){
        const copy=response.clone();
        const cache=await caches.open(CACHE_NAME);
        await cache.put(event.request, copy);
      }
      return response;
    }catch(e){
      return (await caches.match(event.request)) || (await caches.match('./index.html'));
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
