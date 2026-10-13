import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import {CLASSIC} from '../dist/rules.js';
import {eventFace} from '../dist/event-card-ui.js';
import {EVENT_CARDS} from '../dist/event-cards.js';
import {renderCardEditor} from '../dist/card-editor.js';

test('four card faces use the same portrait structure and exact category palette',()=>{
 for(const category of ['positive','negative','climatic','permanent']){
  const card=EVENT_CARDS.find(c=>c.category===category),html=eventFace(card);
  assert(html.includes('CARTE ÉVÉNEMENT'));assert(html.includes('EFFET'));assert(html.includes(card.name));
  assert(html.includes(`--event-color:${card.color}`));assert(html.includes(`class="event-face ${category}"`));
 }
});

test('menu catalogue exposes all forty official event cards without erasing the archive',()=>{
 const html=renderCardEditor([],{id:'',title:'',template:'coup-boost'});
 assert(html.includes('Les 40 cartes Événement officielles'));
 assert.equal((html.match(/class="event-face /g)||[]).length,40);
 for(const c of EVENT_CARDS)assert(html.includes(c.name),c.id);
 assert(html.includes('Archives de l’ancien système'));
});

test('a resumed new game shows the common piles, public bonus slots and only active hand',async()=>{
 const m=S.createMatch([{name:'Alice',bike:'gravel',voyage:'traversee'},{name:'Bob',bike:'gravel',voyage:'soleil'}],'plateau',CLASSIC,19);
 const bobCard=m.players[1].cardHand[0],aliceCard=m.players[0].cardHand[0];
 const storage=new Map([['velo-save',S.serialize(m)]]),app={innerHTML:''},elements=new Map();let sheet='';
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.document={
  querySelector(selector){if(selector==='#app')return app;if(selector==='.game'&&app.innerHTML.includes('<main class="game'))return {querySelector:()=>null,append:node=>{sheet=node.innerHTML;},style:{setProperty(){}}};return null;},
  querySelectorAll(selector){const attr=selector.slice(1,-1),key=attr.replace(/^data-/,'').replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());const found=[...app.innerHTML.matchAll(new RegExp(attr+'="([^"]*)"','g'))].map(match=>({dataset:{[key]:match[1]}}));elements.set(attr,found);return found;},
  createElement(){return {click(){}};}
 };
 await import('../dist/app.js?event-ui');
 elements.get('data-action').find(el=>el.dataset.action==='continue').onclick();
 assert(app.innerHTML.includes('Cartes Événement'));assert(app.innerHTML.includes('dans la pioche'));
 assert(app.innerHTML.slice(0,app.innerHTML.indexOf('</header>')).includes('class="event-piles"'));
 assert(!app.innerHTML.slice(app.innerHTML.indexOf('</header>')).includes('class="event-piles"'));
 assert(sheet.includes('EMPLACEMENT 1'));assert(sheet.includes('EMPLACEMENT 2'));
 assert(sheet.includes(EVENT_CARDS.find(c=>c.id===aliceCard).name));
 if(!m.players[0].cardHand.includes(bobCard))assert(!sheet.includes(`№ ${bobCard.slice(-2)}`));
});
