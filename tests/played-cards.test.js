import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import {CLASSIC} from '../dist/rules.js';

test('played cards leave the hand and remain identifiable after saving',()=>{
 const m=S.createMatch([{name:'Alice',bike:'gravel',voyage:'traversee'},{name:'Bob',bike:'randonneur',voyage:'nord'}],'plateau',CLASSIC,123);
 const alice=m.players[0],bob=m.players[1],money=alice.money;
 alice.cardHand=['bonne-affaire','pluie-battante'];
 assert(S.playCard(m,0,alice.id));
 assert.equal(alice.money,money+2);
 assert.deepEqual(alice.cardHand,['pluie-battante']);
 assert(S.playCard(m,0,bob.id));
 assert.deepEqual(alice.cardHand,[]);
 assert.deepEqual(bob.pendingCards,['pluie-battante']);
 const played=m.history.filter(entry=>entry.kind==='card'&&entry.cardId);
 assert.deepEqual(played.map(entry=>[entry.cardId,entry.targetId]),[['bonne-affaire',alice.id],['pluie-battante',bob.id]]);
 const saved=S.load(S.serialize(m));
 assert.deepEqual(saved.history.filter(entry=>entry.kind==='card'&&entry.cardId),played);
});
