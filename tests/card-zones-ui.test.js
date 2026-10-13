import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as S from '../dist/simulator.js';
import {CLASSIC} from '../dist/rules.js';

test('the player sheet separates playable hand cards from placed cards',async()=>{
 const game=S.createMatch([{name:'Alice',bike:'gravel',voyage:'traversee'},{name:'Bob',bike:'randonneur',voyage:'nord'}],'plateau',CLASSIC,123);
 game.cardVersion=2; // Preserve the UI contract for games saved before the 40-card deck.
 for(const p of game.players)p.cardHand=[];
 game.players[0].cardHand=['vent-favorable','bonne-affaire','pluie-battante'];
 assert(S.playCard(game,1,game.players[0].id));
 assert(S.playCard(game,1,game.players[1].id));
 const storage=new Map([['velo-save',S.serialize(game)]]),app={innerHTML:''},elements=new Map(),widthControl={value:'50'},widthOutput={textContent:''};
 let sheet='',appliedWidth='',currentSheet={scrollTop:0};const gameRoot={querySelector:()=>null,append:node=>{sheet=node.innerHTML;currentSheet={scrollTop:0};},style:{setProperty:(_name,value)=>{appliedWidth=value;}}};
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.document={
  querySelector(selector){if(selector==='#app')return app;if(selector==='.game'&&/<main class="game(?: game-split)?"/.test(app.innerHTML))return gameRoot;if(selector==='.player-sheet-mount'&&app.innerHTML.includes('<main class="game'))return currentSheet;if(selector==='#split-width'&&app.innerHTML.includes('id="split-width"'))return widthControl;if(selector==='#split-width-value'&&app.innerHTML.includes('id="split-width-value"'))return widthOutput;return null;},
  querySelectorAll(selector){const attr=selector.slice(1,-1),key=attr.replace(/^data-/,'').replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());const found=[...app.innerHTML.matchAll(new RegExp(attr+'="([^"]*)"','g'))].map(match=>({dataset:{[key]:match[1]}}));elements.set(attr,found);return found;},
  createElement(){return {click(){}};}
 };
 await import('../dist/app.js');
 const resume=elements.get('data-action')?.find(el=>el.dataset.action==='continue');
 assert(resume);
 resume.onclick();
 assert(app.innerHTML.includes('class="game game-split"'));
 assert(app.innerHTML.includes('aria-label="Largeur de la fiche joueur"'));
 widthControl.oninput();
 assert.equal(storage.get('velo-split-width'),'50');
 assert.equal(appliedWidth,'50%');
 assert.equal(widthOutput.textContent,'50%');
 currentSheet.scrollTop=175;
 elements.get('data-action').find(el=>el.dataset.action==='split-view').onclick();
 assert.equal(currentSheet.scrollTop,175);
 assert.equal(storage.get('velo-split-view'),'false');
 assert(app.innerHTML.includes('<main class="game">'));
 elements.get('data-action').find(el=>el.dataset.action==='split-view').onclick();
 assert.equal(storage.get('velo-split-view'),'true');
 assert(app.innerHTML.includes('class="game game-split"'));
 assert(app.innerHTML.includes('--sheet-width:50%'));
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
 assert(app.innerHTML.includes('🃏 En main · 1'));
 elements.get('data-action').find(el=>el.dataset.action==='cards').onclick();
 assert(app.innerHTML.includes('card-hand-modal'));
 assert(app.innerHTML.includes('Vent favorable'));
 assert(!app.innerHTML.includes('Bonne affaire</h3>'));
 const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
 assert(css.includes('.player-sheet-mount .player-mat{zoom:.75;width:100%}'));
 assert(css.includes('.player-sheet-mount .sheet-page-cartes .sheet-journal>.sheet-card:first-child{display:none}'));
});
