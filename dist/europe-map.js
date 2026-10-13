import {hexVertices,HEX_RADIUS,MAP_WIDTH,MAP_HEIGHT} from './europe.js';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const tilePolygons=board=>Object.values(board).map(t=>({key:t.key,points:hexVertices(t).map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}));
const names={mer:'Mer',plaine:'Plaine',moyenne_montagne:'Moyenne montagne',montagne:'Haute montagne',ville:'Ville',cote:'Côte'};
export const tileLabel=(g,t,cost)=>`${t.name?t.name+' · ':''}${names[t.type]||t.type}${t.key===g.pos?' · position actuelle':''}${t.id===g.arrivalId?' · arrivée':''} · ${cost(g,t)} énergie`;
export function cityLabels(nodes){return nodes.filter(t=>t.name).map(t=>({key:t.key,name:t.name,x:t.x-35,y:t.y+19,width:70,height:18}));}
const marks={mer:'≈',cote:'',plaine:'·',moyenne_montagne:'⌃',montagne:'▲',ville:'●'};
export function playableMap(g,reachable,cost,selected='',route=[],nextSteps=[]){
 const nodes=Object.values(g.board),available=new Set(reachable.map(t=>t.key)),selectable=new Set(nextSteps),queued=new Map(route.map((key,i)=>[key,i+1])),visited=new Set(g.visited||[]);
 const points=Object.fromEntries(tilePolygons(g.board).map(t=>[t.key,t.points]));
 const states=t=>[available.has(t.key)?'reachable':'',t.key===g.pos?'here':'',visited.has(t.key)?'visited':'',t.id===g.arrivalId?'destination':'',t.key===selected?'selected':'',queued.has(t.key)?'queued':'',selectable.has(t.key)?'next-step':'',!selectable.has(t.key)&&!queued.has(t.key)?'unavailable':''].filter(Boolean).join(' ');
 return `<svg class="playable-europe supplied-map" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" aria-label="Plateau Europe sur grille régulière : chaque hexagone a la même taille">
 <rect class="map-ocean" width="${MAP_WIDTH}" height="${MAP_HEIGHT}"/>
 <g class="hex-cells">${nodes.map(t=>{const canSelect=selectable.has(t.key)||queued.has(t.key),coast=t.type==='cote'?`<path class="coast-water" d="M${t.x} ${t.y-HEX_RADIUS}L${t.x} ${t.y+HEX_RADIUS}L${t.x-HEX_RADIUS*.8660254} ${t.y+HEX_RADIUS*.5}L${t.x-HEX_RADIUS*.8660254} ${t.y-HEX_RADIUS*.5}Z"/><path class="coast-seam" d="M${t.x} ${t.y-HEX_RADIUS}L${t.x} ${t.y+HEX_RADIUS}"/>`:'';return `<g class="map-tile terrain-${t.type} ${states(t)}" ${canSelect?`data-move="${escape(t.key)}" role="button" tabindex="0"`:'aria-disabled="true"'} aria-label="${escape(tileLabel(g,t,cost))}${canSelect?' · sélectionnable':' · non accessible depuis cette étape'}" aria-pressed="${queued.has(t.key)}"><title>${escape(tileLabel(g,t,cost))}${canSelect?' · Sélectionner cette étape':' · Case non accessible depuis cette étape'}</title><polygon class="terrain-face" points="${points[t.key]}"/>${coast}<text class="terrain-mark" x="${t.x}" y="${t.y+4}">${marks[t.type]||''}</text></g>`;}).join('')}</g>
 <g class="city-names" aria-hidden="true">${cityLabels(nodes).map(c=>`<text class="city-name" x="${c.x+35}" y="${c.y+6}">${escape(c.name)}</text>`).join('')}</g>
 <g class="route-numbers" aria-hidden="true">${route.map((k,i)=>{const t=g.board[k];return t?`<g transform="translate(${t.x} ${t.y})"><circle r="9"/><text y="3">${i+1}</text></g>`:'';}).join('')}</g>
 <g class="map-symbols" aria-hidden="true">
 ${(g.players||[]).map(p=>{const t=g.board[p.pos];if(!t)return '';const same=g.players.filter(a=>a.pos===p.pos),offset=(same.indexOf(p)-(same.length-1)/2)*14;return `<g class="rider-token" transform="translate(${t.x+offset} ${t.y})"><title>${escape(p.name)}</title><circle class="rider-base" r="11" style="fill:${escape(p.color)};stroke:white"/><text class="player-number" y="4">${escape(p.id.slice(1))}</text></g>`;}).join('')}</g></svg>`;
}
