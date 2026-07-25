const CACHE_NAME = 'chengci-v5-5-2-offline';
const OFFLINE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './words.js',
  './zhuyin-dict.js',
  './zhuyin-lite.js',
  './manifest.json',
  './icon.svg'
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
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
