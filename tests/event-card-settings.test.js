import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import * as C from '../dist/event-card-engine.js';
import {CLASSIC,clone,validateRules} from '../dist/rules.js';

const solo=[{name:'Solo',bike:'gravel',voyage:'traversee'}];
const pair=[...solo,{name:'Bob',bike:'gravel',voyage:'soleil'}];
const rules=options=>{const r=clone(CLASSIC);Object.assign(r.eventCards,options);return r;};
const game=(options={},seed=29)=>S.createMatch(solo,'plateau',rules({startingHand:0,...options}),seed);
function drawNext(m,ids){for(const id of ids){const i=m.eventDeck.indexOf(id);assert(i>=0,id);m.eventDeck.splice(i,1);}m.eventDeck.push(...[...ids].reverse());}
function settle(m){let guard=0;while(m.pendingAttack){assert(++guard<12);assert(S.resolveEventAttack(m,{bonusIndex:0,resource:'food'}));}}
function conserved(m){const ids=[...m.eventDeck,...m.eventDiscard,...m.cardChoices,...m.soloEventQueue,...(m.pendingAttack?[m.pendingAttack.cardId]:[]),...m.players.flatMap(p=>[...p.cardHand,...p.bonusCards,...p.pendingEffects.map(e=>e.cardId)])];assert.equal(ids.length,m.eventCardIds.length);assert.equal(new Set(ids).size,ids.length);S.load(S.serialize(m));}

test('defaults include forty cards, shuffle each fresh game and draw three at the start',()=>{
 const games=Array.from({length:5},()=>S.createMatch(solo));
 for(const m of games){assert.equal(m.eventDeck.length,37);assert.equal(m.eventCardIds.length,40);assert.equal(m.players[0].cardHand.length+m.soloEventQueue.length+(m.pendingAttack?1:0),3);conserved(m);}
 assert(new Set(games.map(m=>m.eventDeck.join(','))).size>1);
 const a=S.createMatch(pair,'plateau',CLASSIC,79),b=S.createMatch(pair,'plateau',CLASSIC,79);assert.deepEqual(a.eventDeck,b.eventDeck);
});

test('custom composition, initial deal, turn draws and limits survive save/load',()=>{
 const r=rules({startingHand:5,handLimit:6,bonusLimit:4,drawPerTurn:4,shuffle:false,categories:{positive:true,negative:false,climatic:false,permanent:true}});
 const m=S.createMatch(pair,'plateau',r,1);assert.equal(m.eventCardIds.length,20);assert.equal(m.eventDeck.length,10);assert.equal(m.players[0].cardHand.length,5);assert.equal(m.players[0].cardHand[0],'evt-01');
 assert(S.endTurn(m));assert.equal(m.cardChoices.length,4);assert(S.chooseCard(m,3));
 assert.equal(m.players[0].cardHand.length,6);assert.equal(m.activeIndex,1);const loaded=S.load(S.serialize(m));assert.deepEqual(loaded.rules.eventCards,r.eventCards);conserved(loaded);
 assert.throws(()=>validateRules(rules({handLimit:2})));
 assert.throws(()=>validateRules(rules({bonusLimit:1.5})));
 assert.throws(()=>validateRules(rules({categories:{positive:false,negative:false,climatic:false,permanent:false}})));
 assert.throws(()=>S.createMatch(pair,'plateau',rules({startingHand:6,handLimit:6,categories:{positive:true,negative:false,climatic:false,permanent:false}}),1));
});

test('four permanent slots can be occupied and a fifth requires a chosen replacement',()=>{
 const m=game({bonusLimit:4,handLimit:5});const p=m.players[0];
 for(const id of ['evt-31','evt-32','evt-33','evt-34','evt-35']){m.eventDeck.splice(m.eventDeck.indexOf(id),1);p.cardHand.push(id);}
 for(let n=0;n<4;n++){assert(S.playCard(m,0,p.id));m.turn++;}
 assert.equal(p.bonusCards.length,4);assert(!S.playCard(m,0,p.id));assert(S.playCard(m,0,p.id,2));assert.deepEqual(p.bonusCards,['evt-31','evt-32','evt-34','evt-35']);assert(m.eventDiscard.includes('evt-33'));conserved(m);
 assert.throws(()=>S.updateRules(m,rules({bonusLimit:2})));
});

test('end-turn solo draws resolve negatives before keeping one beneficial card and advancing',()=>{
 const m=game();drawNext(m,['evt-17','evt-05']);assert(S.endTurn(m));
 assert.equal(m.turn,1);assert.equal(m.pendingAttack.cardId,'evt-17');assert.deepEqual(m.cardChoices,['evt-05']);
 assert(!S.chooseCard(m,0));assert(!S.eat(m));assert(!S.endTurn(m));conserved(m);
 assert(S.resolveEventAttack(m,{}));assert.equal(m.players[0].energy,6);assert.equal(m.turn,1);
 assert(S.chooseCard(m,0));assert.equal(m.turn,2);assert.deepEqual(m.players[0].cardHand,['evt-05']);conserved(m);
});

test('two adverse draws both activate and do not leave a dead-end choice screen',()=>{
 const m=game();drawNext(m,['evt-17','evt-19']);assert(S.endTurn(m));assert.equal(m.soloEventQueue.length,1);conserved(m);
 assert(S.resolveEventAttack(m,{}));assert.equal(m.turn,1);conserved(m);
 assert(S.resolveEventAttack(m,{}));assert.equal(m.turn,2);assert.equal(m.phase,'move');assert.equal(m.players[0].energy,6);assert.equal(m.players[0].food,2);conserved(m);
});

test('solo weather is stored on draw, can be defended, and affects the next route once',()=>{
 const m=game();drawNext(m,['evt-21','evt-05']);assert(S.endTurn(m));settle(m);assert.equal(m.players[0].pendingEffects[0].kind,'solo_weather');
 assert(S.chooseCard(m,0));const p=m.players[0],key=m.board[p.pos].links.find(k=>m.board[k].type!=='mer');
 const base=S.cost(m,m.board[key]),before=p.energy;assert(S.beginEventRoute(m,[key]).ok);assert.equal(p.energy,before-base-2);assert.equal(p.pendingEffects.length,0);assert(m.eventDiscard.includes('evt-21'));conserved(m);
 const defended=game();drawNext(defended,['evt-07','evt-05']);assert(S.endTurn(defended));assert(S.chooseCard(defended,0));
 drawNext(defended,['evt-25','evt-04']);assert(S.endTurn(defended));assert(S.defendEventAttack(defended));assert.equal(defended.players[0].pendingEffects.length,0);assert(S.chooseCard(defended,0));conserved(defended);
});

test('solo terrain-specific weather expires harmlessly on an unrelated route',()=>{
 const m=game();drawNext(m,['evt-25','evt-05']);assert(S.endTurn(m));settle(m);assert(S.chooseCard(m,0));const p=m.players[0],key=m.board[p.pos].links.find(k=>m.board[k].type!=='mer');m.board[key].type='plaine';
 assert(S.beginEventRoute(m,[key]).ok);assert.equal(p.energy,7);assert.equal(p.pendingEffects.length,0);assert(m.eventDiscard.includes('evt-25'));conserved(m);
});

test('a solo storm stops movement for that day rather than disappearing on a retry',()=>{
 const m=game();drawNext(m,['evt-23','evt-05']);assert(S.endTurn(m));settle(m);assert(S.chooseCard(m,0));const p=m.players[0],start=p.pos,key=m.board[p.pos].links.find(k=>m.board[k].type!=='mer');
 assert(S.beginEventRoute(m,[key]).ok);assert.equal(p.pos,start);assert.equal(p.energy,8);assert.equal(S.moves(m).length,0);assert(!S.beginEventRoute(m,[key]).ok);conserved(m);
});

test('forty-card solo games preserve every card through repeated draws, events and reshuffles',()=>{
 for(let seed=1;seed<=15;seed++){const m=S.createMatch(solo,'plateau',CLASSIC,seed);settle(m);conserved(m);
  for(let turn=0;turn<25;turn++){/* crevaison, casse, chute : réparer au début du tour (règle de Fi) */if(m.phase==='puncture')assert(S.repairPuncture(m));else assert(S.endTurn(m));conserved(m);settle(m);if(m.phase==='card-choice')assert(S.chooseCard(m,0));if(m.phase==='card-discard')assert(S.discardEventHand(m,0));conserved(m);}
 }
});

test('older solo saves keep their twenty-card composition without losing cards',()=>{
 const m=game({categories:{positive:true,negative:false,climatic:false,permanent:true}}),raw=JSON.parse(S.serialize(m));delete raw.eventCardIds;delete raw.rules.eventCards;delete raw.soloEventQueue;
 const loaded=S.load(JSON.stringify(raw));assert.equal(loaded.eventDeck.length,20);assert.equal(loaded.eventCardIds.length,20);conserved(loaded);
});
