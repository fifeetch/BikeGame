import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {artFor, shapes} from '../dist/tile-art.js';
import * as E from '../dist/engine.js';
test('every terrain and orientation has illustration exits matching the engine',()=>{
  for(const type of Object.keys(E.terrains))for(const roads of shapes)for(let rotation=0;rotation<4;rotation++){
    const tile={type,roads,rotation},art=artFor(tile);
    assert(art);assert(existsSync(new URL('../dist/'+art.src,import.meta.url)));
    assert.deepEqual(shapes[art.shape].map(d=>(d+art.rotation)%4).sort(),E.roads(tile).sort());
  }
});
test('restaurant requires a town and payment and caps recovery',()=>{
  const g=E.makeGame('gravel',42);g.energy=8;g.money=2;
  assert(E.recover(g,'restaurant'));assert.equal(g.energy,10);assert.equal(g.money,1);
  assert(!E.recover(g,'restaurant'));assert.equal(g.money,1);
  g.board[g.pos].type='plaine';g.energy=3;assert(!E.recover(g,'restaurant'));
});
