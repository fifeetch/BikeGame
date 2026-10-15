import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import {CLASSIC,clone} from '../dist/rules.js';
import {EVENT_CARDS} from '../dist/event-cards.js';
import {isRoadStep} from '../dist/routes.js';
import {regionOf,weatherOn,REGIONS,CLIMATE} from '../dist/weather.js';
import {europeBoard} from '../dist/europe.js';

const roster=[{name:'Fi',bike:'gravel',voyage:'traversee',items:['gps']},{name:'Léa',bike:'gravel',voyage:'soleil',items:['gps']}];
function game(forecast=true){const r=clone(CLASSIC);r.weather.forecast=forecast;const m=S.createMatch(roster,'plateau',r,11);m.cardVersion=2;m.pendingAttack=null;m.phase='move';
 const p=S.player(m);for(const q of m.players)q.cardHand=[];p.pos='city-Paris';p.energy=99;m.moved=0;return m;}
// Avance le jour jusqu'à ce que la case ait le temps voulu (le temps dépend seulement de la graine et du jour).
function dayWith(m,key,w){for(let d=1;d<500;d++){m.round=d;if(S.weatherToday(m,key)===w)return d;}throw Error('aucun jour avec '+w);}
const neighbours=(m,k)=>m.board[k].links.map(n=>m.board[n]).filter(t=>t.type!=='mer'&&!m.edges.some(e=>e.ferry&&(e.a===k&&e.b===t.key||e.b===k&&e.a===t.key)));

test('régions : les villes repères sont dans leur région, et le temps est le même pour la même partie et le même jour',()=>{
 const {board}=europeBoard('Paris','Istanbul');
 for(const [id,r]of Object.entries(REGIONS))for(const name of r.cities)assert.equal(regionOf(board['city-'+name]),id,name);
 for(const t of Object.values(board))assert(REGIONS[regionOf(t)]);
 for(let d=1;d<30;d++)assert.equal(weatherOn(5,d,'alpes'),weatherOn(5,d,'alpes'));
 for(const odds of Object.values(CLIMATE))assert.equal(Object.values(odds).reduce((a,b)=>a+b,0),100);
});

test('option de début de partie : météo annoncée = sans cartes climatiques ; cartes météo = sans météo annoncée',()=>{
 const withForecast=game(true),withCards=game(false),climatic=EVENT_CARDS.filter(c=>c.category==='climatic').map(c=>c.id);
 assert(withForecast.forecast);assert(!withForecast.eventCardIds.some(id=>climatic.includes(id)));
 assert(!withCards.forecast);assert(climatic.every(id=>withCards.eventCardIds.includes(id)));
 const m=withCards,t=neighbours(m,'city-Paris')[0];for(let d=1;d<40;d++){m.round=d;assert.equal(S.weatherExtra(m,S.player(m),'city-Paris',t,0),0);}
 assert.equal(S.load(S.serialize(withForecast)).forecast,true,'l’option reste après une sauvegarde');
});

test('vent de face : seulement la première case de la journée coûte +1',()=>{
 const m=game(),p=S.player(m),t=neighbours(m,'city-Paris')[0];dayWith(m,t.key,'vent');
 assert.equal(S.weatherExtra(m,p,'city-Paris',t,0),1);assert.equal(S.weatherExtra(m,p,'city-Paris',t,1),0);
 const before=p.energy,base=S.cost(m,t);assert(S.move(m,t.key));assert.equal(before-p.energy,base+1);
});

test('pluie : +1 seulement hors route',()=>{
 const m=game(),p=S.player(m),ns=neighbours(m,'city-Paris'),road=ns.find(t=>isRoadStep(m.board['city-Paris'],t)),off=ns.find(t=>!isRoadStep(m.board['city-Paris'],t)&&regionOf(t)===regionOf(road));
 dayWith(m,road.key,'pluie');
 assert.equal(S.weatherExtra(m,p,'city-Paris',road,1),0);assert.equal(S.weatherExtra(m,p,'city-Paris',off,1),1);
 assert.equal(S.routeCheck(m,[off.key]).energyUsed,S.cost(m,off)+1);
});

test('orage : 3 cases maximum si la journée commence dans la région de l’orage',()=>{
 const m=game(),p=S.player(m);dayWith(m,'city-Paris','orage');assert.equal(S.distance(m),3);
 let pos='city-Paris';const route=[];for(let i=0;i<4;i++){const n=neighbours(m,pos).find(t=>!route.includes(t.key)&&t.key!=='city-Paris');route.push(n.key);pos=n.key;}
 assert(!S.routeCheck(m,route).ok);assert(S.routeCheck(m,route.slice(0,3)).ok);
 for(let d=1;d<500;d++){m.round=d;if(S.weatherToday(m,'city-Paris')!=='orage')break;}assert.equal(S.distance(m),5);
});

test('neige : montagne et col +1, pas en plaine',()=>{
 const m=game(),p=S.player(m),{board}=m,mount=Object.values(board).find(t=>t.type==='montagne'&&regionOf(t)==='alpes'),plain=Object.values(board).find(t=>t.type==='plaine'&&regionOf(t)==='alpes');
 dayWith(m,mount.key,'neige');assert.equal(S.weatherExtra(m,p,mount.key,mount,1),1);assert.equal(S.weatherExtra(m,p,plain.key,plain,1),0);
});

test('carnet : les cases hors route sont comptées et chaque case garde son jour',()=>{
 const m=game(false),p=S.player(m),off=neighbours(m,'city-Paris').find(t=>!isRoadStep(m.board['city-Paris'],t));m.round=4;
 assert(S.move(m,off.key));assert.equal(p.stats.offroad,1);assert.equal(p.travelHistory.at(-1).day,4);
});
