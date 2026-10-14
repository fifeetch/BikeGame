import {test} from 'node:test';
import assert from 'node:assert/strict';
import {europeBoard} from '../dist/europe.js';
import {createBoardRenderer} from '../dist/board-renderer.js';
import {isCellStale,readArtPreference,writeArtPreference,TERRAIN_ART_STORAGE} from '../dist/terrain-art.js';
import {makeBoardDOM,descendants} from './helpers/board-dom.js';

const scene=()=>{const base=europeBoard('Paris','Istanbul');return {g:{...base,pos:base.start,visited:[base.start],players:[]},reachable:[],cost:()=>1,selected:'',route:[],nextSteps:[],editMode:false};};
const cls=el=>(el.getAttribute('class')||'').split(' ');
const fakeStorage=(v)=>{const m=new Map(v?[[TERRAIN_ART_STORAGE,v]]:[]);return {getItem:k=>m.get(k)??null,setItem:(k,x)=>m.set(k,x)};};

test('the illustrated background stays off until its image has loaded, then switches on and off', ()=>{
 const dom=makeBoardDOM(),r=createBoardRenderer(dom.host),s=scene();r.update(s);
 const img=dom.host.children.find(el=>el.tagName==='img');
 assert(img,'une seule image de fond est créée');assert.equal(r.artAvailable(),true);assert.equal(r.isArtOn(),false);
 assert(!cls(dom.host.children[0]).includes('art-on'));
 img.dispatch('load');assert.equal(r.isArtOn(),true);assert.equal(img.hidden,false);
 const svg=dom.host.children[0];assert(cls(svg).includes('art-on'));
 const land=descendants(svg).filter(el=>el.getAttribute('data-board-key')&&cls(el).includes('map-tile'));
 assert(land.length>1000);assert(land.every(el=>cls(el).includes('art-cell')),'chaque case de terre reste cliquable et marquée art-cell');
 r.setArt(false);assert.equal(r.isArtOn(),false);assert(!cls(svg).includes('art-on'));assert(land.every(el=>!cls(el).includes('art-cell')));assert.equal(img.hidden,true);
 r.destroy();assert(!dom.host.children.includes(img));
});

test('a failed image load falls back to the pictogram board', ()=>{
 const dom=makeBoardDOM(),r=createBoardRenderer(dom.host);r.update(scene());
 dom.host.children.find(el=>el.tagName==='img').dispatch('error');
 assert.equal(r.isArtOn(),false);assert(!cls(dom.host.children[0]).includes('art-on'));r.destroy();
});

test('cells edited after the image was made fall back to the old drawing, others keep the art', ()=>{
 const dom=makeBoardDOM(),r=createBoardRenderer(dom.host),s=scene();r.update(s);dom.host.children.find(el=>el.tagName==='img').dispatch('load');
 const plain=Object.values(s.g.board).find(t=>t.type==='plaine'),sea=Object.values(s.g.board).find(t=>t.type==='mer');
 assert.equal(isCellStale(plain),false);
 const edited={...s.g,board:{...s.g.board,[plain.key]:{...plain,type:'montagne'}}};
 assert.equal(isCellStale(edited.board[plain.key]),true);
 r.update({...s,g:edited});
 const node=descendants(dom.host).find(el=>el.getAttribute('data-board-key')===plain.key);
 assert(!cls(node).includes('art-cell'),'la case modifiée n’utilise pas le fond');
 const other=Object.values(s.g.board).find(t=>t.type==='plaine'&&t.key!==plain.key);
 assert(cls(descendants(dom.host).find(el=>el.getAttribute('data-board-key')===other.key)).includes('art-cell'));
 const seaPath=descendants(dom.host).find(el=>cls(el).includes('board-sea-face'));
 assert.equal(seaPath.getAttribute('d')||'','', 'la mer d’origine n’est plus dessinée par le SVG quand le fond est actif');
 const flooded={...s.g,board:{...s.g.board,[plain.key]:{...plain,type:'mer'}}};r.update({...s,g:flooded});
 assert((seaPath.getAttribute('d')||'').startsWith('M'),'une case devenue mer est dessinée par le SVG');
 assert.equal(isCellStale(sea),false);r.destroy();
});

test('the Illustrations preference is remembered and defaults to on', ()=>{
 assert.equal(readArtPreference(fakeStorage()),true);
 const st=fakeStorage();writeArtPreference(false,st);assert.equal(readArtPreference(st),false);writeArtPreference(true,st);assert.equal(readArtPreference(st),true);
 assert.equal(readArtPreference({getItem(){throw Error('bloqué');}}),true);
});

test('the baked terrain image is shipped and listed for offline use', async()=>{
 const {readFile,stat}=await import('node:fs/promises');
 const sw=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
 assert(sw.includes('./assets/terrain/europe-terrain.webp')&&sw.includes('./terrain-art.js'));
 const info=await stat(new URL('../dist/assets/terrain/europe-terrain.webp',import.meta.url));assert(info.size>1e6);
});

// ---- redessin en direct des cases modifiées (éditeur, cartes personnalisées) ----
import {planDynamic,staleCount,groundGroup} from '../dist/terrain-dynamic.js';
import {CELL_PATCHES,GROUND_PATCHES} from '../dist/terrain-patches.js';
const nodesOf=()=>Object.values(europeBoard('Paris','Istanbul').board).map(t=>({...t}));

test('dynamic art: the untouched Europe needs no patch and draws every motif of the baked map', ()=>{
 const nodes=nodesOf();assert.equal(staleCount(nodes),0);
 const plan=planDynamic(nodes);assert.equal(plan.ground.length,0);assert.equal(plan.motifs.length,Object.keys(CELL_PATCHES).length);
 assert(plan.motifs.every((m,i)=>i===0||plan.motifs[i-1].t.y<=m.t.y),'les motifs sont dessinés de haut en bas');
});

test('dynamic art: an edited cell gets ground of its new type and motifs of its new type', ()=>{
 const nodes=nodesOf(),plain=nodes.find(t=>t.type==='plaine'&&!t.name);plain.type='montagne';
 assert.equal(staleCount(nodes),1);const plan=planDynamic(nodes);
 assert.equal(plan.ground.filter(g=>g.t===plain&&g.pass===0).length,1,'un morceau de sol de montagne');
 assert(plan.motifs.some(m=>m.t===plain),'des montagnes sont dessinées sur la case');
 assert.equal(groundGroup('col'),'montagne');assert.equal(groundGroup('ville'),'plaine');assert.equal(groundGroup('moyenne_montagne'),'colline');
 assert.equal(groundGroup('mer',1),'mer0');assert.equal(groundGroup('mer',4),'mer1');assert.equal(groundGroup('mer',9),'mer2');
});

test('dynamic art: a sea cell surrounded by land becomes a small lake, and new coasts get a beach band', ()=>{
 const nodes=nodesOf(),by=new Map(nodes.map(t=>[`${t.q},${t.r}`,t]));
 const inland=nodes.find(t=>t.type==='plaine'&&[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]].every(([a,b])=>by.get(`${t.q+a},${t.r+b}`)?.type==='plaine'));
 inland.type='mer';const plan=planDynamic(nodes);
 assert(plan.ground.some(g=>g.t===inland&&g.pass===1)&&plan.ground.some(g=>g.t===inland&&g.pass===2),'rive puis eau');
 assert(!plan.motifs.some(m=>m.t===inland),'pas d’arbres dans un lac');
 const coast=nodes.find(t=>t.type==='cote'&&!t.name);coast.type='plaine';
 assert(planDynamic(nodes).ground.some(g=>g.t===coast&&g.pass===3),'bande de rivage sur le côté qui touche la mer');
 assert.equal(GROUND_PATCHES.shore.length,6);
});

test('dynamic art images are shipped and listed for offline use', async()=>{
 const {readFile,stat}=await import('node:fs/promises');
 const sw=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
 for(const f of ['./terrain-variants.js','./terrain-dynamic.js','./terrain-patches.js','./assets/terrain/europe-ground.webp','./assets/terrain/patches.webp'])assert(sw.includes(f),f);
 assert((await stat(new URL('../dist/assets/terrain/europe-ground.webp',import.meta.url))).size>5e5);
 assert((await stat(new URL('../dist/assets/terrain/patches.webp',import.meta.url))).size>1e5);
});

// ---- variantes d'apparence ----
import {TERRAIN_VARIANTS,variantsFor,validVariant} from '../dist/terrain-variants.js';
import {MOTIF_PATCHES} from '../dist/terrain-patches.js';
import {normalizeMap,applyMap} from '../dist/map-library.js';

test('variants: every proposed variant has its own artwork, and the rules never see it', ()=>{
 for(const [type,list] of Object.entries(TERRAIN_VARIANTS)){
  assert.equal(variantsFor(type).length,list.length);
  if(type==='mer')continue;
  for(const [id] of list)assert(MOTIF_PATCHES[`${type}:${id}`]?.length>0,`motifs ${type}:${id}`);
  if(type!=='ville')for(const [id] of list)assert(GROUND_PATCHES[`${type}:${id}`]?.length>0,`sol ${type}:${id}`);
 }
 assert.equal(validVariant('cote','falaise'),true);assert.equal(validVariant('cote','foret'),false);assert.equal(validVariant('plaine',''),false);
 assert.deepEqual(variantsFor('col'),[]);
});

test('variants: saved maps keep a valid variant, drop an unknown one and apply it as a cosmetic field only', ()=>{
 const base=europeBoard('Paris','Istanbul'),cell=Object.values(base.board).find(t=>t.type==='plaine'&&!t.name),key=`${cell.q},${cell.r}`;
 const ok=normalizeMap({name:'t',cells:{[key]:{type:'cote',name:'',variant:'plage'}}});assert.equal(ok.cells[key].variant,'plage');
 const bad=normalizeMap({name:'t',cells:{[key]:{type:'cote',name:'',variant:'foret'}}});assert.equal('variant' in bad.cells[key],false);
 const plain=normalizeMap({name:'t',cells:{[key]:{type:'plaine',name:''}}});assert.deepEqual(plain.cells[key],{type:'plaine',name:''});
 const game={mode:'plateau',board:{[cell.key]:{...cell}}};applyMap(game,ok);
 assert.equal(game.board[cell.key].type,'cote');assert.equal(game.board[cell.key].variant,'plage');
});

test('dynamic art: a variant on an unchanged cell, or a coast turned into plain, is visibly redrawn', ()=>{
 const nodes=nodesOf(),plain=nodes.find(t=>t.type==='plaine'&&!t.name);plain.variant='champs';
 assert.equal(staleCount(nodes),1);let plan=planDynamic(nodes);
 assert(plan.ground.some(g=>g.t===plain&&g.pass===0),'sol de champs');assert(plan.motifs.some(m=>m.t===plain));
 plain.variant='';const coast=nodes.find(t=>t.type==='cote'&&!t.name);coast.type='plaine';
 plan=planDynamic(nodes);assert(plan.ground.some(g=>g.t===coast&&g.pass===0),'une côte devenue plaine change de sol');
 const cliff=nodes.find(t=>t.type==='cote'&&!t.name&&t!==coast);cliff.variant='falaise';
 plan=planDynamic(nodes);assert(plan.ground.some(g=>g.t===cliff&&g.pass===3&&GROUND_PATCHES.shoreCliff.includes(g.rect)),'bande de falaise');
});
