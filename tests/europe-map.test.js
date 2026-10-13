import {test} from 'node:test';
import assert from 'node:assert/strict';
import {europeBoard,hexVertices,HEX_RADIUS} from '../dist/europe.js';
import {tilePolygons,playableMap,cityLabels} from '../dist/europe-map.js';

test('every terrain including cities and coastal cells has the same six sides, radius and area',()=>{
 const {board}=europeBoard('Paris','Istanbul');
 assert.equal(tilePolygons(board).length,Object.keys(board).length);
 const expectedArea=3*Math.sqrt(3)*HEX_RADIUS**2/2;
 for(const t of Object.values(board)){
  const p=hexVertices(t);assert.equal(p.length,6);
  for(let i=0;i<6;i++){assert(Math.abs(Math.hypot(p[i][0]-t.x,p[i][1]-t.y)-HEX_RADIUS)<1e-8);const n=p[(i+1)%6];assert(Math.abs(Math.hypot(n[0]-p[i][0],n[1]-p[i][1])-HEX_RADIUS)<1e-8);}
  const area=Math.abs(p.reduce((s,v,i)=>{const n=p[(i+1)%6];return s+v[0]*n[1]-v[1]*n[0];},0))/2;
  assert(Math.abs(area-expectedArea)<1e-6,t.key);
 }
});

test('drawing and hit targets use one whole hex per cell without an illustrated background or coastline clipping',()=>{
 const {board,edges,start,arrivalId}=europeBoard('Paris','Istanbul');
 const g={board,edges,pos:start,arrivalId,visited:[start],phase:'move',energy:10};
 const html=playableMap(g,board[start].links.map(k=>board[k]),()=>1,start);
 assert.equal((html.match(/data-move=/g)||[]).length,Object.keys(board).length);
 assert(!html.includes('<img'));assert(!html.includes('<image'));assert(!html.includes('clip-path'));
 assert(html.includes('reachable'));assert(html.includes('role="button"'));assert(html.includes('aria-pressed="true"'));
 assert.equal((html.match(/class="city-label"/g)||[]).length,30);
 const labels=cityLabels(Object.values(board));
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];assert(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),'Overlapping labels '+a.name+' / '+b.name);}
});

test('neighbours with insufficient energy are inspectable but are not highlighted as available',()=>{
 const {board,edges,start,arrivalId}=europeBoard('Paris','Istanbul');
 const g={board,edges,pos:start,arrivalId,visited:[start],phase:'move',energy:0};
 const html=playableMap(g,board[start].links.map(k=>board[k]),()=>1);
 assert(!html.includes(' reachable'));assert(html.includes('unaffordable'));assert(html.includes('tabindex="0"'));
});

test('mythic passes have a distinct map variant and accessible label',()=>{
 const {board,edges,start,arrivalId}=europeBoard('Paris','Istanbul');
 const pass=Object.values(board).find(t=>t.type==='montagne');pass.type='col';
 const g={board,edges,pos:start,arrivalId,visited:[start],phase:'move',energy:10};
 const html=playableMap(g,[],()=>4);
 assert(html.includes('terrain-col'));
 assert(html.includes('Col mythique'));
 assert(html.includes('tile-icon-col'));
 assert(html.includes('4 énergie'));
});
