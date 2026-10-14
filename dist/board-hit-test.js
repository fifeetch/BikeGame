import {HEX_SPACING,HEX_ROW_STEP,HEX_DIRECTIONS,hexVertices} from './europe.js';

function contains(t,x,y){
 const vertices=hexVertices(t);let positive=false,negative=false;
 for(let i=0;i<6;i++){const a=vertices[i],b=vertices[(i+1)%6],cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);positive||=cross>1e-7;negative||=cross< -1e-7;}
 return !(positive&&negative);
}
export function createHexHitIndex(board){
 const cells=new Map(Object.values(board).map(t=>[`${t.q},${t.r}`,t]));
 return {
  atAxial(q,r){return cells.get(`${q},${r}`)||null;},
  atPoint(x,y){
   if(!Number.isFinite(x)||!Number.isFinite(y))return null;
   const rf=(y-50)/HEX_ROW_STEP,qf=(x-630)/HEX_SPACING+rf/2;
   let q=Math.round(qf),z=Math.round(-rf),third=Math.round(rf-qf);
   const dq=Math.abs(q-qf),dz=Math.abs(z+rf),dt=Math.abs(third-(rf-qf));
   if(dq>dz&&dq>dt)q=-z-third;else if(dz>dt)z=-q-third;
   const r=-z,candidates=[[0,0],...HEX_DIRECTIONS].map(([a,b])=>cells.get(`${q+a},${r+b}`)).filter(t=>t&&contains(t,x,y));
   candidates.sort((a,b)=>(a.x-x)**2+(a.y-y)**2-((b.x-x)**2+(b.y-y)**2)||a.key.localeCompare(b.key));
   return candidates[0]||null;
  }
 };
}
