const CACHE='aventure-velo-v39-travel-menu';
const FILES=['./','./index.html','./style.css','./app.js','./card-editor.js','./event-cards.js','./event-card-engine.js','./event-card-ui.js','./engine.js','./simulator.js','./europe.js','./europe-map.js','./map-library.js','./cards.js','./rules.js','./voyages.js','./tile-art.js','./assets/europe/board-data.js','./assets/europe/nouvelle-carte.png','./assets/voyages/cards.png','./assets/voyages/atlantique-alpes.png','./assets/voyages/routes-est.png','./assets/voyages/balkans.png','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png'];
FILES.push('./style.css?v=travel-menu-1','./app.js?v=travel-menu-1','./europe-map.js?v=visual-1');
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).origin===self.location.origin)e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
