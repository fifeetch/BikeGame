import {MAP_CELLS} from './assets/europe/board-data.js';

export const MAP_VERSION=10;
// Ferries : de port à port, comme les liaisons réelles les plus utilisées.
export const FERRY_ROUTES=[['Calais','Douvres'],['Helsingør','Helsingborg'],['Hirtshals','Kristiansand'],['Ancona','Split'],['Thessalonique','Izmir']];
export const MAP_WIDTH=1261, MAP_HEIGHT=842, HEX_SPACING=29/Math.sqrt(2), HEX_RADIUS=HEX_SPACING/Math.sqrt(3), HEX_ROW_STEP=HEX_RADIUS*1.5;
export const HEX_DIRECTIONS=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]];
export const hexKey=(q,r)=>`hex-${q}-${r}`;
export function hexCenter(q,r){return {x:630+HEX_SPACING*q-HEX_SPACING/2*r,y:50+HEX_ROW_STEP*r};}
export function hexVertices(t){return Array.from({length:6},(_,i)=>{const a=(i*60-90)*Math.PI/180;return [t.x+HEX_RADIUS*Math.cos(a),t.y+HEX_RADIUS*Math.sin(a)];});}
export const axialDistance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q-a.r-b.q+b.r));

// City icons in the supplied board image. Lettering may cover a cell centre.
export const CITY_ANCHORS={Dublin:[231,260],Londres:[332,299],Paris:[350,420],Lisbonne:[67,620],Madrid:[186,596],Barcelone:[310,585],Bordeaux:[266,485],Lyon:[410,496],Milan:[513,515],Zurich:[532,452],Rome:[588,607],Venise:[628,510],Amsterdam:[469,322],Bruxelles:[424,364],Berlin:[627,333],Prague:[667,411],Vienne:[693,464],Zagreb:[722,521],Budapest:[783,481],Varsovie:[782,361],Belgrade:[802,541],Sarajevo:[752,582],Skopje:[839,619],Sofia:[891,574],Bucarest:[953,533],Athènes:[888,717],Thessalonique:[926,660],Istanbul:[1054,640],Copenhague:[587,263],Oslo:[588,193],Bergen:[513,180],Trondheim:[588,109],Narvik:[646,72],Stockholm:[693,192],Tallinn:[880,223],'Saint-Pétersbourg':[928,151],Riga:[865,274],Vilnius:[883,327],Moscou:[1055,274],Kiev:[1017,427],'Cap Nord':[630,48]};

export function europeBoard(from,to){
 const nodes=MAP_CELLS.map((c,i)=>({id:i+1,key:c.name?'city-'+c.name:hexKey(c.q,c.r),q:c.q,r:c.r,name:c.name||'',x:c.x,y:c.y,type:c.type,roads:[],rotation:0,links:[]}));
 const byName=Object.fromEntries(nodes.filter(t=>t.name).map(t=>[t.name,t]));
 const board={},edges=[];for(const t of nodes)board[t.key]=t;
 const link=(a,b,ferry=false)=>{if(!a||!b||a===b||a.links.includes(b.key))return;a.links.push(b.key);b.links.push(a.key);edges.push({a:a.key,b:b.key,ferry});};
 // Adjacency comes only from exact axial-grid neighbours. Sea hexes remain
 // visible but have no cycling links; ferries are explicit port-to-port edges.
 const byAxial=new Map(nodes.map(t=>[`${t.q},${t.r}`,t]));
 for(const a of nodes){if(a.type==='mer')continue;for(const [dq,dr] of HEX_DIRECTIONS){const b=byAxial.get(`${a.q+dq},${a.r+dr}`);if(b&&b.type!=='mer')link(a,b);}}
 // Port-to-port crossings are separate actions, never ordinary land steps.
 for(const [a,b] of FERRY_ROUTES)link(byName[a],byName[b],true);
 const start=byName[from],arrival=byName[to];if(!start||!arrival)throw Error('Ville du voyage absente du plateau');start.id=0;
 return {board,edges,start:start.key,arrivalId:arrival.id};
}
