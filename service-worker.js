const CACHE="preparation-debits-v17";
const FILES=["./","./index.html","./styles.css","./manifest.webmanifest","./assets/icon.svg","./src/main.js","./src/formulas.js","./src/calculation.js","./src/cutlist.js","./src/configuration.js","./src/settings-editor.js","./src/settings-store.js","./data/regles-calcul.json"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match("./index.html"))))});
