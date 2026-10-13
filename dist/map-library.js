import {europeBoard} from './europe.js';

export const EDITABLE_TERRAINS=new Set(['mer','cote','plaine','moyenne_montagne','montagne','col','ville']);
const base=europeBoard('Paris','Istanbul');
const editable=new Map(Object.values(base.board).filter(t=>!t.name).map(t=>[`${t.q},${t.r}`,t]));

export function normalizeMap(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||!input.cells||typeof input.cells!=='object'||Array.isArray(input.cells))throw Error('Fichier de carte invalide.');
 const name=String(input.name||'Carte personnalisée').trim().slice(0,60)||'Carte personnalisée';
 const effort=Number(input.terrain?.col??input.colEffort??3);
 if(!Number.isInteger(effort)||effort<0||effort>10)throw Error('L’effort du col doit être un entier de 0 à 10.');
 const entries=Object.entries(input.cells);
 if(entries.length>editable.size)throw Error('La carte contient trop de cases modifiées.');
 const cells={};
 for(const [key,patch] of entries){
  if(!editable.has(key)||!patch||typeof patch!=='object'||Array.isArray(patch)||!EDITABLE_TERRAINS.has(patch.type))throw Error('Case de carte invalide : '+key);
  const cityName=patch.type==='ville'?String(patch.name||'Ville personnalisée').trim().slice(0,40)||'Ville personnalisée':'';
  cells[key]={type:patch.type,name:cityName};
 }
 return {version:2,name,cells,terrain:{col:effort}};
}

export function applyMap(game,map){
 if(game?.mode!=='plateau')return game;
 const definition=normalizeMap(map);
 for(const t of Object.values(game.board)){
  const patch=definition.cells[`${t.q},${t.r}`];
  if(patch&&!t.name){t.type=patch.type;t.name=patch.name;}
 }
 return game;
}
