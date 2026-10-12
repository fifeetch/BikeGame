import {cities,onLand,terrain} from './europe-legacy.js';

// One axial lattice is shared by geography, drawing, hit testing and movement.
// Cities use an existing cell: no extra point, resized tile or clipping at sea.
export const MAP_VERSION=3;
export const HEX_RADIUS=24;
export const HEX_DIRECTIONS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
export const hexKey=(q,r)=>`hex-${q}-${r}`;
export function hexCenter(q,r){
 return {x:24+Math.sqrt(3)*HEX_RADIUS*(q+r/2),y:24+1.5*HEX_RADIUS*r};
}
export function hexVertices(t){
 return Array.from({length:6},(_,i)=>{
  const angle=(i*60-90)*Math.PI/180;
  return [t.x+HEX_RADIUS*Math.cos(angle),t.y+HEX_RADIUS*Math.sin(angle)];
 });
}
export const axialDistance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));

export function europeBoard(from,to){
 const cells=new Map();
 for(let r=0;r<25;r++)for(let q=-13;q<37;q++){
  const {x,y}=hexCenter(q,r);
  if(x<HEX_RADIUS||x>1536-HEX_RADIUS||!onLand(x,y))continue;
  const key=hexKey(q,r);
  cells.set(`${q},${r}`,{id:cells.size+1,key,name:'',q,r,x,y,type:terrain(x,y),roads:[],rotation:0,links:[]});
 }
 const byName={};
 for(const [name,x,y] of cities){
  const t=[...cells.values()].filter(t=>!t.name).reduce((best,t)=>!best||Math.hypot(t.x-x,t.y-y)<Math.hypot(best.x-x,best.y-y)?t:best,null);
  if(!t)throw new Error('Case de ville absente : '+name);
  t.key='city-'+name;t.name=name;t.type=name==='Cap Nord'?'cote':'ville';byName[name]=t;
 }
 const board={},edges=[];
 for(const t of cells.values())board[t.key]=t;
 const link=(a,b,ferry=false)=>{
  if(a.links.includes(b.key))return;
  a.links.push(b.key);b.links.push(a.key);edges.push({a:a.key,b:b.key,ferry});
 };
 for(const t of cells.values())for(const [dq,dr] of HEX_DIRECTIONS){
  const n=cells.get(`${t.q+dq},${t.r+dr}`);
  if(n)link(t,n);
 }
 // Existing ferries remain the only exceptions to six-neighbour land movement.
 for(const [a,b] of [['Copenhague','Oslo'],['Londres','Paris'],['Dublin','Londres']])link(byName[a],byName[b],true);
 const start=byName[from],arrival=byName[to];
 if(!start||!arrival)throw new Error('Ville du voyage absente du plateau');
 start.id=0;
 return {board,edges,start:start.key,arrivalId:arrival.id};
}
