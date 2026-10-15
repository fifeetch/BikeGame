import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import * as NET from '../dist/online.js';

test('partie en ligne : codes, plateau envoyé une seule fois, qui doit agir',()=>{
 assert.equal(NET.cleanCode('velo-4821'),'VELO-4821');assert.equal(NET.cleanCode(' 4821 '),'VELO-4821');assert.equal(NET.cleanCode('12'),'');
 assert.match(NET.makeCode(),/^VELO-\d{4}$/);
 const m=S.createMatch([{name:'Fi',bike:'gravel',voyage:'traversee'},{name:'Léa',bike:'randonneur',voyage:'soleil'}],'plateau',undefined,4);
 const {light,board}=NET.splitGame(m);assert(light.length<board.length/10,'l’état qui circule est léger');
 assert.deepEqual(JSON.parse(NET.joinGame(light,board)),JSON.parse(S.serialize(m)),'on retrouve la même partie');assert(S.load(NET.joinGame(light,board)));
 assert.equal(NET.actorId(m),'p1');m.activeIndex=1;assert.equal(NET.actorId(m),'p2');
 m.pendingAttack={targetId:'p1',actorId:'p2',cardId:'x'};assert.equal(NET.actorId(m),'p1','la cible d’une attaque répond');
 m.pendingAttack=null;m.phase='card-intervention';m.cardWindow={responders:['p1'],responderIndex:0};assert.equal(NET.actorId(m),'p1','le joueur qui peut intervenir');
});
