const CACHE='aventure-velo-v17-parcours-main-limitee';
const FILES=['./','./index.html','./style.css','./app.js','./engine.js','./simulator.js','./europe.js','./europe-map.js','./cards.js','./rules.js','./voyages.js','./tile-art.js','./assets/europe/board-data.js','./assets/europe/nouvelle-carte.png','./assets/voyages/cards.png','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).origin===self.location.origin)e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
