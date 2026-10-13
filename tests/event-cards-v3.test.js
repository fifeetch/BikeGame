import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENT_CARDS,EVENT_COLORS} from '../dist/event-cards.js';
import * as S from '../dist/simulator.js';
import * as C from '../dist/event-card-engine.js';
import {CLASSIC} from '../dist/rules.js';

const roster=[{name:'Alice',bike:'gravel',voyage:'traversee'},{name:'Bob',bike:'gravel',voyage:'soleil'}];
const game=(seed=13)=>S.createMatch(roster,'plateau',CLASSIC,seed);
function give(m,id,p){for(const q of m.players){const i=q.cardHand.indexOf(id);if(i>=0)q.cardHand.splice(i,1);const b=q.bonusCards.indexOf(id);if(b>=0)q.bonusCards.splice(b,1);}for(const zone of [m.eventDeck,m.eventDiscard,m.cardChoices]){const i=zone.indexOf(id);if(i>=0)zone.splice(i,1);}p.cardHand.push(id);return p.cardHand.length-1;}
function nextTurn(m){m.turn++;}
function conserved(m){const ids=[...m.eventDeck,...m.eventDiscard,...m.cardChoices,...(m.pendingAttack?[m.pendingAttack.cardId]:[]),...m.players.flatMap(p=>[...p.cardHand,...p.bonusCards,...p.pendingEffects.map(e=>e.cardId)])];assert.equal(ids.length,40);assert.equal(new Set(ids).size,40);}

test('forty event cards are unique, complete and use four category colours',()=>{
 assert.equal(EVENT_CARDS.length,40);assert.equal(new Set(EVENT_CARDS.map(c=>c.id)).size,40);
 for(const category of Object.keys(EVENT_COLORS))assert.equal(EVENT_CARDS.filter(c=>c.category===category).length,10);
 for(const c of EVENT_CARDS)for(const field of ['id','name','category','description','effectText','effectType','effectValue','targetType','playTiming','terrainCondition','isPermanent','icon','color'])assert(field in c,`${c.id}: ${field}`);
 assert.notEqual(EVENT_CARDS[12].id,EVENT_CARDS[20].id);
});

test('solo keeps only self-playable cards so its hand cannot fill with opponent attacks',()=>{
 const m=S.createMatch([{name:'Solo',bike:'gravel',voyage:'traversee'}],'plateau',CLASSIC,9);
 const all=[...m.eventDeck,...m.players[0].cardHand];assert.equal(all.length,20);
 assert(all.every(id=>C.card(id).targetType==='self'));assert.equal(S.load(S.serialize(m)).cardVersion,3);
});

test('common deck deals three each, keeps one of two and requires chosen overflow discard',()=>{
 const m=game();assert.equal(m.players[0].cardHand.length,3);assert.equal(m.players[1].cardHand.length,3);assert.equal(m.eventDeck.length,34);conserved(m);
 assert(S.endTurn(m));assert.equal(m.cardChoices.length,2);assert.equal(m.eventDeck.length,32);
 assert(S.chooseCard(m,0));assert.equal(m.phase,'card-discard');assert.equal(m.players[0].cardHand.length,4);
 assert(S.discardEventHand(m,2));assert.equal(m.players[0].cardHand.length,3);assert.equal(m.eventDiscard.length,2);conserved(m);
});

test('permanent bonuses occupy two slots, can be replaced and lost to a fall',()=>{
 const m=game(),alice=m.players[0],bob=m.players[1];
 let i=give(m,'evt-34',alice);assert(S.playCard(m,i,alice.id));nextTurn(m);
 i=give(m,'evt-35',alice);assert(S.playCard(m,i,alice.id));assert.deepEqual(alice.bonusCards,['evt-34','evt-35']);nextTurn(m);
 i=give(m,'evt-31',alice);assert(!S.playCard(m,i,alice.id));assert(S.playCard(m,i,alice.id,0));assert.deepEqual(alice.bonusCards,['evt-35','evt-31']);assert(m.eventDiscard.includes('evt-34'));nextTurn(m);
 i=give(m,'evt-16',alice);assert(S.playCard(m,i,bob.id));assert(m.pendingAttack);assert(S.resolveEventAttack(m,{}));assert.equal(bob.energy,6);nextTurn(m);
 i=give(m,'evt-20',bob);m.activeIndex=1;assert(S.playCard(m,i,alice.id));assert(!S.resolveEventAttack(m,{}));assert(S.resolveEventAttack(m,{bonusIndex:1}));assert.deepEqual(alice.bonusCards,['evt-35']);conserved(m);
});

test('climate may be played by a non-active player before a route, once, and cancelled',()=>{
 const m=game(),alice=m.players[0],bob=m.players[1],key=m.board[alice.pos].links.find(k=>m.board[k]?.type!=='mer');
 assert(key);let i=give(m,'evt-21',bob);give(m,'evt-07',alice);
 const planned=S.beginEventRoute(m,[key]);assert(planned.ok&&planned.intervention);assert.equal(m.phase,'card-intervention');
 assert(S.playEventClimate(m,bob.id,i));assert(!S.playEventClimate(m,bob.id,0));assert(S.defendEventAttack(m));assert(!m.pendingAttack);
 assert(S.finishEventRoute(m));assert.equal(alice.pos,key);assert.equal(m.phase,'move');assert(m.eventDiscard.includes('evt-21'));assert(m.eventDiscard.includes('evt-07'));conserved(m);
});

test('immunities and save/load preserve public bonuses and pending effects',()=>{
 const m=game(),alice=m.players[0],bob=m.players[1];
 let i=give(m,'evt-31',alice);assert(S.playCard(m,i,alice.id));nextTurn(m);
 i=give(m,'evt-13',alice);assert(S.playCard(m,i,bob.id));assert(S.resolveEventAttack(m,{}));assert.equal(bob.pendingEffects[0].kind,'extra_energy');nextTurn(m);
 i=give(m,'evt-11',bob);m.activeIndex=1;assert(S.playCard(m,i,alice.id));assert(S.resolveEventAttack(m,{}));assert.equal(alice.energy,8);
 conserved(m);const loaded=S.load(S.serialize(m));assert.deepEqual(loaded.players[0].bonusCards,['evt-31']);assert.equal(loaded.players[1].pendingEffects[0].kind,'extra_energy');conserved(loaded);
});

test('discard is reshuffled only when the common deck is empty',()=>{
 const m=game();m.eventDiscard.push(...m.eventDeck.splice(0));const before=m.eventDiscard.length,id=C.draw(m);
 assert(id);assert.equal(m.eventDiscard.length,0);assert.equal(m.eventDeck.length,before-1);C.discard(m,id);conserved(m);
});

test('food capacity, solar panel and tent bonus stop immediately after replacement',()=>{
 const m=game(),p=m.players[0];let i=give(m,'evt-33',p);assert(S.playCard(m,i,p.id));p.food=9;
 assert.equal(C.foodCapacity(m,p),9);assert(C.removeBonus(m,p,0));assert.equal(p.food,6);assert.equal(C.foodCapacity(m,p),6);nextTurn(m);
 i=give(m,'evt-34',p);assert(S.playCard(m,i,p.id));p.energy=5;C.onTurnEnd(m,p);assert.equal(p.energy,6);
 assert(C.removeBonus(m,p,0));C.onTurnEnd(m,p);assert.equal(p.energy,6);nextTurn(m);
 i=give(m,'evt-37',p);assert(S.playCard(m,i,p.id));assert.equal(p.bonusCards[0],'evt-37');conserved(m);
});

test('snow intervention stops an unaffordable mountain crossing on the last safe cell',()=>{
 const m=game(),p=m.players[0],other=m.players[1],key=m.board[p.pos].links.find(k=>m.board[k]?.type!=='mer');
 m.board[key].type='montagne';p.energy=3;const i=give(m,'evt-25',other),start=p.pos;
 assert(S.beginEventRoute(m,[key]).intervention);assert(S.playEventClimate(m,other.id,i));assert(S.resolveEventAttack(m,{}));assert(S.finishEventRoute(m));
 assert.equal(p.pos,start);assert.equal(p.energy,3);assert(m.eventDiscard.includes('evt-25'));conserved(m);
});

test('negative target and once-per-turn limit are enforced',()=>{
 const m=game(),alice=m.players[0],bob=m.players[1];let i=give(m,'evt-17',alice);
 assert(!S.playCard(m,i,'missing'));assert(!S.playCard(m,i,alice.id));assert(S.playCard(m,i,bob.id));assert(S.resolveEventAttack(m,{}));
 i=give(m,'evt-19',alice);assert(!S.playCard(m,i,bob.id));assert.equal(bob.energy,6);conserved(m);
});

test('only one own-turn card may be played, including after reload; reactions remain available',()=>{
 const m=game(),alice=m.players[0],bob=m.players[1];
 let i=give(m,'evt-02',alice);assert(S.playCard(m,i,alice.id));assert.equal(alice.cardPlayedTurn,m.turn);
 i=give(m,'evt-34',alice);if(alice.cardHand.length>3)m.eventDeck.push(alice.cardHand.shift());i=alice.cardHand.indexOf('evt-34');
 assert(!S.canPlayCard(m,i));assert(!S.playCard(m,i,alice.id));
 const saved=JSON.parse(S.serialize(m));delete saved.players[0].cardPlayedTurn;
 const restored=S.load(JSON.stringify(saved)),active=restored.players[0],other=restored.players[1];
 assert.equal(active.cardPlayedTurn,restored.turn);assert(!S.canPlayCard(restored,active.cardHand.indexOf('evt-34')));
 i=give(restored,'evt-22',other);assert(S.playEventClimate(restored,other.id,i));
 give(restored,'evt-07',active);assert(S.defendEventAttack(restored));
 i=give(restored,'evt-23',other);assert(!S.playEventClimate(restored,other.id,i));
 assert(!S.canPlayCard(restored,active.cardHand.indexOf('evt-34')));
 nextTurn(restored);assert(S.canPlayCard(restored,active.cardHand.indexOf('evt-34')));
 assert(S.playCard(restored,active.cardHand.indexOf('evt-34'),active.id));conserved(restored);
});

test('positive resource cards apply their printed values and respect caps',()=>{
 for(const [id,field,start,expected] of [['evt-02','food',5,6],['evt-03','energy',9,10],['evt-04','energy',6,9],['evt-05','money',1,4],['evt-06','food',5,6],['evt-08','points',0,2]]){
  const m=game(),p=m.players[0];p[field]=start;const i=give(m,id,p);assert(S.playCard(m,i,p.id),id);assert.equal(p[field],expected,id);
  if(id==='evt-06')assert.equal(p.money,6);conserved(m);
 }
});

test('permanent stove, travel journal and Warmshowers activate and stop at their limits',()=>{
 const m=game(),p=m.players[0];let i=give(m,'evt-36',p);assert(S.playCard(m,i,p.id));p.energy=0;assert(S.eat(m));assert.equal(p.energy,3);
 assert(C.removeBonus(m,p,0));m.ate=0;p.energy=0;assert(S.eat(m));assert.equal(p.energy,2);nextTurn(m);
 i=give(m,'evt-39',p);assert(S.playCard(m,i,p.id));const points=p.points;
 C.onCityVisit(m,p,'city-A');C.onCityVisit(m,p,'city-B');C.onCityVisit(m,p,'city-C');C.onCityVisit(m,p,'city-A');
 assert.equal(p.points,points+2);assert.equal(p.journalCities.length,3);nextTurn(m);
 i=give(m,'evt-40',p);assert(S.playCard(m,i,p.id));p.energy=0;C.onCityVisit(m,p,'city-D');C.onCityVisit(m,p,'city-E');assert.equal(p.energy,1);
 m.turn++;C.onCityVisit(m,p,'city-F');assert.equal(p.energy,2);conserved(m);
});

test('an intervention snapshot restores with its waiting responder and route',()=>{
 const m=game(),p=m.players[0],key=m.board[p.pos].links.find(k=>m.board[k]?.type!=='mer');assert(S.beginEventRoute(m,[key]).intervention);
 const restored=S.load(S.serialize(m));assert.equal(restored.phase,'card-intervention');assert.deepEqual(restored.cardWindow.route,[key]);
 assert(S.passEventIntervention(restored));assert.equal(restored.phase,'move');assert.equal(restored.players[0].pos,key);conserved(restored);
});
