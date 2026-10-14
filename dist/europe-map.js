import {hexVertices,HEX_RADIUS,HEX_SPACING,HEX_ROW_STEP,MAP_WIDTH,MAP_HEIGHT} from './europe.js';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const tilePolygons=board=>Object.values(board).map(t=>({key:t.key,points:hexVertices(t).map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}));
const names={mer:'Mer',plaine:'Plaine',moyenne_montagne:'Moyenne montagne',montagne:'Haute montagne',col:'Col mythique',ville:'Ville',cote:'Côte'};
export const tileLabel=(g,t,cost)=>`${t.name?t.name+' · ':''}${names[t.type]||t.type}${t.key===g.pos?' · position actuelle':''}${t.id===g.arrivalId?' · arrivée':''} · ${cost(g,t)} énergie`;
export function cityLabels(nodes){return nodes.filter(t=>t.name).map(t=>({key:t.key,name:t.name,x:t.x-35,y:t.y+19,width:70,height:18}));}
// One shared set of SVG paints and pictograms keeps the 2,700+ hexes lightweight.
export const tileArtwork=`<defs>
 <linearGradient id="tile-sea" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2c9bcc"/><stop offset=".55" stop-color="#127bb2"/><stop offset="1" stop-color="#075c94"/></linearGradient>
 <linearGradient id="tile-coast" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e9f8e5"/><stop offset=".53" stop-color="#b7e4d2"/><stop offset="1" stop-color="#6dbad0"/></linearGradient>
 <linearGradient id="tile-plain" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d8e8a4"/><stop offset=".52" stop-color="#9cc66d"/><stop offset="1" stop-color="#6eaa62"/></linearGradient>
 <linearGradient id="tile-hills" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f4d992"/><stop offset=".53" stop-color="#d9ad60"/><stop offset="1" stop-color="#ae874e"/></linearGradient>
 <linearGradient id="tile-mountain" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf2e7"/><stop offset=".48" stop-color="#aebcb3"/><stop offset="1" stop-color="#748e8f"/></linearGradient>
 <linearGradient id="tile-pass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d8c5ec"/><stop offset=".52" stop-color="#a38bc7"/><stop offset="1" stop-color="#73629b"/></linearGradient>
 <linearGradient id="tile-city" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7d298"/><stop offset=".55" stop-color="#e9a271"/><stop offset="1" stop-color="#c96f56"/></linearGradient>
 <symbol id="tile-icon-mer" viewBox="0 0 16 16"><path d="M1 6q2-2 4 0t4 0t4 0t3 0M1 11q2-2 4 0t4 0t4 0t3 0" fill="none" stroke="#dbf7ff" stroke-width="1.5" stroke-linecap="round"/></symbol>
 <symbol id="tile-icon-cote" viewBox="0 0 16 16"><path d="M1 3q3-1 5 2t4 2t5 3" fill="none" stroke="#fdf3ce" stroke-width="2"/><path d="M1 11q2-2 4 0t4 0" fill="none" stroke="#2f99b2" stroke-width="1.3"/></symbol>
 <symbol id="tile-icon-plaine" viewBox="0 0 16 16"><path d="M3 12l-1-4m1 4 2-3m5 3-1-6m1 6 3-4" fill="none" stroke="#3d8551" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="4" r="1" fill="#f4e8a2"/></symbol>
 <symbol id="tile-icon-moyenne_montagne" viewBox="0 0 16 16"><path d="M1 12 6 3l4 7 2-4 3 6Z" fill="#92794f"/><path d="m6 3 2.2 4H4Z" fill="#f8e5ab"/><path d="m12 6 1.5 3H10Z" fill="#edd2a0"/></symbol>
 <symbol id="tile-icon-montagne" viewBox="0 0 16 16"><path d="M1 13 6 2l3 6 2-4 4 9Z" fill="#617c85"/><path d="M6 2 8 6H4Z" fill="#fffdf0"/><path d="m11 4 1.8 4H9Z" fill="#f8fbf4"/></symbol>
 <symbol id="tile-icon-col" viewBox="0 0 16 16"><path d="M1 13 6 4l2 4 2-3 5 8Z" fill="#665c89"/><path d="M8 1v8M5 4h6" stroke="#fff2bf" stroke-width="1.4"/><circle cx="8" cy="4" r="1.6" fill="#fff7d3"/></symbol>
 <symbol id="tile-icon-ville" viewBox="0 0 16 16"><path d="M2 8 8 3l6 5" fill="#a84f3d"/><path d="M3 8h10v6H3Z" fill="#fff0ce"/><path d="M7 10h2v4H7Z" fill="#80584b"/><path d="M1 14h14" stroke="#875c4b" stroke-width="1"/></symbol>
</defs>`;
// A repeating paint preserves the sea grid without one DOM group per sea cell.
const seaHex=(x,y)=>hexVertices({x,y}).map(p=>p.join(',')).join(' ');
export const seaArtwork=`<defs><pattern id="board-sea-pattern" patternUnits="userSpaceOnUse" x="${630-HEX_SPACING/2}" y="${50-HEX_RADIUS}" width="${HEX_SPACING}" height="${2*HEX_ROW_STEP}">
${[[HEX_SPACING/2,HEX_RADIUS],[0,HEX_RADIUS+HEX_ROW_STEP],[HEX_SPACING,HEX_RADIUS+HEX_ROW_STEP]].map(([x,y])=>`<polygon points="${seaHex(x,y)}" fill="url(#tile-sea)" stroke="#fff8e7" stroke-width="1.15"/><use href="#tile-icon-mer" x="${x-7}" y="${y-7}" width="14" height="14"/>`).join('')}</pattern></defs>`;
export const polygonPoints=t=>hexVertices(t).map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ');
export const seaPath=board=>Object.values(board).filter(t=>t.type==='mer').map(t=>'M'+hexVertices(t).map(p=>p.map(v=>v.toFixed(2)).join(',')).join('L')+'Z').join('');
export function mapContext(g,reachable=[],cost=()=>0,selected='',route=[],nextSteps=[],editMode=false){
 return {g,cost,selected,editMode,available:new Set(reachable.map(t=>typeof t==='string'?t:t.key)),selectable:new Set(nextSteps),queued:new Map(route.map((key,i)=>[key,i+1])),visited:new Set(g.visited||[])};
}
export function tilePresentation(c,t){
 const {g,cost,selected,editMode,available,selectable,queued,visited}=c,canSelect=editMode||selectable.has(t.key)||queued.has(t.key);
 const states=[available.has(t.key)?'reachable':'',t.key===g.pos?'here':'',visited.has(t.key)?'visited':'',t.id===g.arrivalId?'destination':'',t.key===selected?'selected':'',queued.has(t.key)?'queued':'',selectable.has(t.key)?'next-step':'',!selectable.has(t.key)&&!queued.has(t.key)?'unavailable':'',editMode?'editable':''].filter(Boolean);
 return {className:`map-tile terrain-${t.type} ${states.join(' ')}`,canSelect,pressed:queued.has(t.key),label:(editMode?'Modifier '+(t.name||names[t.type]||t.type)+` · case ${t.q}, ${t.r}`:tileLabel(g,t,cost))+(canSelect&&!editMode?' · sélectionnable':'')};
}
export function playableMap(g,reachable,cost,selected='',route=[],nextSteps=[],editMode=false){
 const nodes=Object.values(g.board),c=mapContext(g,reachable,cost,selected,route,nextSteps,editMode);
 return `<svg class="playable-europe supplied-map ${editMode?'map-edit-mode':''}" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" aria-label="Plateau Europe sur grille régulière : chaque hexagone a la même taille">
 ${tileArtwork}${seaArtwork}<rect class="map-ocean" width="${MAP_WIDTH}" height="${MAP_HEIGHT}"/><path class="board-sea-face" fill="url(#board-sea-pattern)" d="${seaPath(g.board)}"/>
 <g class="hex-cells">${nodes.filter(t=>t.type!=='mer').map(t=>{const p=tilePresentation(c,t);return `<g class="${p.className}" data-board-key="${escape(t.key)}" ${p.canSelect?`data-move="${escape(t.key)}" role="button" tabindex="0"`:'aria-disabled="true"'} aria-label="${escape(p.label)}" aria-pressed="${p.pressed}"><polygon class="terrain-face" points="${polygonPoints(t)}"/><use class="terrain-icon" href="#tile-icon-${t.type}" x="${t.x-7}" y="${t.y-7}" width="14" height="14" aria-hidden="true"/></g>`;}).join('')}</g>
 <g class="city-names" aria-hidden="true">${cityLabels(nodes).map(c=>`<text class="city-name" data-city-key="${escape(c.key)}" x="${c.x+35}" y="${c.y+6}">${escape(c.name)}</text>`).join('')}</g>
 <g class="route-numbers" aria-hidden="true">${route.map((k,i)=>{const t=g.board[k];return t?`<g transform="translate(${t.x} ${t.y})"><circle r="9"/><text y="3">${i+1}</text></g>`:'';}).join('')}</g>
 <g class="map-symbols" aria-hidden="true">${(g.players||[]).map(p=>{const t=g.board[p.pos];if(!t)return '';const same=g.players.filter(a=>a.pos===p.pos),offset=(same.indexOf(p)-(same.length-1)/2)*14;return `<g class="rider-token" aria-label="${escape(p.name)}" transform="translate(${t.x+offset} ${t.y})"><circle class="rider-base" r="11" style="fill:${escape(p.color)};stroke:white"/><text class="player-number" y="4">${escape(p.id.slice(1))}</text></g>`;}).join('')}</g></svg>`;
}
