import {test} from 'node:test';
import assert from 'node:assert/strict';
import {europeBoard} from '../dist/europe.js';
import {normalizeMap} from '../dist/map-library.js';
import * as S from '../dist/simulator.js';

test('map files reject unknown cells, invalid effort and changes to voyage cities',()=>{
 assert.throws(()=>normalizeMap({cells:{'999,999':{type:'col'}},terrain:{col:3}}));
 assert.throws(()=>normalizeMap({cells:{},terrain:{col:11}}));
 const paris=europeBoard('Paris','Istanbul').board['city-Paris'];
 assert.throws(()=>normalizeMap({cells:{[`${paris.q},${paris.r}`]:{type:'mer'}},terrain:{col:3}}));
});

test('menu editor saves and exports a col map, choice starts on it, and later edits do not change an ongoing game',async()=>{
 const app={innerHTML:''},storage=new Map(),elements=new Map(),mapInput={files:[]},controls={name:'Col des Brumes',type:'col',city:'',effort:'5'};
 let lastSheet='';const gameRoot={querySelector:()=>null,append:sheet=>{lastSheet=sheet.innerHTML;}};
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.document={
  querySelector(selector){if(selector==='#app')return app;if(selector==='.game'&&/<main class="game(?: game-split)?"/.test(app.innerHTML))return gameRoot;if(selector==='#import-map'&&app.innerHTML.includes('id="import-map"'))return mapInput;if(selector==='#editor-map-name')return {value:controls.name};if(selector==='#map-tile-type')return {value:controls.type};if(selector==='#map-tile-name')return {value:controls.city};if(selector==='#map-col-effort')return {value:controls.effort};return null;},
  querySelectorAll(selector){const attr=selector.slice(1,-1),key=attr.replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase());const found=[...app.innerHTML.matchAll(new RegExp(attr+'="([^"]*)"','g'))].map(match=>({dataset:{[key]:match[1]}}));elements.set(attr,found);return found;},
  createElement(){return {click(){}};}
 };
 let downloaded=null;const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 URL.createObjectURL=blob=>{downloaded=blob;return 'blob:test';};URL.revokeObjectURL=()=>{};
 const click=(attr,value)=>{const el=elements.get(attr)?.find(el=>Object.values(el.dataset).includes(value));assert(el,attr+' '+value);el.onclick();};
 try{
  await import('../dist/app.js');
  assert(app.innerHTML.includes('Créer une carte'));
  click('data-action','editor-new');assert(app.innerHTML.includes('ÉDITEUR DE CARTE'));
  const original=Object.values(europeBoard('Paris','Istanbul').board).find(t=>!t.name&&t.type==='montagne');assert(original);
  click('data-move',original.key);assert(app.innerHTML.includes('Col mythique'));
  click('data-action','map-save');assert(app.innerHTML.includes('terrain-col'));
  click('data-action','map-export-file');
  const exported=JSON.parse(await downloaded.text());assert.equal(exported.terrain.col,5);assert.equal(exported.cells[`${original.q},${original.r}`].type,'col');
  const saved=JSON.parse(storage.get('velo-maps'));assert.equal(saved.length,1);assert.equal(saved[0].name,'Col des Brumes');
  click('data-action','home');click('data-action','new');assert(app.innerHTML.includes('Col des Brumes'));
  click('data-map-choice',saved[0].id);click('data-action','start');click('data-action','equipment-next');
  click('data-voyage',elements.get('data-voyage')[0].dataset.voyage);
  assert(lastSheet.includes('player-sheet-inline player-mat'));
  assert(lastSheet.includes('PLATEAU DU CYCLISTE'));
  assert(lastSheet.includes('<details class="sheet-extras">'));
  assert(lastSheet.includes('Journal & aide des terrains'));
  assert(lastSheet.includes('Cartes en main'));
  assert(lastSheet.includes('Cartes posées'));
  assert(lastSheet.includes('0/2 bonus permanent(s) posé(s).'));
  assert(!app.innerHTML.includes('dock-resources'));
  for(const action of ['eat','food','work','save','finish'])assert(lastSheet.includes(`data-action="${action}"`));
  let game=JSON.parse(storage.get('velo-save'));assert.equal(game.mapChoice,saved[0].id);assert.equal(game.rules.terrain.col,5);assert.equal(game.board[original.key].type,'col');assert.equal(S.cost(game,game.board[original.key]),5);
  click('data-action','home');controls.type='plaine';click('data-edit-map',saved[0].id);click('data-move',original.key);click('data-action','map-save');click('data-action','map-save-project');click('data-action','home');click('data-action','continue');
  game=JSON.parse(storage.get('velo-save'));assert.equal(game.board[original.key].type,'col');
  click('data-action','home');click('data-action','new');click('data-action','selectbike');click('data-map-choice','');click('data-action','start');click('data-action','equipment-next');click('data-voyage',elements.get('data-voyage')[0].dataset.voyage);
  game=JSON.parse(storage.get('velo-save'));assert.equal(game.board[original.key].type,'montagne');assert.equal(game.mapName,'Europe standard');
  click('data-action','home');mapInput.files=[{size:1000,text:async()=>JSON.stringify(exported)}];await mapInput.onchange();
  assert(app.innerHTML.includes('ÉDITEUR DE CARTE'));assert.equal(JSON.parse(storage.get('velo-maps')).length,2);
  assert(app.innerHTML.includes('Col des Brumes'));
 }finally{URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
});
