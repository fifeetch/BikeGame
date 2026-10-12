import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {voyages,progress} from '../dist/voyages.js';

function path(g,name){
 const target=Object.keys(g.board).find(k=>g.board[k].name===name),queue=[[g.pos]],seen=new Set([g.pos]);
 while(queue.length){const p=queue.shift(),k=p.at(-1);if(k===target)return p.slice(1);for(const n of g.board[k].links)if(!seen.has(n)){seen.add(n);queue.push([...p,n]);}}
 throw new Error('Destination inaccessible : '+name);
}
function visit(g,name){for(const k of path(g,name)){g.energy=10;assert(E.move(g,k),k);if(g.event)E.resolve(g);}}

test('fixed Europe has four terrains, reciprocal connections and real voyage endpoints',()=>{
 for(const v of voyages){const g=E.makeGame('gravel',5,v.id,'plateau');assert.equal(g.board[g.pos].name,v.from);assert.equal(Object.values(g.board).find(t=>t.id===g.arrivalId).name,v.to);assert.equal(g.phase,'move');assert.equal(g.hand.length,0);assert.equal(g.deck.length,0);assert.equal(g.board[g.pos].id,0);for(const [k,t] of Object.entries(g.board)){assert(['ville','plaine','montagne','cote'].includes(t.type));for(const n of t.links)assert(g.board[n].links.includes(k));}assert(!E.place(g,0,0,0));}
});
test('all five voyages can actually be completed by connected moves on Europe',()=>{
 const routes={traversee:['Lyon','Zurich','Venise','Marseille','Barcelone','Madrid','Lisbonne','Vienne','Zagreb','Bucarest','Istanbul'],soleil:['Marseille','Venise','Zurich','Vienne','Zagreb','Rome'],alpes:['Zurich','Vienne','Prague','Berlin','Vienne'],campagne:['Berlin','Varsovie','Budapest','Vienne','Prague'],nord:['Oslo','Bergen','Trondheim','Narvik','Cap Nord']};
 for(const [id,stops] of Object.entries(routes)){const g=E.makeGame('gravel',19,id,'plateau');for(const name of stops)visit(g,name);assert(progress(g).ready,id+JSON.stringify(progress(g).rows));assert(g.voyageWon,id);assert(g.done);}
});
test('fixed movement, early arrival and saved mode preserve the rules',()=>{
 let g=E.makeGame('randonneur',8,'alpes','plateau');assert(!E.move(g,'city-Istanbul'));const neighbor=E.moves(g)[0];g.energy=0;assert(!E.move(g,neighbor.key));assert(E.recover(g,'rest'));g=JSON.parse(JSON.stringify(g));assert.equal(g.mode,'plateau');assert.equal(E.moves(g)[0].key,neighbor.key);visit(g,'Vienne');assert(!g.done);assert.equal(g.phase,'move');assert.equal(g.board[g.pos].name,'Vienne');assert(!g.hand.length);E.endTurn(g);assert.equal(g.phase,'move');
 const old=E.makeGame('gravel',1,'traversee');delete old.mode;assert.equal(old.phase,'place');assert(E.spots(old,old.hand[0]).length>0);
});
