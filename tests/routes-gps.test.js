import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import * as C from '../dist/event-card-engine.js';
import {CLASSIC,clone,validateRules} from '../dist/rules.js';
import {europeBoard,HEX_DIRECTIONS} from '../dist/europe.js';
import {ROAD_CELLS,ROUTES_AJOUTEES} from '../dist/assets/europe/routes-data.js';
import {isRoadStep,roadEdges} from '../dist/routes.js';
import {EVENT_CARDS} from '../dist/event-cards.js';
import {DECOR} from '../dist/assets/europe/decor-data.js';
import {roadNetwork} from '../dist/board-roads.js';

const roster=(bike,items=[])=>[{name:'Fi',bike,voyage:'traversee',items},{name:'Bob',bike,voyage:'soleil',items}];
// Partie classique (sans cartes Événement) avec le joueur posé sur une case donnée, énergie pleine.
function classic(bike='gravel',{gps=false,at='city-Paris'}={}){
 const m=S.createMatch(roster(bike),'plateau',CLASSIC,7);m.cardVersion=2;m.pendingAttack=null;m.phase='move';
 const p=S.player(m);for(const q of m.players)q.cardHand=[];p.items=gps?['gps']:[];p.pos=at;p.energy=99;m.moved=0;return m;
}
const steps=(m,from)=>m.board[from].links.map(k=>m.board[k]).filter(t=>!m.edges.some(e=>e.ferry&&(e.a===from&&e.b===t.key||e.b===from&&e.a===t.key)));
// Suit la route depuis « from » sur n cases (sans revenir en arrière).
function roadPath(m,from,n){const out=[];let pos=from,prev='';for(let i=0;i<n;i++){const next=steps(m,pos).find(t=>t.key!==prev&&!out.includes(t.key)&&isRoadStep(m.board[pos],t));if(!next)break;out.push(next.key);prev=pos;pos=next.key;}return out;}
// Chemin qui quitte la route dès le premier pas, puis continue sur n cases (sans route si possible).
function offPath(m,from,n){const out=[];let pos=from;for(let i=0;i<n;i++){const next=steps(m,pos).find(t=>!out.includes(t.key)&&t.key!==from&&t.type==='plaine'&&!isRoadStep(m.board[pos],t))||steps(m,pos).find(t=>!out.includes(t.key)&&t.key!==from&&t.type==='plaine');out.push(next.key);pos=next.key;}return out;}

test('routes figées : chaque côté de route a son vis-à-vis, sur des cases de terre voisines',()=>{
 const {board}=europeBoard('Paris','Istanbul'),byAxial=new Map(Object.values(board).map(t=>[`${t.q},${t.r}`,t]));
 assert(ROAD_CELLS.length>300);
 for(const [q,r,sides]of ROAD_CELLS){const a=byAxial.get(`${q},${r}`);assert(a&&a.type!=='mer',`${q},${r}`);
  for(const d of sides){const [dq,dr]=HEX_DIRECTIONS[d],b=byAxial.get(`${q+dq},${r+dr}`);assert(b&&b.type!=='mer');assert(b.roads.includes((d+3)%6),`${q},${r} côté ${d}`);assert(a.links.includes(b.key));}}
 // Toutes les grandes routes d'avant sont toujours là ; les chemins des hameaux ne comptent pas.
 // Villes ajoutées ou déplacées le 18 octobre (demande de Fi) : leurs routes sont tracées à la main, on les ignore ici.
 const NEW=['Brest','Oulu','Atyraou','Aktaou','Türkmenbaşy','Noukous','Achgabat','Lille'],old=Object.fromEntries(Object.entries(board).map(([k,t])=>[k,NEW.includes(t.name)?{...t,name:''}:t]));
 const net=roadNetwork(old,{villages:DECOR.villages.map(v=>[v[3],v[4]])}),edges=roadEdges(board);
 for(const e of net.main)assert(edges.has(e),'grande route perdue : '+e);
 assert([...net.minor].some(e=>!edges.has(e)),'les petits chemins restent un décor');
});

test('les routes ajoutées relient bien leurs villes, case par case',()=>{
 const {board}=europeBoard('Paris','Istanbul'),byAxial=new Map(Object.values(board).map(t=>[`${t.q},${t.r}`,t]));
 assert(ROUTES_AJOUTEES.length>=25);const onBoard=n=>Object.values(board).some(t=>t.name===n);
 for(const route of ROUTES_AJOUTEES){const cities=route.name.split(' → '),cells=route.cells.map(([q,r])=>byAxial.get(`${q},${r}`));
  // une route peut finir sur un repère (ex. Luleå) qui rejoint une route existante
  if(onBoard(cities[0]))assert.equal(cells[0].name,cities[0]);if(onBoard(cities.at(-1)))assert.equal(cells.at(-1).name,cities.at(-1));
  for(const c of cities.filter(onBoard))assert(cells.some(t=>t.name===c),`${route.name} passe par ${c}`);
  for(let i=1;i<cells.length;i++)assert(isRoadStep(cells[i-1],cells[i]),`${route.name} : pas ${i} sans route`);}
});

// Règle de Fi (15 octobre 2026) : Gravel 5 cases par jour, Randonneuse 4.
test('sur la route : déplacement normal (Gravel 5 cases, Randonneuse 4), même sans GPS',()=>{
 for(const [bike,d] of [['gravel',5],['randonneur',4]]){const m=classic(bike),route=roadPath(m,'city-Paris',d);assert.equal(route.length,d);
  assert.equal(S.distance(m),d);assert(S.routeCheck(m,route).ok,bike);assert(!S.routeCheck(m,roadPath(m,'city-Paris',d+1)).ok,bike+' pas une case de plus');assert(S.executeRoute(m,route));assert.equal(m.moved,d);
  assert.equal(S.offroadStatus(m).off,false);}
});

test('hors route avec GPS : déplacement normal',()=>{
 const m=classic('randonneur',{gps:true}),route=offPath(m,'city-Paris',4);
 assert(!isRoadStep(m.board['city-Paris'],m.board[route[0]]));
 assert(S.routeCheck(m,route).ok);assert(S.executeRoute(m,route));assert.equal(m.moved,4);
 const s=S.offroadStatus(m);assert(s.off&&s.gps&&!s.limited);
});

test('hors route sans GPS : Gravel limitée à 3 cases, Randonneuse à 2, pour toute la journée',()=>{
 for(const [bike,max]of [['gravel',3],['randonneur',2]]){
  let m=classic(bike);const route=offPath(m,'city-Paris',5);
  const check=S.routeCheck(m,route.slice(0,max+1));assert(!check.ok);assert.match(check.reason,new RegExp(`Hors route sans GPS : ${max} cases maximum`));
  assert(S.routeCheck(m,route.slice(0,max)).ok);assert(S.executeRoute(m,route.slice(0,max)));
  assert.equal(S.distance(m),max);assert.deepEqual(S.moves(m),[],'plus aucun pas ce jour-là');
  assert(S.offroadStatus(m).limited);
  // Revenir sur la route ne lève pas la limite du jour.
  m=classic(bike);assert(S.move(m,route[0]));assert(S.move(m,'city-Paris'));assert.equal(S.distance(m),max);
  // Après (distance − 1) cases de route, on ne peut plus quitter la route ce jour-là ; rester sur la route reste possible.
  m=classic(bike);const road=roadPath(m,'city-Paris',S.distance(m)-1);assert(S.executeRoute(m,road));
  const exits=steps(m,S.player(m).pos).filter(t=>!isRoadStep(m.board[S.player(m).pos],t));assert(exits.length);
  for(const t of exits){assert(!S.move(m,t.key));assert(!S.moves(m).some(n=>n.key===t.key));}
  assert(S.moves(m).some(t=>isRoadStep(m.board[S.player(m).pos],t)));
 }
});

test('la règle hors route est réglable dans Règles et peut être désactivée',()=>{
 const r=clone(CLASSIC);r.offroad.maxDistance.randonneur=4;let m=S.createMatch(roster('randonneur'),'plateau',r,7);m.cardVersion=2;m.pendingAttack=null;
 let p=S.player(m);p.items=[];p.pos='city-Paris';p.energy=99;m.phase='move';m.moved=0;const route=offPath(m,'city-Paris',5);
 assert(S.routeCheck(m,route.slice(0,4)).ok);assert(!S.routeCheck(m,route).ok);
 r.offroad.enabled=false;m=S.createMatch(roster('randonneur'),'plateau',r,7);m.cardVersion=2;m.pendingAttack=null;p=S.player(m);p.items=[];p.pos='city-Paris';p.energy=99;m.phase='move';m.moved=0;
 assert(S.routeCheck(m,route.slice(0,4)).ok,'sans la règle : la journée normale de la Randonneuse (4 cases)');
 assert.throws(()=>validateRules({offroad:{item:'inconnu'}}));assert.throws(()=>validateRules({offroad:{maxDistance:{gravel:0}}}));
});

test('anciennes sauvegardes : les cases retrouvent leurs routes au chargement',()=>{
 const m=classic();for(const t of Object.values(m.board))t.roads=[];
 const loaded=S.load(JSON.stringify(m));assert.deepEqual(loaded.board['city-Paris'].roads,europeBoard('Paris','Istanbul').board['city-Paris'].roads);
});

// ---------- Cartes Événement ----------
function eventGame(){const m=S.createMatch(roster('gravel'),'plateau',CLASSIC,13);assert(C.isEventGame(m));m.pendingAttack=null;m.phase='move';m.cardChoices=[];
 const p=S.player(m);p.items=['gps'];p.pos='city-Paris';p.energy=99;m.moved=0;p.turnModifiers={};p.pendingEffects=[];return m;}

test('« Covoiturage improvisé » : les cases offertes doivent suivre une vraie route',()=>{
 const m=eventGame(),p=S.player(m),road=roadPath(m,'city-Paris',3),off=offPath(m,'city-Paris',1);
 m.moved=5;p.freeSteps=3;p.freeRoadSteps=3;// journée normale déjà faite : seules les cases du covoiturage restent
 assert(S.routeCheck(m,road).ok,'en suivant la route');
 assert(!S.routeCheck(m,off).ok,'hors route : pas de covoiturage');
});

test('« Pluie torrentielle » : seulement sur une case sans route',()=>{
 const m=eventGame(),card=EVENT_CARDS.find(c=>c.name==='Pluie torrentielle'),road=roadPath(m,'city-Paris',1),off=offPath(m,'city-Paris',1);
 assert(!C.climateEligible(m,card.id,road),'sur la route : aucun effet');
 assert(C.climateEligible(m,card.id,off),'hors route : la pluie s’applique');
 const base=S.routeCheck(m,off).energyUsed,roadBase=S.routeCheck(m,road).energyUsed;
 m.cardWindow={route:[],responders:[],responderIndex:0,weathers:[{kind:'heavy_rain',value:card.effectValue}]};
 assert.equal(S.routeCheck(m,road).energyUsed,roadBase,'case avec route : pas de perte');
 assert.equal(S.routeCheck(m,off).energyUsed,base+card.effectValue,'case sans route : −2 énergie');
});

test('lieux cachés : tous les jetons sont loin des routes (au moins 2 cases)',()=>{
 for(const seed of [1,7,42,99,2026]){const m=S.createMatch(roster('gravel'),'plateau',CLASSIC,seed),B=m.board,keys=Object.keys(m.landmarks);
  assert.equal(keys.length,24);
  for(const k of keys){assert(!B[k].roads.length,`${k} est sur une route`);assert(!B[k].links.some(n=>B[n].roads.length),`${k} touche une route`);}}
});
