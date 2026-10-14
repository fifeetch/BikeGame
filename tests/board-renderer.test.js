import {test} from 'node:test';
import assert from 'node:assert/strict';
import {europeBoard,hexVertices,MAP_WIDTH,MAP_HEIGHT} from '../dist/europe.js';
import {createBoardRenderer,boardSnapshotMarkup} from '../dist/board-renderer.js';
import {createHexHitIndex} from '../dist/board-hit-test.js';
import {makeBoardDOM,descendants} from './helpers/board-dom.js';
import * as S from '../dist/simulator.js';
import {CLASSIC,clone} from '../dist/rules.js';

const scene=()=>{const base=europeBoard('Paris','Istanbul');return {g:{...base,pos:base.start,visited:[base.start],players:[{id:'p1',name:'Alice',color:'#bc4932',pos:base.start}]},reachable:[],cost:()=>1,selected:'',route:[],nextSteps:[],editMode:false};};
const byKey=(root,key)=>descendants(root).find(el=>el.getAttribute('data-board-key')===key);
const layer=(root,name)=>descendants(root).find(el=>el.getAttribute('class')===name);

test('all 2783 hexes including sea and cities are found at their centres and inside their corners',()=>{
 const s=scene(),index=createHexHitIndex(s.g.board);
 for(const t of Object.values(s.g.board)){assert.equal(index.atPoint(t.x,t.y)?.key,t.key);assert.equal(index.atAxial(t.q,t.r)?.key,t.key);for(const [x,y]of hexVertices(t))assert.equal(index.atPoint(t.x+(x-t.x)*.98,t.y+(y-t.y)*.98)?.key,t.key);}
 assert.equal(index.atPoint(-100,-100),null);assert.equal(index.atPoint(NaN,40),null);assert.equal(index.atAxial(999,999),null);
});
test('one sea layer and no titles reduce the initial SVG by more than half while retaining land labels',()=>{
 const s=scene(),html=boardSnapshotMarkup(s),count=(html.match(/<[a-zA-Z][^>]*>/g)||[]).length;
 assert(count<11237/2,`SVG elements: ${count}`);assert.equal((html.match(/data-board-key=/g)||[]).length,1486);assert.equal((html.match(/class="board-sea-face"/g)||[]).length,1);assert(!html.includes('<title>'));assert(html.includes('Alice'));assert(html.includes('Paris'));assert(html.includes('Moyenne montagne'));
});
test('same board values preserve every land node without rewrites; a selection patches only one cell',()=>{
 const s=scene(),dom=makeBoardDOM(),r=createBoardRenderer(dom.host);r.update(s);
 const key=Object.values(s.g.board).find(t=>!t.name&&t.type==='plaine').key,el=byKey(dom.host,key),before=el.writes;
 r.update({...s,g:structuredClone(s.g)});assert.equal(byKey(dom.host,key),el);assert.equal(el.writes,before);assert.equal(r.getDiagnostics().changedCells,0);assert.equal(r.getDiagnostics().seaRebuilt,false);
 r.update({...s,selected:key});assert.equal(byKey(dom.host,key),el);assert.equal(r.getDiagnostics().changedCells,1);assert(el.getAttribute('class').includes('selected'));r.destroy();
});
test('editor terrain changes update sea membership, cities and one land target without mutating game state',()=>{
 const s=scene(),dom=makeBoardDOM(),r=createBoardRenderer(dom.host);s.editMode=true;const pristine=structuredClone(s.g);r.update(s);assert.deepEqual(s.g,pristine);
 const sea=Object.values(s.g.board).find(t=>t.type==='mer'),land=Object.values(s.g.board).find(t=>!t.name&&t.type==='plaine'),landNode=byKey(dom.host,land.key),seaD=layer(dom.host,'board-sea-face').getAttribute('d');
 const updated=structuredClone(s.g);updated.board[sea.key].type='ville';updated.board[sea.key].name='Port du test';r.update({...s,g:updated});assert.equal(r.getDiagnostics().createdCells,1);assert.equal(r.getDiagnostics().seaRebuilt,true);assert(byKey(dom.host,sea.key));assert.notEqual(layer(dom.host,'board-sea-face').getAttribute('d'),seaD);assert.equal(byKey(dom.host,land.key),landNode);assert(descendants(dom.host).some(el=>el.textContent==='Port du test'));
 updated.board[sea.key].type='mer';updated.board[sea.key].name='';r.update({...s,g:updated});assert.equal(r.getDiagnostics().removedCells,1);assert(!byKey(dom.host,sea.key));assert(!descendants(dom.host).some(el=>el.textContent==='Port du test'));assert.deepEqual(s.g,pristine);r.destroy();
});
test('delegated pointer and keyboard clicks permit only current choices; editor sea works by pointer and coordinates',()=>{
 const s=scene(),dom=makeBoardDOM(),r=createBoardRenderer(dom.host),keys=[];r.onHexClick(key=>keys.push(key));const key=s.g.board[s.g.pos].links[0];s.nextSteps=[key];r.update(s);const svg=dom.host.children[0];
 svg.dispatch('click',{target:byKey(dom.host,key)});const e=svg.dispatch('keydown',{target:byKey(dom.host,key),key:'Enter'});assert(e.prevented);svg.dispatch('click',{target:byKey(dom.host,'city-Rome')});assert.deepEqual(keys,[key,key]);
 const sea=Object.values(s.g.board).find(t=>t.type==='mer');svg.dispatch('click',{target:svg,clientX:sea.x,clientY:sea.y});assert.equal(keys.length,2);r.update({...s,editMode:true});svg.dispatch('click',{target:svg,clientX:sea.x,clientY:sea.y});assert.equal(keys.at(-1),sea.key);
 const form=dom.wrap.children.find(el=>el.tagName==='form'),inputs=descendants(form).filter(el=>el.tagName==='input');inputs[0].value=String(sea.q);inputs[1].value=String(sea.r);form.dispatch('submit');assert.equal(keys.at(-1),sea.key);inputs[0].value='999';form.dispatch('submit');assert(descendants(form).some(el=>el.textContent==='Cette case est hors du plateau.'));r.destroy();
});
test('camera targets use existing world coordinates and renderer survives a new viewport then releases its handlers',()=>{
 const s=scene(),dom=makeBoardDOM(),r=createBoardRenderer(dom.host);r.update({...s,editMode:true});r.setCamera({zoom:1.47,x:350,y:420,behavior:'smooth'});assert.equal(dom.host.style.width,MAP_WIDTH*1.47+'px');assert.equal(dom.host.style.height,MAP_HEIGHT*1.47+'px');assert.equal(dom.viewport.scroll.left,18+350*1.47-320);assert.equal(dom.viewport.scroll.top,18+420*1.47-200);
 const second=makeBoardDOM();second.viewport.append(dom.host);r.update({...s,editMode:true});assert(second.wrap.children.some(el=>el.tagName==='form'));assert(!dom.wrap.children.some(el=>el.tagName==='form'));const svg=dom.host.children[0];r.destroy();assert.equal(dom.host.children.length,0);for(const handlers of svg.listeners.values())assert.equal(handlers.size,0);assert(!second.wrap.children.some(el=>el.tagName==='form'));assert.throws(()=>r.update(s));
});
test('saved MAP_VERSION 9 game, routes and ferry continue unchanged through display updates',()=>{
 const rules=clone(CLASSIC);rules.eventCards.startingHand=0;rules.eventCards.categories.negative=false;rules.eventCards.categories.climatic=false;
 const original=S.createMatch([{name:'A',bike:'gravel',voyage:'nord'}],'plateau',rules,1),saved=S.serialize(original),m=S.load(saved),dom=makeBoardDOM(),r=createBoardRenderer(dom.host);
 const draw=()=>r.update({g:S.view(m),reachable:S.moves(m),cost:(_,t)=>S.cost(m,t),selected:'',route:[],nextSteps:[],editMode:false});draw();assert.equal(S.serialize(m),saved);assert.equal(m.mapVersion,9);
 assert(!S.routeCheck(m,['city-Oslo']).ok);assert(S.travelFerry(m,'city-Oslo'));draw();assert.equal(S.player(m).pos,'city-Oslo');assert.equal(S.player(m).money,2);assert.equal(m.phase,'card-choice');assert(S.chooseCard(m,0));draw();const near=S.moves(m).find(t=>S.routeCheck(m,[t.key]).ok);assert(near);const before=S.player(m).energy,price=S.cost(m,near);assert(S.beginEventRoute(m,[near.key]).ok);draw();assert.equal(S.player(m).pos,near.key);assert.equal(S.player(m).energy,before-price);assert.deepEqual(S.load(S.serialize(m)),m);r.destroy();
});
