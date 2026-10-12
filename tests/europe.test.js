import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {voyages,progress} from '../dist/voyages.js';
import {europeBoard as legacyBoard} from '../dist/europe-legacy.js';
import {axialDistance,HEX_RADIUS} from '../dist/europe.js';

function path(g,name){
 const target=Object.keys(g.board).find(k=>g.board[k].name===name),queue=[[g.pos]],seen=new Set([g.pos]);
 while(queue.length){const p=queue.shift(),k=p.at(-1);if(k===target)return p.slice(1);for(const n of g.board[k].links)if(!seen.has(n)){seen.add(n);queue.push([...p,n]);}}
 throw new Error('Destination inaccessible : '+name);
}
function visitKey(g,key){const name='test-target',old=g.board[key].name;g.board[key].name=name;visit(g,name);g.board[key].name=old;}
function visit(g,name){if(g.done)return;for(const k of path(g,name)){if(g.done)return;g.energy=10;assert(E.move(g,k),k);if(g.event)E.resolve(g);}}

// Find and actually ride a fresh contiguous terrain sequence. Do not teleport
// or fabricate the objective counters: every step goes through the game engine.
function rideRun(g,type,length){
 if(g.done)return;
 const excluded=new Set([...g.visited,...Object.values(g.board).filter(t=>t.id===g.arrivalId||t.id===0).map(t=>t.key)]);
 const chain=(keys)=>{
  if(keys.length===length)return keys;
  for(const k of g.board[keys.at(-1)].links)if(!excluded.has(k)&&!keys.includes(k)&&g.board[k].type===type){const found=chain([...keys,k]);if(found)return found;}
 };
 for(const t of Object.values(g.board)){
  if(t.type!==type||excluded.has(t.key))continue;
  const run=chain([t.key]);if(!run)continue;
  const forbidden=new Set(run.slice(1)),queue=[[g.pos]],seen=new Set([g.pos]);let entry;
  for(let i=0;i<queue.length;i++){const p=queue[i],k=p.at(-1);if(k===run[0]){entry=p.slice(1);break;}for(const n of g.board[k].links)if(!seen.has(n)&&!forbidden.has(n)){seen.add(n);queue.push([...p,n]);}}
  if(!entry)continue;
  for(const k of [...entry,...run.slice(1)]){if(g.done)return;g.energy=10;assert(E.move(g,k),k);if(g.event)E.resolve(g);}
  return;
 }
 throw new Error('No fresh connected terrain sequence: '+type+' × '+length);
}

test('fixed Europe has four terrains, reciprocal connections and real voyage endpoints',()=>{
 for(const v of voyages){const g=E.makeGame('gravel',5,v.id,'plateau');assert.equal(g.board[g.pos].name,v.from);assert.equal(Object.values(g.board).find(t=>t.id===g.arrivalId).name,v.to);assert.equal(g.phase,'move');assert.equal(g.hand.length,0);assert.equal(g.deck.length,0);assert.equal(g.board[g.pos].id,0);for(const [k,t] of Object.entries(g.board)){assert(['ville','plaine','montagne','cote'].includes(t.type));for(const n of t.links)assert(g.board[n].links.includes(k));}assert(!E.place(g,0,0,0));}
});
test('all five voyages can actually be completed by connected moves on Europe',()=>{
 const routes={traversee:['Lyon','Zurich','Venise','Marseille','Barcelone','Madrid','Lisbonne','Vienne','Zagreb','Bucarest','Istanbul'],soleil:['Marseille','Venise','Zurich','Vienne','Zagreb','Rome'],alpes:['Zurich','Vienne','Prague','Berlin','Vienne'],campagne:['Berlin','Varsovie','Budapest','Vienne','Prague'],nord:['Oslo','Bergen','Trondheim','Narvik','Cap Nord']};
 for(const [id,stops] of Object.entries(routes)){const g=E.makeGame('gravel',19,id,'plateau');
 rideRun(g,'plaine',5);rideRun(g,'montagne',4);rideRun(g,'cote',4);
 if(id==='nord')rideRun(g,'montagne',2);
 for(const name of stops)visit(g,name);assert(progress(g).ready,id+JSON.stringify(progress(g).rows));assert(g.voyageWon,id);assert(g.done);}
});
test('fixed movement, early arrival and saved mode preserve the rules',()=>{
 let g=E.makeGame('randonneur',8,'alpes','plateau');assert(!E.move(g,'city-Istanbul'));const neighbor=E.moves(g)[0];g.energy=0;assert(!E.move(g,neighbor.key));assert(E.recover(g,'rest'));g=JSON.parse(JSON.stringify(g));assert.equal(g.mode,'plateau');assert.equal(E.moves(g)[0].key,neighbor.key);visit(g,'Vienne');assert(!g.done);assert.equal(g.phase,'move');assert.equal(g.board[g.pos].name,'Vienne');assert(!g.hand.length);E.endTurn(g);assert.equal(g.phase,'move');
 const old=E.makeGame('gravel',1,'traversee');delete old.mode;assert.equal(old.phase,'place');assert(E.spots(old,old.hand[0]).length>0);
});

test('open land board allows branching, detours and returning, with no remote jumps',()=>{
 const g=E.makeGame('gravel',9,'traversee','plateau');
 assert(Object.keys(g.board).length>400);assert(E.moves(g).length>=3);
 const seen=new Set([g.pos]),q=[g.pos];for(let i=0;i<q.length;i++)for(const k of g.board[q[i]].links)if(!seen.has(k)){seen.add(k);q.push(k);}
 assert.equal(seen.size,Object.keys(g.board).length);
 const start=g.pos,neighbor=E.moves(g)[0];g.energy=10;assert(E.move(g,neighbor.key));if(g.event)E.resolve(g);assert(E.move(g,start));if(g.event)E.resolve(g);
 assert.equal(g.pos,start);assert.equal(g.visited.filter(k=>k===start).length,1);assert(!E.move(g,'city-Istanbul'));
 // Removing a local land link still leaves alternate paths.
 const a=g.board[start],b=neighbor;a.links=a.links.filter(k=>k!==b.key);b.links=b.links.filter(k=>k!==start);assert(path(g,'Istanbul').length>0);const target=Object.keys(g.board).find(k=>g.board[k]===b);visitKey(g,target);assert.equal(g.pos,target);
});
test('legacy board saves retain resources, scores, objectives and terrain history on the hex grid',()=>{
 const g=E.makeGame('gravel',9,'traversee','plateau'),map=legacyBoard('Paris','Istanbul');
 g.board=map.board;g.edges=map.edges;g.arrivalId=map.arrivalId;g.mapVersion=2;g.pos='route-0-0';
 g.travel=['city-Lyon','route-15-0','route-15-1','route-15-2','route-3-0','route-3-1',g.pos];
 g.visited=[map.start,...g.travel];g.energy=3;g.turn=12;g.points=18;
 const before=progress(g),score=E.score(g),count=E.visitedCount(g);
 assert(E.upgradePlateau(g));assert(g.board[g.pos]);assert.equal(g.energy,3);assert.equal(g.turn,12);assert.equal(g.mapVersion,3);
 assert.deepEqual(progress(g),before);assert.equal(E.score(g),score);assert.equal(E.visitedCount(g),count);
 const copy=JSON.parse(JSON.stringify(g));assert.equal(E.upgradePlateau(copy),false);assert.deepEqual(progress(copy),before);
 assert(Object.keys(g.board).some(k=>k.startsWith('hex-')));
 const current=g.pos,neighbor=E.moves(g)[0];g.energy=10;assert(E.move(g,neighbor.key));if(g.event)E.resolve(g);assert(E.move(g,current));if(g.event)E.resolve(g);
 assert.equal(g.travelHistory.length,9);
});

test('land movements join only six equal-size edge-sharing hex neighbours; ferries are explicit',()=>{
 const {board,edges}=E.makeGame('gravel',8,'traversee','plateau');
 for(const t of Object.values(board)){const local=t.links.filter(k=>!edges.some(e=>e.ferry&&[e.a,e.b].includes(t.key)&&[e.a,e.b].includes(k)));assert(local.length<=6);}
 for(const e of edges)if(!e.ferry){const a=board[e.a],b=board[e.b];assert.equal(axialDistance(a,b),1);assert(Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-Math.sqrt(3)*HEX_RADIUS)<1e-8);}
});
