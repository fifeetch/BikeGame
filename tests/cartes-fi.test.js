// Cartes Événement revues avec Fi (15 octobre 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import * as C from '../dist/event-card-engine.js';
import {CLASSIC} from '../dist/rules.js';
import {eventCardsFor} from '../dist/event-cards.js';

const roster=[{name:'Fi',bike:'gravel',voyage:'traversee',items:[]},{name:'Léa',bike:'gravel',voyage:'soleil',items:[]}];
function game(){const m=S.createMatch(roster,'plateau',CLASSIC,13);m.pendingAttack=null;m.phase='move';m.cardChoices=[];
 for(const p of m.players){m.eventDiscard.push(...p.cardHand,...p.bonusCards);p.cardHand=[];p.bonusCards=[];p.pendingEffects=[];p.turnModifiers={};p.energy=10;}m.moved=0;return m;}
// Fi (joueur actif) joue la carte <effet> contre Léa ; Léa subit.
function attack(m,effect){const fi=m.players[0],lea=m.players[1],id=eventCardsFor(m).find(c=>c.effectType===effect).id;
 fi.cardHand=[id];fi.cardPlayedTurn=-1;fi.negativePlayedTurn=-1;
 if(!C.beginAttack(m,fi.id,0,lea.id))throw Error('attaque refusée : '+effect);assert(C.resolveAttack(m));return lea;}
// Passe au tour de Léa.
function toLea(m){for(let i=0;i<6&&S.player(m).id!=='p2';i++){m.phase='move';m.cardChoices=[];m.pendingAttack=null;S.endTurn(m);
  if(m.phase==='card-choice'){S.chooseCard(m,0);if(m.phase==='card-discard')S.discardEventHand(m,0);}}
 assert.equal(S.player(m).id,'p2');return S.player(m);}

for(const [effect,item] of [['puncture','kit'],['mechanical','kit'],['fall','secours']])
 test(`${effect} : avec ${item}, on répare et on repart ; sans, retour à la dernière ville`,()=>{
  for(const has of [true,false]){const m=game(),lea=attack(m,effect);lea.items=has?[item]:[];
   const energy=lea.energy;lea.lastCity='city-Lyon';lea.pos='city-Paris';
   toLea(m);assert.equal(m.phase,'puncture');assert.equal(S.breakdownOf(lea).item,item);
   assert(S.repairPuncture(m));
   if(has){assert.equal(m.phase,'move');assert.equal(lea.pos,'city-Paris');}
   else{assert.equal(lea.pos,'city-Lyon');assert(m.phase!=='move'||S.player(m).id!=='p2','journée perdue');}
   if(effect==='fall')assert.equal(energy,8,'la chute coûte 2 énergies');}
 });

test('Erreur d’itinéraire : pas de déplacement au prochain tour',()=>{
 const m=game();attack(m,'wrong_turn');toLea(m);assert.equal(S.moves(m).length,0);
});

test('Neige au sommet : jouable sur tout parcours, montagne et cols interdits au prochain tour',()=>{
 const m=game(),lea=m.players[1],snow=eventCardsFor(m).find(c=>c.effectType==='mountain_snow');
 assert(C.climateEligible(m,snow.id,[]));
 lea.pendingEffects=[{cardId:snow.id,kind:'no_mountain'}];m.eventDeck=m.eventDeck.filter(id=>id!==snow.id);m.eventDiscard=m.eventDiscard.filter(id=>id!==snow.id);
 toLea(m);assert(lea.turnModifiers.noMountain);
 const mount=Object.values(m.board).find(t=>t.type==='montagne'&&t.links.some(k=>m.board[k].type==='plaine')),from=mount.links.find(k=>m.board[k].type==='plaine');
 lea.pos=from;lea.energy=10;m.moved=0;assert(!S.moves(m).some(t=>t.key===mount.key));assert(!S.routeCheck(m,[mount.key]).ok);
});

test('Vent dans le dos : cases gratuites en plaine, côte, moyenne montagne — pas en montagne',()=>{
 const m=game(),p=S.player(m),id=eventCardsFor(m).find(c=>c.effectType==='free_steps').id;p.cardHand=[id];p.cardPlayedTurn=-1;
 assert(C.playOwnCard(m,0));assert.equal(p.freeTailwindSteps,2);
 const mount=Object.values(m.board).find(t=>t.type==='montagne'&&t.links.some(k=>m.board[k].type==='plaine')),plain=m.board[mount.links.find(k=>m.board[k].type==='plaine')];
 p.items=['gps'];p.pos=plain.key;m.moved=5;// journée normale finie
 assert(!S.routeCheck(m,[mount.key]).ok,'pas de case offerte en montagne');
 const flat=plain.links.map(k=>m.board[k]).find(t=>t.type==='plaine');assert(S.routeCheck(m,[flat.key]).ok,'case offerte en plaine');
});

test('GPS de randonnée (bonus) : quitter la route sans pénalité',()=>{
 const m=game(),p=S.player(m);assert(!S.hasOffroadItem(m,p));
 p.bonusCards=[eventCardsFor(m).find(c=>c.effectType==='gps_immunity').id];assert(S.hasOffroadItem(m,p));
});

// ---------- Cartes 18, 24, 39 revues et fin de partie (15 octobre 2026) ----------
test('Route barrée : 2 cases de moins au prochain tour',()=>{
 const m=game(),lea=attack(m,'road_closed');assert(lea.pendingEffects.some(e=>e.kind==='short_move'&&e.value===2));toLea(m);assert.equal(lea.turnModifiers.distancePenalty,2);
});
test('Carnet de voyage : +1 pièce par nouvelle ville',()=>{
 const m=game(),p=S.player(m);p.bonusCards=[eventCardsFor(m).find(c=>c.effectType==='travel_journal').id];const money=p.money;
 C.onCityVisit(m,p,'city-A');C.onCityVisit(m,p,'city-B');C.onCityVisit(m,p,'city-A');assert.equal(p.money,money+2);
});
test('fin de partie standard : 50 points, 3 voyages ou 40 jours ; un voyage réussi en fait tirer un autre',()=>{
 const m=game(),p=S.player(m);assert.equal(m.rules.victory.mode,'multi');assert.deepEqual([m.rules.victory.points,m.rules.victory.voyages,m.rules.victory.days],[35,3,40]);
 // voyage réussi : 3 nouvelles cartes, jamais la même ni une qui arrive ici
 p.voyagesDone=[{id:p.voyage,day:1,points:9}];p.completed=true;p.voyageChoices=S.newVoyageChoices(m,p);assert.equal(p.voyageChoices.length,3);assert(!p.voyageChoices.includes(p.voyage));
 m.phase='voyage-choice';const pick=p.voyageChoices[1];p.travelHistory.push({key:'x',type:'plaine',day:1});
 assert(S.chooseNewVoyage(m,pick));assert.equal(p.voyage,pick);assert.equal(p.completed,false);assert.equal(m.phase,'move');assert.equal(S.view(m).travelHistory.length,0,'objectifs comptés à partir de maintenant');
 assert.equal(S.load(S.serialize(m)).players[0].voyage,pick);
 // 50 points : victoire au prochain passage de tour
 p.points=35;m.phase='move';S.endTurn(m);if(m.phase==='card-choice')S.chooseCard(m,0);if(m.phase==='card-discard')S.discardEventHand(m,0);
 assert(m.done);assert.equal(m.winner,p.id);assert.equal(S.ranking(m)[0].id,p.id);
});
test('fin de partie après 40 jours : le plus de points gagne',()=>{
 const m=game();m.players[1].points=7;m.players[0].points=3;for(const q of m.players)q.availableDay=41;m.round=41;m.phase='move';
 S.endTurn(m);if(m.phase==='card-choice')S.chooseCard(m,0);if(m.phase==='card-discard')S.discardEventHand(m,0);
 assert(m.done);assert.equal(m.winner,'p2');
});
test('arrivé sans tous les objectifs : on peut terminer le voyage avec 40 % de points en moins',()=>{
 const m=game(),p=S.player(m);
 const voyage=S.view(m).voyage,dest=Object.values(m.board).find(t=>t.type==='ville'&&t.name===({traversee:'Istanbul',soleil:'Rome'}[voyage]));
 p.pos=dest.key;p.travelHistory=[];p.voyageFrom=0;m.phase='move';
 assert(S.canFinishVoyageEarly(m));const before=p.points,full={traversee:15,soleil:12}[voyage];
 assert(S.finishVoyageEarly(m));assert.equal(p.points-before,Math.round(full*.6));assert(p.completed);assert.equal(p.voyageChoices.length,3);assert(p.voyagesDone.at(-1).partial);
 assert(!S.canFinishVoyageEarly(m),'une seule fois');
});

test('voyage rapide : train jusqu’à la ville de départ de la nouvelle carte, prix selon la distance, journée passée',()=>{
 const m=game(),p=S.player(m);p.voyagesDone=[{id:p.voyage,day:1,points:9}];p.completed=true;p.voyageChoices=S.newVoyageChoices(m,p);m.phase='voyage-choice';
 const id=p.voyageChoices.find(v=>S.fastTravelInfo(m,v,p)),info=S.fastTravelInfo(m,id,p);assert(info);
 assert.equal(info.price,info.cases<10?2:info.cases<20?3:4);p.money=10;
 assert(S.fastTravel(m,id));assert.equal(p.pos,info.to);assert.equal(p.money,10-info.price);assert.equal(p.voyage,id);assert.equal(S.view(m,p).travelHistory.length,0);
 assert(m.phase!=='move'||S.player(m).id!==p.id,'la journée est passée');
 assert.equal(S.load(S.serialize(m)).players[0].pos,info.to);
});
