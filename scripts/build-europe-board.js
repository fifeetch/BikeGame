import {readFile, writeFile} from 'node:fs/promises';
import {MAP_CELLS as sourceCells} from '../dist/assets/europe/board-data.js';
import {CITY_ANCHORS} from '../dist/europe.js';

const width=1261,height=842,originX=630,originY=50,stepX=29,stepY=1.5*stepX/Math.sqrt(3),radius=stepX/Math.sqrt(3),grid=[];
for(let r=-1;r<=31;r++){
 const y=originY+stepY*r;if(y<radius||y>height-radius)continue;
 for(let q=-40;q<=40;q++){
  const x=originX+stepX*q-14.5*r;
  if(x>=radius*.8660254&&x<=width-radius*.8660254)grid.push({q,r,x:Number(x.toFixed(3)),y:Number(y.toFixed(3))});
 }
}
const sourceAt=c=>sourceCells.reduce((best,s)=>Math.hypot(s.x-c.x,s.y-c.y)<Math.hypot(best.x-c.x,best.y-c.y)?s:best);
for(const c of grid){const s=sourceAt(c);c.type=Math.hypot(s.x-c.x,s.y-c.y)<=22.5?s.type:'mer';c.name='';}
const axial=new Map(grid.map(c=>[`${c.q},${c.r}`,c]));
for(const [name,[x,y]] of Object.entries(CITY_ANCHORS).sort((a,b)=>a[1][1]-b[1][1]||a[1][0]-b[1][0])){
 const options=[...grid].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));
 const cell=options.find(c=>!c.name&&c.type!=='mer')||options.find(c=>!c.name);
 cell.type='ville';cell.name=name;
}
const directions=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]];
for(const c of grid){if(c.type==='mer'||c.name)continue;if(directions.some(([dq,dr])=>axial.get(`${c.q+dq},${c.r+dr}`)?.type==='mer'))c.type='cote';}
grid.sort((a,b)=>a.r-b.r||a.q-b.q);
await writeFile(new URL('../dist/assets/europe/board-data.js',import.meta.url),`export const MAP_CELLS=${JSON.stringify(grid)};\n`,'utf8');
console.log(`Grille régulière : ${grid.length} hexagones égaux, ${grid.filter(c=>c.type==='mer').length} de mer, ${Object.keys(CITY_ANCHORS).length} villes.`);
