const CACHE='aventure-velo-v22-france-textures';
const FRANCE_TEXTURES=['cote','mer','montagne','moyenne_montagne','plaine','ville'].flatMap(type=>Array.from({length:8},(_,i)=>`./assets/france/textures/${type}-${i}.webp`));
const FILES=['./','./index.html','./style.css','./app.js','./engine.js','./simulator.js','./europe.js','./europe-map.js','./cards.js','./rules.js','./voyages.js','./tile-art.js','./assets/europe/board-data.js','./assets/europe/nouvelle-carte.png','./assets/voyages/cards.png','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png',...FRANCE_TEXTURES];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).origin===self.location.origin)e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
