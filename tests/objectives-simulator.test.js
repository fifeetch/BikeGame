import {test} from 'node:test';import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';import {CLASSIC,clone} from '../dist/rules.js';
import {voyages,progress} from '../dist/voyages.js';
const match=id=>S.createMatch([{name:'Cycliste',bike:'gravel',voyage:id}],'plateau',CLASSIC,19);
function route(m,target,forbidden=new Set()){
 const pos=S.player(m).pos,queue=[[pos]],seen=new Set([pos]);
 for(let i=0;i<queue.length;i++){const path=queue[i],k=path.at(-1);if(k===target)return path.slice(1);for(const n of m.board[k].links)if(!seen.has(n)&&!forbidden.has(n)){seen.add(n);queue.push([...path,n]);}}throw Error('No path');
}
function ride(m,path){for(const k of path){if(S.player(m).completed)return;if(m.moved===5){S.endTurn(m);S.resolve(m,'decline');}S.player(m).energy=10;assert(S.move(m,k));}}
function chain(m,type,length){const p=S.player(m),v=voyages.find(v=>v.id===p.voyage),excluded=new Set([...p.visited,...Object.values(m.board).filter(t=>[v.from,v.to].includes(t.name)).map(t=>t.key)]);
 const grow=keys=>{if(keys.length===length)return keys;for(const n of m.board[keys.at(-1)].links)if(!excluded.has(n)&&!keys.includes(n)&&m.board[n].type===type){const found=grow([...keys,n]);if(found)return found;}};
 for(const t of Object.values(m.board)){if(t.type!==type||excluded.has(t.key))continue;const run=grow([t.key]);if(!run)continue;let entry;try{entry=route(m,run[0],new Set(run.slice(1)));}catch{continue;}ride(m,[...entry,...run.slice(1)]);return;}throw Error('No chain');
}
test('all five objectives remain achievable through connected daily simulator movements',()=>{
 const stops={traversee:['Lyon','Zurich','Venise','Marseille','Barcelone','Madrid','Lisbonne','Vienne','Zagreb','Bucarest','Istanbul'],soleil:['Marseille','Venise','Zurich','Vienne','Zagreb','Rome'],alpes:['Zurich','Vienne','Prague','Berlin','Vienne'],campagne:['Berlin','Varsovie','Budapest','Vienne','Prague'],nord:['Oslo','Bergen','Trondheim','Narvik','Cap Nord']};
 for(const [id,names]of Object.entries(stops)){const m=match(id);chain(m,'plaine',5);chain(m,'montagne',4);chain(m,'cote',4);if(id==='nord')chain(m,'montagne',2);for(const name of names){if(S.player(m).completed)break;ride(m,route(m,'city-'+name));}assert(progress(S.view(m)).ready,id);assert(S.player(m).completed,id);assert(!m.done,'winning move still has a day-end event');S.endTurn(m);assert(m.event);S.resolve(m,'decline');assert(m.done,id);assert.equal(m.phase,'finished');}
});
test('restaurant remains available with configurable prices and recovery',()=>{const m=match('alpes');while(m.pendingAttack)assert(S.resolveEventAttack(m,{bonusIndex:0,resource:'food'}));const p=S.player(m);p.energy=1;const r=clone(m.rules);r.food.restaurantPrice=2;r.food.restaurantEnergy=6;S.updateRules(m,r);assert(S.restaurant(m));assert.equal(p.money,8);assert.equal(p.energy,7);assert.equal(m.round,1);assert(!S.restaurant(m));});
test('migration retains objective history, current day and statistics',()=>{const old={...JSON.parse(S.serialize(match('alpes')))};const p=S.player(old);p.availableDay=4;old.round=4;old.turn=4;const restored=S.load(S.serialize(old));assert.equal(restored.round,4);const invalid=clone(old);delete invalid.players[0].stats;assert.throws(()=>S.load(JSON.stringify(invalid)));});
