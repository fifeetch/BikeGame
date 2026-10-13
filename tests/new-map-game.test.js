import test from 'node:test';
import assert from 'node:assert/strict';
import {europeBoard,MAP_VERSION,HEX_RADIUS,hexVertices,axialDistance} from '../dist/europe.js';
import * as S from '../dist/simulator.js';
import {CLASSIC,clone} from '../dist/rules.js';

const roster=[{name:'Alice',bike:'gravel',voyage:'traversee',items:['tente','rechaud','kit']},{name:'Bob',bike:'randonneur',voyage:'nord'}];
const match=()=>S.createMatch(roster,'plateau',CLASSIC,123);

test('supplied map has one regular hit hex per cell, medium mountain, and city anchors',()=>{
 const {board,edges}=europeBoard('Paris','Istanbul'),cells=Object.values(board);
 assert.equal(MAP_VERSION,4);assert(cells.length>700);
 assert(cells.some(t=>t.type==='moyenne_montagne'));
 assert.equal(board['city-Copenhague'].name,'Copenhague');
 for(const t of cells){const v=hexVertices(t);assert.equal(v.length,6);for(const [x,y] of v)assert(Math.abs(Math.hypot(x-t.x,y-t.y)-HEX_RADIUS)<1e-8);}
 assert(edges.some(e=>e.ferry&&[e.a,e.b].includes('city-Oslo')&&[e.a,e.b].includes('city-Copenhague')));
 for(const e of edges.filter(e=>!e.ferry))assert.equal(axialDistance(board[e.a],board[e.b]),1);
 const seen=new Set(['city-Paris']),todo=['city-Paris'];while(todo.length){for(const k of board[todo.shift()].links)if(!seen.has(k)){seen.add(k);todo.push(k);}}
 for(const t of cells.filter(t=>t.name))assert(seen.has(t.key),t.name+' is isolated');
});
test('setup equipment respects prices, capacity and grants three cards',()=>{
 const m=match(),p=S.player(m);assert.equal(p.money,1);assert.equal(S.inventorySpace(m),4);assert.equal(p.cardHand.length,3);
 assert.throws(()=>S.createMatch([{...roster[0],items:['tente','duvet','kit']}],'plateau',CLASSIC,1));
});
test('route is atomic, limited to five, excludes ferry, and pays each cell',()=>{
 const m=match(),p=S.player(m),a=S.moves(m)[0];assert(a);
 const before=p.energy;assert(S.routeCheck(m,[a.key]).ok);assert(S.executeRoute(m,[a.key]));assert.equal(m.moved,1);assert.equal(p.energy,before-S.cost(m,a));
 assert(!S.routeCheck(m,Array(6).fill(a.key)).ok);
});
test('ferry is paid, requires confirmation API and ends the day with draw choice',()=>{
 const m=S.createMatch([{name:'A',bike:'gravel',voyage:'nord'}],'plateau',CLASSIC,1),p=S.player(m);
 assert.equal(p.pos,'city-Copenhague');assert(S.ferryOptions(m).some(t=>t.key==='city-Oslo'));
 assert(!S.moves(m).some(t=>t.key==='city-Oslo'));assert(!S.move(m,'city-Oslo'));
 assert(S.travelFerry(m,'city-Oslo'));assert.equal(p.pos,'city-Oslo');assert.equal(p.money,2);assert.equal(m.phase,'card-choice');
 assert.equal(m.cardChoices.length,2);assert(S.chooseCard(m,0));assert.equal(p.cardHand.length,4);
});
test('flat card hits another player on their next day; kit repairs, no kit returns to city',()=>{
 const m=match();m.players[0].cardHand.push('crevaison');assert(S.playCard(m,m.players[0].cardHand.length-1,'p2'));assert(m.players[1].flat);
 assert(S.endTurn(m));assert(S.chooseCard(m,0));assert.equal(m.activeIndex,1);assert.equal(m.phase,'puncture');
 assert(S.repairPuncture(m));assert.equal(m.players[1].flat,false);assert.equal(m.phase,'card-choice');
 const p=m.players[1];assert.equal(p.pos,p.lastCity);
});
test('food outside towns requires stove and terrain/ferry costs are configurable',()=>{
 const r=clone(CLASSIC);r.terrain.moyenne_montagne=4;r.ferryPrice=1;
 const m=S.createMatch([{...roster[0],items:[]}],'plateau',r,2),p=S.player(m);const tile=Object.values(m.board).find(t=>t.type==='moyenne_montagne');assert.equal(S.cost(m,tile),4);
 p.pos=tile.key;p.energy=3;assert(!S.eat(m));p.items.push('rechaud');assert(S.eat(m));
});
