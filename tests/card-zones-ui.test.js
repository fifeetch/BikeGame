import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import {CLASSIC} from '../dist/rules.js';

test('the player sheet separates playable hand cards from placed cards',async()=>{
 const game=S.createMatch([{name:'Alice',bike:'gravel',voyage:'traversee'},{name:'Bob',bike:'randonneur',voyage:'nord'}],'plateau',CLASSIC,123);
 game.players[0].cardHand=['vent-favorable','bonne-affaire','pluie-battante'];
 assert(S.playCard(game,1,game.players[0].id));
 assert(S.playCard(game,1,game.players[1].id));
 const storage=new Map([['velo-save',S.serialize(game)]]),app={innerHTML:''},elements=new Map();
 let sheet='';
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.document={
  querySelector(selector){if(selector==='#app')return app;if(selector==='.game'&&app.innerHTML.includes('<main class="game">'))return {querySelector:()=>null,append:node=>{sheet=node.innerHTML;}};return null;},
  querySelectorAll(selector){const attr=selector.slice(1,-1),key=attr.replace(/^data-/,'').replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());const found=[...app.innerHTML.matchAll(new RegExp(attr+'="([^"]*)"','g'))].map(match=>({dataset:{[key]:match[1]}}));elements.set(attr,found);return found;},
  createElement(){return {click(){}};}
 };
 await import('../dist/app.js');
 const resume=elements.get('data-action')?.find(el=>el.dataset.action==='continue');
 assert(resume);
 resume.onclick();
 assert(sheet.includes('Cartes en main'));
 assert(sheet.includes('Cartes posées'));
 assert(sheet.includes('1/5 cartes'));
 assert(sheet.includes('2 jouées'));
 assert(sheet.includes('Donnée à Bob'));
 const hand=sheet.split('class="sheet-hand"')[1].split('</section>')[0];
 const placed=sheet.split('class="sheet-played-cards"')[1].split('</section>')[0];
 assert(hand.includes('Vent favorable'));
 assert(hand.includes('data-action="card-0"'));
 assert(!hand.includes('Bonne affaire'));
 assert(placed.includes('Bonne affaire'));
 assert(placed.includes('Pluie battante'));
 assert(!placed.includes('data-action="card-'));
});
