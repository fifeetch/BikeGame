import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENT_CARDS,eventCardById,normalizeEventEdits} from '../dist/event-cards.js';
import * as S from '../dist/simulator.js';
import * as C from '../dist/event-card-engine.js';
import {CLASSIC} from '../dist/rules.js';
import {renderCardEditor} from '../dist/card-editor.js';

const roster=[{name:'Alice',bike:'gravel',voyage:'traversee'},{name:'Bob',bike:'gravel',voyage:'soleil'}];
const edit=(slotId,templateId,name='Ma variante')=>({slotId,templateId,name,description:'Texte personnel pour cette carte.'});
const game=edits=>S.createMatch(roster,'plateau',CLASSIC,23,[],edits);
// Règle du 17 octobre : une carte négative attend le début du tour de sa cible.
function deliver(m,p){m.activeIndex=m.players.indexOf(p);m.phase='move';m.moved=0;assert(C.nextIncoming(m),'la cible découvre la carte à son tour');}
function give(m,id,p){
 for(const q of m.players){const index=q.cardHand.indexOf(id);if(index>=0)q.cardHand.splice(index,1);}
 for(const zone of [m.eventDeck,m.eventDiscard,m.cardChoices]){const index=zone.indexOf(id);if(index>=0)zone.splice(index,1);}
 p.cardHand.push(id);return p.cardHand.length-1;
}

test('event edits keep the forty fixed slots and accept only a same-category effect',()=>{
 const edits=normalizeEventEdits([edit('evt-01','evt-05','Escapade'),edit('evt-31','evt-33','Grand sac')]);
 const m=game(edits);assert.equal(m.eventDeck.length+m.players.flatMap(p=>p.cardHand).length,40);
 assert.equal(eventCardById('evt-01',m).effectType,'gain_money');
 assert.equal(eventCardById('evt-31',m).effectType,'food_capacity');
 assert.equal(eventCardById('evt-01',m).name,'Escapade');
 assert.equal(EVENT_CARDS[0].name,'Vent dans le dos');
 assert.throws(()=>normalizeEventEdits([edit('evt-01','evt-11')]));
 assert.throws(()=>normalizeEventEdits([edit('evt-01','evt-05'),edit('evt-01','evt-02')]));
 assert.throws(()=>normalizeEventEdits([edit('evt-41','evt-01')]));
 assert.throws(()=>normalizeEventEdits([edit('evt-01','evt-05','')]));
});

test('edited positive and bonus cards apply their selected effects, not their former slot effects',()=>{
 const m=game([edit('evt-01','evt-05','Petit trésor'),edit('evt-31','evt-33','Sac spécial')]),p=m.players[0];
 const beforeMoney=p.money,first=give(m,'evt-01',p);
 assert(S.playCard(m,first,p.id));assert.equal(p.money,beforeMoney+3);assert.equal(p.freeSteps,0);
 m.turn++;
 const bonus=give(m,'evt-31',p);assert(S.playCard(m,bonus,p.id));
 assert(C.hasBonusEffect(m,p,'food_capacity'));assert.equal(C.foodCapacity(m,p),9);
 p.food=9;assert(C.removeBonus(m,p,0));assert.equal(p.food,6);
});

test('a re-skinned Coup de pouce remains a playable defense',()=>{
 const m=game([edit('evt-02','evt-07','Parade')]),alice=m.players[0],bob=m.players[1];
 const attack=give(m,'evt-17',alice);give(m,'evt-02',bob);
 assert(S.playCard(m,attack,bob.id));deliver(m,bob);assert(S.defendEventAttack(m));
 assert.equal(bob.energy,8);assert(m.eventDiscard.includes('evt-02'));
 assert(m.history.some(h=>h.kind==='card-defense'));
});

test('a re-skinned climate card uses the selected weather effect',()=>{
 const m=game([edit('evt-21','evt-22','Chaleur du jour')]),alice=m.players[0],bob=m.players[1];
 const index=give(m,'evt-21',bob);
 assert(S.playEventClimate(m,bob.id,index));assert(S.resolveEventAttack(m,{}));
 assert.equal(alice.energy,6);assert(m.eventDiscard.includes('evt-21'));
});

test('a running game freezes its card variants through save/load and later edits',()=>{
 const selected=[edit('evt-01','evt-05','Première version')],m=game(selected);
 selected[0].name='Deuxième version';
 assert.equal(eventCardById('evt-01',m).name,'Première version');
 const restored=S.load(S.serialize(m));
 assert.equal(eventCardById('evt-01',restored).effectType,'gain_money');
 assert.equal(eventCardById('evt-01',restored).name,'Première version');
 const later=game([edit('evt-01','evt-08','Nouvelle version')]);
 assert.equal(eventCardById('evt-01',later).effectType,'gain_points');
 assert.equal(eventCardById('evt-01',restored).effectType,'gain_money');
});

test('editor exposes a preview, four categories, import/export and every editable slot',()=>{
 const edits=[edit('evt-01','evt-05','Petit trésor')];
 const html=renderCardEditor([],{id:'',title:'',template:'coup-boost'},'',edits,edits[0]);
 assert.equal((html.match(/data-event-card-edit=/g)||[]).length,40);
 for(const label of ['Positives · 10','Négatives · 10','Climatiques · 10','Bonus permanents · 10'])assert(html.includes(label));
 assert(html.includes('Petit trésor'));assert(html.includes('Gagne immédiatement 3 pièces d’or.'));
 for(const id of ['event-editor-slot','event-editor-effect','event-editor-name','event-editor-description','import-event-cards'])assert(html.includes(`id="${id}"`));
 assert(html.includes('data-action="event-editor-save"'));assert(html.includes('data-action="event-editor-reset"'));assert(html.includes('data-action="event-editor-export"'));
});

test('menu editor saves, imports and resets event variants in local storage',async()=>{
 const storage=new Map(),app={innerHTML:''},elements=new Map();
 const controls={
  '#event-editor-slot':{value:'evt-01'},
  '#event-editor-effect':{value:'evt-01'},
  '#event-editor-name':{value:'Vent dans le dos'},
  '#event-editor-description':{value:'Une brise favorable te pousse sur la route.'},
  '#import-event-cards':{files:[]}
 };
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.document={
  querySelector(selector){if(selector==='#app')return app;return app.innerHTML.includes(`id="${selector.slice(1)}"`)?controls[selector]||null:null;},
  querySelectorAll(selector){const attr=selector.slice(1,-1),key=attr.replace(/^data-/,'').replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());const found=[...app.innerHTML.matchAll(new RegExp(attr+'="([^"]*)"','g'))].map(match=>({dataset:{[key]:match[1]}}));elements.set(attr,found);return found;},
  createElement(){return {click(){}};}
 };
 await import('../dist/app.js?event-editor-test');
 const action=id=>elements.get('data-action').find(el=>el.dataset.action===id).onclick();
 action('editor-hub');action('card-editor-open');assert(app.innerHTML.includes('Les 40 cartes Événement'));
 controls['#event-editor-effect'].value='evt-05';controls['#event-editor-name'].value='Mon trésor';
 controls['#event-editor-description'].value='Une trouvaille sur la route.';
 action('event-editor-save');
 assert.deepEqual(JSON.parse(storage.get('velo-event-card-edits')),[edit('evt-01','evt-05','Mon trésor')].map(item=>({...item,description:'Une trouvaille sur la route.'})));
 controls['#import-event-cards'].files=[{size:90,text:async()=>JSON.stringify({version:2,eventCardEdits:[edit('evt-11','evt-17','Mauvais repas')]})}];
 await controls['#import-event-cards'].onchange();
 assert.equal(JSON.parse(storage.get('velo-event-card-edits')).length,2);
 action('event-editor-reset');
 assert.deepEqual(JSON.parse(storage.get('velo-event-card-edits')).map(item=>item.slotId),['evt-11']);
});
