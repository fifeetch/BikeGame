import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,CARD_PRESETS,MAX_CUSTOM_CARDS,cardById,makeCustomCard,normalizeCustomCards} from '../dist/cards.js';
import {renderCardEditor} from '../dist/card-editor.js';
import * as S from '../dist/simulator.js';
import {CLASSIC} from '../dist/rules.js';

const positive=makeCustomCard({id:'custom-belle-echappee',title:'Belle échappée',template:'coup-boost'});
const negative=makeCustomCard({id:'custom-averse',title:'Grosse averse',template:'pluie-battante'});

test('catalogue lists every current and archived card and offers positive/negative effects',()=>{
 assert.equal(CARD_PRESETS.length,12);
 assert.equal(CARDS.filter(card=>card.legacy).length,5);
 const html=renderCardEditor([positive],{id:'',title:'',template:'coup-boost'});
 for(const card of CARDS)assert(html.includes(card.title),card.id);
 assert(html.includes('id="card-editor-kind"'));
 assert(html.includes('id="card-editor-preset"'));
 assert(html.includes('id="import-cards"'));
 assert(html.includes('Belle échappée'));
});

test('custom cards accept only known effect presets and bounded unique identities',()=>{
 assert.deepEqual(makeCustomCard({...positive,effect:{money:999}}).effect,{energy:2});
 assert.equal(normalizeCustomCards([{id:positive.id,title:positive.title,template:positive.template}])[0].text,'+2 énergie.');
 assert.throws(()=>makeCustomCard({id:'custom-bad',title:'Triche',template:'unknown'}));
 assert.throws(()=>normalizeCustomCards([positive,positive]));
 assert.throws(()=>normalizeCustomCards(Array(MAX_CUSTOM_CARDS+1).fill(positive)));
});

test('new cards are playable, limited in solo, and embedded in saved games',()=>{
 const solo=S.createMatch([{name:'Solo',bike:'gravel',voyage:'traversee'}],'plateau',CLASSIC,4,[positive,negative]);
 solo.cardVersion=2;
 const soloDraws=Array.from({length:100},()=>S.drawCard(solo));
 assert(soloDraws.includes(positive.id));
 assert(!soloDraws.includes(negative.id));
 const m=S.createMatch([{name:'Alice',bike:'gravel',voyage:'traversee'},{name:'Bob',bike:'gravel',voyage:'soleil'}],'plateau',CLASSIC,4,[positive,negative]);
 m.cardVersion=2;
 for(const p of m.players)p.cardHand=[];
 const alice=m.players[0],bob=m.players[1];alice.cardHand=[positive.id,negative.id];alice.energy=5;
 assert(S.playCard(m,0,alice.id));assert.equal(alice.energy,7);
 assert(S.playCard(m,0,bob.id));assert.deepEqual(bob.pendingCards,[negative.id]);
 const restored=S.load(S.serialize(m));
 assert.equal(cardById(negative.id,restored).title,'Grosse averse');
 restored.activeIndex=1;restored.phase='card-resolution';
 assert(S.resolvePendingCard(restored));
 assert.equal(restored.players[1].turnModifiers.distancePenalty,1);
});
