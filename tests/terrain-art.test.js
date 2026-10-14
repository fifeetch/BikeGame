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
