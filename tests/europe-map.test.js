import {test} from 'node:test';
import assert from 'node:assert/strict';
import {europeBoard} from '../dist/europe.js';
import {tilePolygons,playableMap} from '../dist/europe-map.js';

test('every saved board space has a non-overlapping playable terrain polygon',()=>{
 const {board}=europeBoard('Paris','Istanbul');
 const polygons=tilePolygons(board);assert.equal(polygons.length,Object.keys(board).length);
 for(const tile of polygons){
  const node=board[tile.key],p=tile.points.split(' ').map(v=>v.split(',').map(Number));
  assert(p.length>=3,tile.key);
  // Every face is confined to its own nearest-node region.
  for(const [x,y] of p)for(const other of Object.values(board)){
   const own=(x-node.x)**2+(y-node.y)**2,foreign=(x-other.x)**2+(y-other.y)**2;
   assert(own<=foreign+25,`${tile.key}: overlapping neighbour ${other.key}`);
  }
 }
});
test('the terrain polygons are the movement targets, with no raster board underneath',()=>{
 const {board,edges,start,arrivalId}=europeBoard('Paris','Istanbul');
 const g={board,edges,pos:start,arrivalId,visited:[start],phase:'move'};
 const html=playableMap(g,board[start].links.map(k=>board[k]),()=>1);
 assert.equal((html.match(/data-move=/g)||[]).length,Object.keys(board).length);
 assert(!html.includes('<img'));assert(html.includes('clip-path="url(#europe-land)"'));
 assert(html.includes('map-tile reachable'));assert(html.includes('role="button"'));
});
