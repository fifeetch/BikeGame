// Cartes Événement revues avec Fi (15 octobre 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import * as C from '../dist/event-card-engine.js';
import {CLASSIC} from '../dist/rules.js';
import {eventCardsFor} from '../dist/event-cards.js';

const roster=[{name:'Fi',bike:'gravel',voyage:'traversee',items:[]},{name:'Léa',bike:'gravel',voyage:'soleil',items:[]}];
function game(){const m=S.createMatch(roster,'plateau',CLASSIC,13);m.pendingAttack=null;m.phase='move';m.cardChoices=[];
 for(const p of m.players){p.cardHand=[];p.bonusCards=[];p.pendingEffects=[];p.turnModifiers={};p.energy=10;}m.moved=0;return m;}
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
