// Routes JOUABLES du plateau Europe (mode Plateau).
// Les données viennent de assets/europe/routes-data.js : pour chaque case, les côtés (0 à 5) qui portent une route,
// dans l'ordre des directions de la grille HEX_DIRECTIONS = [[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]].
// Un pas est « sur la route » quand le côté traversé porte une route sur les deux cases.
import {ROAD_CELLS} from './assets/europe/routes-data.js';
const HEX_DIRECTIONS=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]];// mêmes directions que europe.js

const SIDES=new Map(ROAD_CELLS.map(([q,r,s])=>[`${q},${r}`,s]));

// Donne à chaque case du plateau ses côtés de route (t.roads). Les cases de mer n'en ont jamais.
export function applyRoads(board){
 for(const t of Object.values(board||{}))if(Number.isInteger(t.q)&&Number.isInteger(t.r))t.roads=t.type==='mer'?[]:[...(SIDES.get(`${t.q},${t.r}`)||[])];
 return board;
}
// Côté (0 à 5) de la case a qui touche la case b ; -1 si elles ne sont pas voisines.
export const sideTowards=(a,b)=>a&&b?HEX_DIRECTIONS.findIndex(([dq,dr])=>a.q+dq===b.q&&a.r+dr===b.r):-1;
// Le pas de a vers b suit-il une route ?
export function isRoadStep(a,b){
 const d=sideTowards(a,b);if(d<0||a.type==='mer'||b.type==='mer')return false;
 return Boolean(a.roads?.includes(d)&&b.roads?.includes((d+3)%6));
}
export const hasRoad=t=>Boolean(t?.roads?.length);
// Toutes les liaisons de route du plateau (paires de clés), pour le dessin.
export function roadEdges(board){
 const byAxial=new Map(Object.values(board).map(t=>[`${t.q},${t.r}`,t])),out=new Set();
 for(const a of Object.values(board))for(const d of a.roads||[]){const [dq,dr]=HEX_DIRECTIONS[d]||[],b=byAxial.get(`${a.q+dq},${a.r+dr}`);
  if(b&&a.links?.includes(b.key)&&isRoadStep(a,b))out.add(a.key<b.key?a.key+'|'+b.key:b.key+'|'+a.key);}
 return out;
}
