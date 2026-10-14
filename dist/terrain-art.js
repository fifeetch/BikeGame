// Fond de terrain illustré : UNE seule image posée sous le plateau SVG.
// Les hexagones SVG restent les cases de déplacement (clics, surbrillances, règles du jeu).
// L'image a été fabriquée à partir de la carte d'origine (MAP_CELLS). Si la carte est modifiée
// dans l'éditeur, terrain-dynamic.js redessine en direct les cases changées dans le même style peint
// (en attendant que ses images soient chargées, ou si elles échouent, on retombe sur l'ancien dessin à pictogrammes).
import {MAP_CELLS} from './assets/europe/board-data.js';
import {createDynamicLayer} from './terrain-dynamic.js';

export const TERRAIN_ART_SRC='./assets/terrain/europe-terrain.webp';
export const TERRAIN_ART_STORAGE='aventure-velo-illustrations';

// Type de chaque case au moment où l'image a été fabriquée.
const baked=new Map(MAP_CELLS.map(c=>[`${c.q},${c.r}`,c.type]));
// La clé du jeu est "hex-q-r" ; on la convertit pour comparer.
const bakedType=t=>baked.get(`${t.q},${t.r}`);
export const isCellStale=t=>bakedType(t)!==t.type;

export function readArtPreference(storage=globalThis.localStorage){
 try{return storage?.getItem(TERRAIN_ART_STORAGE)!=='off';}catch{return true;}
}
export function writeArtPreference(on,storage=globalThis.localStorage){
 try{storage?.setItem(TERRAIN_ART_STORAGE,on?'on':'off');}catch{/* stockage indisponible : on ignore */}
}

// Crée l'élément <img> du fond. Renvoie null si l'environnement n'a pas de vrai DOM (tests).
export function createTerrainLayer(container,{src=TERRAIN_ART_SRC}={}){
 const doc=container?.ownerDocument;
 if(!doc||typeof doc.createElement!=='function')return null;
 const img=doc.createElement('img');
 img.className='terrain-art';img.alt='';img.draggable=false;img.decoding='async';
 img.setAttribute('aria-hidden','true');
 let ready=false,failed=false;const listeners=new Set();
 img.addEventListener?.('load',()=>{ready=true;listeners.forEach(fn=>fn(true));});
 img.addEventListener?.('error',()=>{failed=true;listeners.forEach(fn=>fn(false));});
 img.src=src;
 container.append(img);
 return {
  el:img,
  get ready(){return ready;},
  get failed(){return failed;},
  onStatus(fn){listeners.add(fn);if(ready)fn(true);if(failed)fn(false);},
  dynamic:createDynamicLayer(container),
  destroy(){img.remove();this.dynamic?.destroy();listeners.clear();}
 };
}
