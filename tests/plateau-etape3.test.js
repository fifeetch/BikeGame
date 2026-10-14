import {test} from 'node:test';
import assert from 'node:assert/strict';
import {europeBoard,FERRY_ROUTES,MAP_WIDTH,MAP_HEIGHT} from '../dist/europe.js';
import {MAP_CELLS} from '../dist/assets/europe/board-data.js';
import {DECOR} from '../dist/assets/europe/decor-data.js';
import {roadNetwork} from '../dist/board-roads.js';
import {createCamera} from '../dist/board-camera.js';
import {voyages} from '../dist/voyages.js';

const reach=(board,from)=>{const seen=new Set([from]),queue=[from];while(queue.length){const k=queue.shift();for(const n of board[k].links)if(!seen.has(n)){seen.add(n);queue.push(n);}}return seen;};

test('drawn roads only follow links that already exist between neighbouring land cells',()=>{
 const {board}=europeBoard('Paris','Istanbul'),net=roadNetwork(board,{villages:DECOR.villages.map(v=>[v[3],v[4]])});
 assert(net.main.size>100,'grandes routes dessinées');
 for(const edge of [...net.main,...net.minor]){const [a,b]=edge.split('|');assert(board[a].links.includes(b),`${a} → ${b} n'est pas une liaison existante`);assert.notEqual(board[a].type,'mer');assert.notEqual(board[b].type,'mer');}
});

test('ferries link real port cities, never through land, and every voyage stays possible',()=>{
 const {board,edges}=europeBoard('Paris','Istanbul'),ferries=edges.filter(e=>e.ferry);
 assert.deepEqual(ferries.map(e=>[board[e.a].name,board[e.b].name]),FERRY_ROUTES);
 for(const e of ferries)for(const k of [e.a,e.b]){const t=board[k];assert.equal(t.type,'ville');}
 // L'Angleterre est une île : Londres ne rejoint Bruxelles que par le ferry Calais–Douvres.
 const noFerry=structuredClone(board);for(const e of ferries){noFerry[e.a].links=noFerry[e.a].links.filter(k=>k!==e.b);noFerry[e.b].links=noFerry[e.b].links.filter(k=>k!==e.a);}
 assert(!reach(noFerry,'city-Londres').has('city-Bruxelles'));assert(reach(board,'city-Londres').has('city-Bruxelles'));
 for(const v of voyages){const b=europeBoard(v.from,v.to),arrival=Object.values(b.board).find(t=>t.id===b.arrivalId);assert(reach(b.board,b.start).has(arrival.key),`${v.from} → ${v.to}`);}
});

test('map corrections: no broken city names, the Black Sea is closed and the east edge is land',()=>{
 const names=MAP_CELLS.filter(c=>c.name).map(c=>c.name);
 assert(names.includes('Saint-Pétersbourg')&&names.includes('Athènes'));assert(!names.some(n=>n.includes('Ã')||n==='nes'));
 const eastSea=MAP_CELLS.filter(c=>c.type==='mer'&&c.x>1215&&c.r>=5&&c.r<=26);assert.equal(eastSea.length,0);
});

test('decor is purely visual and sits on land cells of the base map',()=>{
 const land=new Set(MAP_CELLS.filter(c=>c.type!=='mer').map(c=>`${c.q},${c.r}`));
 for(const [,, , ,q,r]of DECOR.forests)assert(land.has(`${q},${r}`));
 for(const [,,,q,r]of DECOR.villages)assert(land.has(`${q},${r}`));
 for(const river of DECOR.rivers)for(const [,,q,r]of river.points)assert(land.has(`${q},${r}`),river.name);
});

test('camera keeps the map on screen, zooms within limits and centres a requested point',()=>{
 const world={style:{}},viewport={clientWidth:800,clientHeight:500,listeners:{},addEventListener(t,f){this.listeners[t]=f;},removeEventListener(t){delete this.listeners[t];}};
 const cam=createCamera(world,{width:MAP_WIDTH,height:MAP_HEIGHT,reduced:()=>true});cam.attach(viewport);
 cam.focus(350,420,{scale:2,animate:false});let v=cam.view();assert.equal(v.scale,2);assert(Math.abs((v.left+v.right)/2-350)<1e-6);
 cam.focus(0,0,{scale:2,animate:false});v=cam.view();assert(v.left>=-28/2-1e-6&&v.top>=-28/2-1e-6,'pas au-delà du bord haut-gauche');
 cam.setScale(99);assert.equal(cam.view().scale,6);cam.setScale(.01);assert(cam.view().scale<1&&cam.view().scale>=.35);
 v=cam.view();assert(v.left<=0&&v.right>=MAP_WIDTH-1e-6,'vue éloignée : toute la largeur visible');
 cam.destroy();assert.deepEqual(Object.keys(viewport.listeners),[]);
});
