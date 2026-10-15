// 20 cartes Voyage (15 octobre 2026) : points selon la longueur, objectifs de cases.
import test from 'node:test';
import assert from 'node:assert/strict';
import {voyages,VOYAGE_LENGTHS,voyageTier,voyagePoints,progress} from '../dist/voyages.js';
import {europeBoard} from '../dist/europe.js';

function shortest(from,to){const b=europeBoard(from,to),arr=Object.values(b.board).find(t=>t.id===b.arrivalId),d=new Map([[b.start,0]]),q=[b.start];
 while(q.length){const k=q.shift();for(const n of b.board[k].links){if(d.has(n)||b.board[n].type==='mer')continue;d.set(n,d.get(k)+1);q.push(n);}}return d.get(arr.key);}

test('20 voyages, villes existantes, longueur enregistrée = trajet le plus court',()=>{
 assert.equal(voyages.length,20);assert.equal(new Set(voyages.map(v=>v.id)).size,20);
 for(const v of voyages){assert.equal(VOYAGE_LENGTHS[v.id],shortest(v.from,v.to),v.id);assert(progress({voyage:v.id,travelHistory:[],mode:'plateau'}).rows.length>=2,v.id);}
});
test('points selon la longueur : courte 6, moyenne 9, longue 12, très longue 15',()=>{
 assert.equal(voyagePoints('grece'),6);assert.equal(voyagePoints('alpes'),9);assert.equal(voyagePoints('fjords'),12);assert.equal(voyagePoints('traversee'),15);
 for(const v of voyages)assert([6,9,12,15].includes(voyagePoints(v)),v.id);
});
