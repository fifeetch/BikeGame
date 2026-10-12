import {hexVertices} from './europe.js';

export const tilePolygons=board=>Object.values(board).map(t=>({key:t.key,points:hexVertices(t).map(p=>p.map(v=>v.toFixed(3)).join(',')).join(' ')}));
const terrainNames={plaine:'Plaine',montagne:'Montagne',ville:'Ville',cote:'Côte'};
export const tileLabel=(g,t,cost)=>`${t.name?t.name+' · ':''}${terrainNames[t.type]}${t.key===g.pos?' · position actuelle':''}${t.id===g.arrivalId?' · arrivée':''}${t.id===0?' · départ':''} · ${cost(g,t)} énergie`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Label placement uses map coordinates and remains identical at every zoom.
export function cityLabels(nodes){
 const occupied=[];
 return nodes.filter(t=>t.name).sort((a,b)=>a.y-b.y).map(t=>{
  const width=t.name.length*7.5+14,height=20;
  const candidates=[[t.x,t.y+29],[t.x,t.y-29],[t.x+width/2+16,t.y],[t.x-width/2-16,t.y],[t.x,t.y+47]];
  const overlap=box=>occupied.some(b=>box.x<b.x+b.width+3&&box.x+box.width+3>b.x&&box.y<b.y+b.height+3&&box.y+box.height+3>b.y);
  const boxes=candidates.map(([x,y])=>({x:Math.max(2,Math.min(1534-width,x-width/2)),y:Math.max(2,Math.min(1002,y-height/2)),width,height}));
  const box=boxes.find(b=>!overlap(b))||boxes[0];occupied.push(box);
  return {key:t.key,name:t.name,...box};
 });
}
export function playableMap(g,reachable,cost,selected=''){
 const nodes=Object.values(g.board),polygons=tilePolygons(g.board),available=new Set(reachable.map(t=>t.key)),visited=new Set(g.visited);
 const canMove=t=>available.has(t.key)&&g.phase==='move'&&!g.done&&g.energy>=cost(g,t);
 const states=t=>[canMove(t)?'reachable':available.has(t.key)?'unaffordable':'',t.key===g.pos?'here':'',visited.has(t.key)?'visited':'',t.id===g.arrivalId?'destination':'',t.id===0?'departure':'',t.key===selected?'selected':''].filter(Boolean).join(' ');
 const symbol=t=>t.type==='montagne'?'<path class="hex-mountain" d="M-13 6 -5-8 1 2 7-6 14 6Z"/>':t.type==='cote'?'<path class="hex-waves" d="M-11-3q3-5 7 0t7 0t7 0M-11 4q3-5 7 0t7 0t7 0"/>':t.type==='ville'?'<path class="hex-town" d="M-10 7V-3L-5-8 0-3V7M2 7V-7L6-11 10-7V7Z"/>':'<circle class="hex-plain" cy="1" r="2"/>';
 const points=Object.fromEntries(polygons.map(t=>[t.key,t.points]));
 const labels=cityLabels(nodes);
 return `<svg class="playable-europe" viewBox="0 0 1536 1024" aria-label="Plateau Europe : hexagones réguliers de même taille">
 <rect class="map-sea" width="1536" height="1024"/>
 <g class="map-water-labels" aria-hidden="true"><text x="220" y="530">OCÉAN ATLANTIQUE</text><text x="980" y="320">MER BALTIQUE</text><text x="640" y="885">MER MÉDITERRANÉE</text></g>
 <g class="hex-cells">${nodes.map(t=>`<g class="map-tile terrain-${t.type} ${states(t)}" data-move="${escape(t.key)}" role="button" tabindex="0" aria-label="${escape(tileLabel(g,t,cost))}" aria-pressed="${t.key===selected}"><title>${escape(tileLabel(g,t,cost))}</title><polygon class="terrain-face" points="${points[t.key]}"/><g class="hex-symbol" transform="translate(${t.x} ${t.y})" aria-hidden="true">${symbol(t)}</g></g>`).join('')}</g>
 <g class="map-ferries" aria-hidden="true">${g.edges.filter(e=>e.ferry).map(e=>{const a=g.board[e.a],b=g.board[e.b];return `<path d="M${a.x} ${a.y} L${b.x} ${b.y}"/>`;}).join('')}</g>
 <g class="map-symbols" aria-hidden="true">${labels.map(l=>`<g class="city-label"><rect x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}" rx="5"/><text class="map-city" x="${l.x+l.width/2}" y="${l.y+14}">${escape(l.name)}</text></g>`).join('')}
 ${nodes.filter(t=>t.id===g.arrivalId||t.id===0).map(t=>`<g transform="translate(${t.x+12} ${t.y-12})"><text class="map-flag" y="4">${t.id===g.arrivalId?'🏁':'🚩'}</text></g>`).join('')}
 <g class="rider-token" transform="translate(${g.board[g.pos].x} ${g.board[g.pos].y})"><ellipse class="rider-shadow" cy="11" rx="15" ry="5"/><circle class="rider-base" r="16"/><text class="map-marker rider" y="8">🚴</text></g></g></svg>`;
}
