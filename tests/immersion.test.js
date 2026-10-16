import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import {CLASSIC,clone} from '../dist/rules.js';
import {voyages} from '../dist/voyages.js';
import {SCENES,SITUATIONS,COMPANIONS,demandOdds,fillVariants,oddsLabel} from '../dist/immersion.js';

const pick=m=>{const e=S.currentEncounter(m);return Math.max(0,e.choices.findIndex((c,j)=>S.canChooseEncounter(m,j)));};
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
  const okIdx=()=>{const e=S.currentEncounter(m);return Math.max(0,e.choices.findIndex((c,j)=>S.canChooseEncounter(m,j)));};
  if(m.phase==='encounter'&&m.encounter.road&&!m.encounter.situation){roads++;const turn=m.turn;assert.ok(S.resolveEncounter(m,okIdx()));assert.equal(m.turn,turn,'la journée n’est pas finie');assert.equal(m.phase,'move');checked=true;continue;}
  if(m.phase==='encounter'){S.resolveEncounter(m,okIdx());continue;}
  if(m.phase==='voyage-choice'){S.chooseNewVoyage(m,S.player(m).voyageChoices[0]);continue;}
  const p=S.player(m);if(!m.moved)p.energy=Math.max(p.energy,8);const mv=S.moves(m);if(mv.length&&p.energy>1){S.move(m,mv[0].key);continue;}if(S.rest(m,'camping')||S.rest(m,'bivouac'))continue;S.endTurn(m);}
 assert.ok(checked,'au moins une scène en route');
});

test('Le soir : toujours une scène, avec le carnet du jour', ()=>{
 const m=solo(5);const mv=S.moves(m);S.move(m,mv[0].key);
 while(m.phase==='encounter'&&m.encounter.road)S.resolveEncounter(m,pick(m));
 S.endTurn(m);assert.equal(m.phase,'encounter');assert.equal(m.encounter.road,false);
 assert.match(m.encounter.carnet,/^Jour 1 · /);assert.ok(m.history.some(h=>h.kind==='carnet'));
});

test('« Demander » : un jour de repos et un résultat raconté le soir', ()=>{
 const m=solo(9),p=S.player(m);
 assert.ok(S.rest(m,'demander'));
 assert.ok(m.history.some(h=>h.kind==='night'&&/Demander/.test(h.text)));
 assert.equal(m.phase,'encounter');assert.match(m.encounter.id,/^im-demande-(grand|jardin|refus)$/);assert.match(m.encounter.nightLine,/énergie/);
});

test('« Demander » : chances validées et refus sans argent', ()=>{
 const o=demandOdds({city:false,exhausted:false,region:'ouest'});
 assert.equal(o.grand+o.jardin+o.refus,100);assert.equal(o.grand,25);
 assert.ok(demandOdds({city:true,exhausted:false,region:'alpes'}).refus>demandOdds({city:false,exhausted:true,region:'balkans'}).refus);
 assert.equal(oddsLabel(25),'1 sur 4');assert.equal(oddsLabel(33),'1 sur 3');
 // Avec 0 pièce, un refus coûte une nuit sans vrai repos (fatigue +1), jamais de pièces négatives.
 for(let seed=1;seed<40;seed++){const m=solo(seed),p=S.player(m);p.money=0;p.fatigue=0;S.rest(m,'demander');assert.ok(p.money>=0);if(m.encounter.id==='im-demande-refus'){assert.equal(p.fatigue,1);return;}}
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
 assert.ok(SCENES.filter(s=>s.when==='route').length>=20);
 for(const sc of SCENES)assert.ok(sc.choices.some(c=>!c.item&&!c.need),'un choix toujours possible : '+sc.id);assert.ok(SCENES.filter(s=>s.when==='soir').length>=15);
 assert.ok(!SCENES.some(s=>/Marion|Fi\b|Gaza/.test(JSON.stringify(s))),'aucun nom de personne réelle');
});

test('Détails tirés au sort selon la zone', ()=>{
 let n=0;const rnd=()=>(n=(n+.37)%1);
 const a=fillVariants('{qui} t’arrête {lieu} et t’offre {offrande}.','balkans',rnd);
 assert.doesNotMatch(a,/\{/);assert.match(fillVariants('{lieu}, trois chiens','ouest',rnd),/^[A-ZÀ-Ý]/);
});

test('Repos forcé : demain, pas de route', ()=>{
 const m=solo(3),p=S.player(m);p.nextDay={rest:true};S.rest(m,'bivouac');
 while(m.phase==='encounter')S.resolveEncounter(m,pick(m));
 assert.ok(S.player(m).turnModifiers.skipMove);assert.equal(S.moves(m).length,0);
});

test('Compagnon de route : la fatigue monte moins vite', ()=>{
 const m=solo(4),p=S.player(m);p.imm={...(p.imm||{}),seen:{},companions:{},zones:[],sitDone:[],ride:{until:m.round+2,n:0}};p.fatigue=0;
 const mv=S.moves(m);S.move(m,mv[0].key);while(m.phase==='encounter')S.resolveEncounter(m,pick(m));
 S.rest(m,'bivouac');assert.equal(p.fatigue,0,'1er jour à deux : pas de fatigue');
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

test('La nuit termine la journée : bivouac +1, camping +2, hôtel +3', ()=>{
 const ride=m=>{const mv=S.moves(m);S.move(m,mv[0].key);while(m.phase==='encounter')S.resolveEncounter(m,pick(m));};
 for(const [id,gain] of [['bivouac',1],['camping',2]]){const m=solo(31),p=S.player(m);ride(m);p.energy=3;p.fatigue=1;const turn=m.turn;
  assert.ok(S.rest(m,id),'on dort après avoir roulé');assert.equal(m.phase,'encounter');assert.match(m.encounter.nightLine,/énergie/);
  const expected=Math.min(10,3+gain);assert.ok(p.energy>=expected-1&&p.energy<=expected+1,id+' : '+p.energy);
  while(m.phase==='encounter')S.resolveEncounter(m,pick(m));assert.ok(m.turn>turn,'la journée est finie');}
 const m=solo(31),p=S.player(m);assert.equal(m.board[p.pos].type,'ville');p.energy=2;p.fatigue=2;assert.ok(S.rest(m,'hotel'));assert.equal(p.fatigue,0);assert.equal(p.energy,Math.min(10,2+3*2),'journée sans rouler : +3 × 2');
});

test('Journée sans rouler : la nuit rend deux fois plus d’énergie', ()=>{
 const m=solo(33),p=S.player(m);p.energy=2;const info=S.sleepOptions(m,p);assert.equal(info.restDay,true);
 assert.equal(info.options.find(o=>o.id==='camping').energy,4);assert.equal(info.options.find(o=>o.id==='bivouac').energy,2);
});

test('Les scènes vérifient les sacoches (chambre à air, kit)', ()=>{
 const e=SCENES.find(s=>s.id==='im-crevaison');assert.ok(e.choices.some(c=>c.item==='chambre'));assert.ok(e.choices.some(c=>c.item==='kit'));
 const m=solo(8,['tente']);m.phase='encounter';m.encounter={id:e.id,playerId:S.player(m).id,road:true,scene:JSON.parse(JSON.stringify(e))};
 const i=e.choices.findIndex(c=>c.item==='chambre');assert.equal(S.canChooseEncounter(m,i),false,'pas de chambre à air dans les sacoches');
});

test('Le soir : peu de cadeaux, souvent une nuit tranquille', ()=>{
 let calm=0,total=0,points=0;for(let seed=1;seed<60;seed++){const m=solo(seed),p=S.player(m);const mv=S.moves(m);S.move(m,mv[0].key);while(m.phase==='encounter')S.resolveEncounter(m,pick(m));
  const before=p.points;S.rest(m,'camping');total++;if(m.encounter.id==='im-nuit-calme')calm++;S.resolveEncounter(m,pick(m));points+=p.points-before;}
 assert.ok(calm/total>=.4,'nuits tranquilles : '+calm+'/'+total);assert.ok(points/total<=.4,'points moyens par nuit : '+points/total);
});

test('« Demander » : jamais trois fois la même réponse, et plus risqué chaque soir d’affilée', ()=>{
 const m=solo(44),p=S.player(m),seen=[];const o0=S.demandInfo(m,p);
 for(let d=0;d<10;d++){S.rest(m,'demander');seen.push(m.encounter.id);while(m.phase==='encounter')S.resolveEncounter(m,pick(m));p.money=10;}
 for(let i=2;i<seen.length;i++)assert.ok(!(seen[i]===seen[i-1]&&seen[i]===seen[i-2]),'trois fois de suite : '+seen.join(' '));
 assert.ok(S.demandInfo(m,p).refus>o0.refus,'refus plus probable après plusieurs soirs');
 S.rest(m,'camping');while(m.phase==='encounter')S.resolveEncounter(m,pick(m));assert.equal(S.demandInfo(m,p).streak,0,'un soir ailleurs remet à zéro');
});
