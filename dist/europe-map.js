import {land} from './europe.js';
// Partition the land into non-overlapping playable tiles. Keep the existing
// node keys and connections, so saved journeys and their objectives still work.
let cachedBoard, cachedTiles;
export function tilePolygons(board){
 if(board===cachedBoard)return cachedTiles;
 const nodes=Object.values(board);
 const tiles=nodes.map(a=>{
  let polygon=[[0,0],[1536,0],[1536,1024],[0,1024]];
  for(const b of nodes){
   if(a===b)continue;
   const dx=b.x-a.x,dy=b.y-a.y,limit=(b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2;
   const next=[];
   for(let i=0;i<polygon.length;i++){
    const u=polygon[i],v=polygon[(i+1)%polygon.length];
    const du=u[0]*dx+u[1]*dy-limit,dv=v[0]*dx+v[1]*dy-limit;
    if(du<=0)next.push(u);
    if((du<=0)!==(dv<=0)){const ratio=du/(du-dv);next.push([u[0]+ratio*(v[0]-u[0]),u[1]+ratio*(v[1]-u[1])]);}
   }
   polygon=next;if(!polygon.length)break;
  }
  return {key:a.key,points:polygon.map(p=>p.map(n=>Math.round(n*100)/100).join(',')).join(' ')};
 });
 cachedBoard=board;cachedTiles=tiles;return tiles;
}
export function playableMap(g,reachable,cost){
 const nodes=Object.values(g.board),byKey=new Map(tilePolygons(g.board).map(t=>[t.key,t.points]));
 const states=t=>[reachable.includes(t)&&g.phase==='move'&&!g.done?'reachable':'',t.key===g.pos?'here':'',g.visited.includes(t.key)?'visited':'',t.id===g.arrivalId?'destination':'',t.id===0?'departure':''].filter(Boolean).join(' ');
 const label=t=>`${t.name||({plaine:'Plaine',montagne:'Montagne',ville:'Ville',cote:'Côte'})[t.type]}${t.key===g.pos?' · position actuelle':''}${t.id===g.arrivalId?' · destination':''}${t.id===0?' · départ':''} · ${cost(g,t)} énergie`;
 return `<svg class="playable-europe" viewBox="0 0 1536 1024" aria-label="Europe : chaque tuile de terrain est une case jouable"><defs><clipPath id="europe-land">${land.map(p=>`<polygon points="${p.map(v=>v.join(',')).join(' ')}"/>`).join('')}${nodes.filter(t=>t.name).map(t=>`<circle cx="${t.x}" cy="${t.y}" r="18"/>`).join('')}</clipPath></defs><g clip-path="url(#europe-land)">${nodes.map(t=>`<g class="map-tile ${states(t)}" data-move="${t.key}" role="button" tabindex="${reachable.includes(t)?0:-1}" aria-disabled="${!(reachable.includes(t)&&g.phase==='move'&&!g.done)}" aria-label="${label(t)}"><title>${label(t)}</title><polygon class="terrain-face terrain-${t.type}" points="${byKey.get(t.key)}"/></g>`).join('')}</g><g class="map-ferries" aria-hidden="true">${g.edges.filter(e=>e.ferry).map(e=>{const a=g.board[e.a],b=g.board[e.b];return `<path d="M${a.x} ${a.y} L${b.x} ${b.y}"/>`;}).join('')}</g><g class="map-symbols" aria-hidden="true">${nodes.map(t=>`<text class="terrain-symbol" x="${t.x}" y="${t.y+5}">${t.type==='montagne'?'▲':t.type==='cote'?'≈':t.type==='ville'?'▪':'·'}</text>`).join('')}${nodes.filter(t=>t.name).map(t=>`<text class="map-city" x="${t.x}" y="${t.y+26}">${t.name}</text>`).join('')}${nodes.filter(t=>t.key===g.pos||t.id===g.arrivalId||t.id===0).map(t=>`<g transform="translate(${t.x} ${t.y})"><text class="map-marker ${t.key===g.pos?'rider':''}" y="7">${t.key===g.pos?'🚴':t.id===g.arrivalId?'🏁':'🚩'}</text></g>`).join('')}</g></svg>`;
}
