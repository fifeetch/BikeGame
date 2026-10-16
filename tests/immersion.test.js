import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import {CLASSIC,clone} from '../dist/rules.js';
import {voyages} from '../dist/voyages.js';
import {SCENES,SITUATIONS,COMPANIONS,demandOdds,fillVariants,oddsLabel} from '../dist/immersion.js';

const immRules=()=>{const r=clone(CLASSIC);r.immersion.enabled=true;return r;};
const solo=(seed=7,items=['tente','rechaud'])=>S.createMatch([{name:'Solo',bike:'gravel',voyage:voyages[0].id,items}],'plateau',immRules(),seed);
// Joue des journées simples : roule tant que possible, répond toujours au premier choix possible.
function playDays(m,days,onScene=()=>{}){const start=m.round;for(let i=0;i<days*20&&!m.done&&m.round<start+days;i++){
 if(m.phase==='encounter'){const e=S.currentEncounter(m);onScene(m,e);const ok=e.choices.map((c,j)=>j).filter(j=>S.canChooseEncounter(m,j));assert.ok(S.resolveEncounter(m,ok[0]??0),'choix impossible : '+e.id);continue;}
 if(m.phase==='voyage-choice'){S.chooseNewVoyage(m,S.player(m).voyageChoices[0]);continue;}
 const p=S.player(m),mv=S.moves(m);if(mv.length&&p.energy>2&&m.moved<3){S.move(m,mv[0].key);continue;}
 if(!m.moved&&p.energy<4&&(S.rest(m,'demander')||S.rest(m,'bivouac')))continue;S.endTurn(m);}}

test('Mode original inchangé : pas d’immersion par défaut', ()=>{
 assert.equal(CLASSIC.immersion.enabled,false);
 const m=S.createMatch([{name:'A',bike:'gravel',voyage:voyages[0].id,items:[]}],'plateau',CLASSIC,3);
 assert.ok(!m.immersion);assert.ok(m.eventCardIds.length>0);
});

test('Mode Immersion : météo annoncée, plus de cartes Événement', ()=>{
 const m=solo();
 assert.equal(m.immersion,true);assert.equal(m.forecast,true);assert.equal(m.encounters,true);
 assert.equal(m.eventCardIds.length,0);assert.equal(S.player(m).cardHand.length,0);
});

test('Scènes en route : la journée continue après le choix', ()=>{
 const m=solo(11);let roads=0,checked=false;
 for(let i=0;i<300&&!m.done&&roads<3;i++){
  if(m.phase==='encounter'&&m.encounter.road&&!m.encounter.situation){roads++;const turn=m.turn;assert.ok(S.resolveEncounter(m,0));assert.equal(m.turn,turn,'la journée n’est pas finie');assert.equal(m.phase,'move');checked=true;continue;}
  if(m.phase==='encounter'){S.resolveEncounter(m,0);continue;}
  if(m.phase==='voyage-choice'){S.chooseNewVoyage(m,S.player(m).voyageChoices[0]);continue;}
  const p=S.player(m),mv=S.moves(m);if(mv.length&&p.energy>1){S.move(m,mv[0].key);continue;}if(!m.moved&&S.rest(m,'bivouac'))continue;S.endTurn(m);}
 assert.ok(checked,'au moins une scène en route');
});

test('Le soir : toujours une scène, avec le carnet du jour', ()=>{
 const m=solo(5);const mv=S.moves(m);S.move(m,mv[0].key);
 while(m.phase==='encounter'&&m.encounter.road)S.resolveEncounter(m,0);
 S.endTurn(m);assert.equal(m.phase,'encounter');assert.equal(m.encounter.road,false);
 assert.match(m.encounter.carnet,/^Jour 1 · /);assert.ok(m.history.some(h=>h.kind==='carnet'));
});

test('« Demander » : un jour de repos et un résultat raconté le soir', ()=>{
 const m=solo(9),p=S.player(m);
 assert.ok(S.rest(m,'demander'));
 assert.ok(m.history.some(h=>h.kind==='rest'&&/Demander/.test(h.text)));
 assert.equal(m.phase,'encounter');assert.match(m.encounter.id,/^im-demande-(grand|jardin|refus)$/);
 assert.ok(['grand','jardin','refus'].includes(p.imm.demand.kind));
});

test('« Demander » : chances validées et refus sans argent', ()=>{
 const o=demandOdds({city:false,exhausted:false,region:'ouest'});
 assert.equal(o.grand+o.jardin+o.refus,100);assert.equal(o.grand,25);
 assert.ok(demandOdds({city:true,exhausted:false,region:'alpes'}).refus>demandOdds({city:false,exhausted:true,region:'balkans'}).refus);
 assert.equal(oddsLabel(25),'1 sur 4');assert.equal(oddsLabel(33),'1 sur 3');
 // Avec 0 pièce, un refus coûte une nuit sans vrai repos (fatigue +1), jamais de pièces négatives.
 for(let seed=1;seed<40;seed++){const m=solo(seed),p=S.player(m);p.money=0;p.fatigue=0;S.rest(m,'demander');assert.ok(p.money>=0);if(p.imm.demand.kind==='refus'){assert.equal(p.fatigue,1);return;}}
 assert.fail('aucun refus tiré');
});

test('Imprévu « côte en août » : camping 2 pièces, bivouac interdit dans la zone', ()=>{
 let m,s;for(let seed=1;seed<60&&!s;seed++){m=solo(seed);s=S.spawnSituation(m,S.player(m),'cote-aout');}
 assert.ok(s&&s.keys.length>=3);const p=S.player(m);p.pos=s.keys[0];
 assert.equal(S.restRule(m,p,'camping').price,2);assert.ok(S.restRule(m,p,'bivouac').blocked);
 assert.equal(S.rest(m,'bivouac'),false);
});

test('Imprévu « feu de forêt » : les cases de la zone sont interdites', ()=>{
 let m,s;for(let seed=1;seed<80&&!s;seed++){m=solo(seed);s=S.spawnSituation(m,S.player(m),'feu');}
 assert.ok(s);const p=S.player(m),inside=s.keys[0],next=m.board[inside].links.find(k=>!s.keys.includes(k)&&m.board[k].type!=='mer');
 p.pos=next;p.energy=10;assert.ok(!S.moves(m).some(t=>t.key===inside));
});

test('Imprévus : un modèle complet pour chacun', ()=>{
 for(const s of SITUATIONS){assert.ok(s.title&&s.text&&s.rules.length&&s.days>0&&s.size>=3,s.id);assert.ok(['neg','pos'].includes(s.kind));}
 assert.ok(SITUATIONS.length>=10);assert.ok(COMPANIONS.length>=3);
});

test('Scènes : identifiants uniques, choix valides, assez de variété', ()=>{
 const ids=new Set();for(const s of SCENES){assert.ok(!ids.has(s.id),s.id);ids.add(s.id);assert.ok(['route','soir'].includes(s.when));assert.ok(s.choices.length>=1);
  for(const c of s.choices){if(c.chance){assert.ok(c.chance.odds>0&&c.chance.odds<1);assert.ok(c.chance.ok.text&&c.chance.ko.text);}else assert.ok(c.effect);}}
 assert.ok(SCENES.filter(s=>s.when==='route').length>=20);assert.ok(SCENES.filter(s=>s.when==='soir').length>=15);
 assert.ok(!SCENES.some(s=>/Marion|Fi\b|Gaza/.test(JSON.stringify(s))),'aucun nom de personne réelle');
});

test('Détails tirés au sort selon la zone', ()=>{
 let n=0;const rnd=()=>(n=(n+.37)%1);
 const a=fillVariants('{qui} t’arrête {lieu} et t’offre {offrande}.','balkans',rnd);
 assert.doesNotMatch(a,/\{/);assert.match(fillVariants('{lieu}, trois chiens','ouest',rnd),/^[A-ZÀ-Ý]/);
});

test('Repos forcé : demain, pas de route', ()=>{
 const m=solo(3),p=S.player(m);p.nextDay={rest:true};S.rest(m,'bivouac');
 while(m.phase==='encounter')S.resolveEncounter(m,0);
 assert.ok(S.player(m).turnModifiers.skipMove);assert.equal(S.moves(m).length,0);
});

test('Compagnon de route : la fatigue monte moins vite', ()=>{
 const m=solo(4),p=S.player(m);p.imm={...(p.imm||{}),seen:{},companions:{},zones:[],sitDone:[],ride:{until:m.round+2,n:0}};p.fatigue=0;
 const mv=S.moves(m);S.move(m,mv[0].key);while(m.phase==='encounter')S.resolveEncounter(m,0);
 S.endTurn(m);assert.equal(p.fatigue,0,'1er jour à deux : pas de fatigue');
});

test('Sauvegarde et rechargement pendant une scène Immersion', ()=>{
 const m=solo(12);S.rest(m,'demander');assert.equal(m.phase,'encounter');
 const back=S.load(S.serialize(m));assert.equal(S.currentEncounter(back).id,S.currentEncounter(m).id);
 assert.ok(S.resolveEncounter(back,0));
});

test('Partie entière en Immersion sans blocage', ()=>{
 const m=solo(21);const seen=new Set();playDays(m,25,(mm,e)=>seen.add(e.id));
 assert.ok(seen.size>=8,'des scènes variées : '+seen.size);
 for(const k of ['energy','food','money','points'])assert.ok(S.player(m)[k]>=0);
});
