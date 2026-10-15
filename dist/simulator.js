import * as E from './engine.js';
import {europeBoard,MAP_VERSION,axialDistance} from './europe.js';
import {voyages,progress,voyagePoints} from './voyages.js';
import {CLASSIC,COLORS,clone,validateRules,energyCap,isExhausted} from './rules.js';
import {cardById,effectiveCards,normalizeCustomCards} from './cards.js';
import * as C from './event-card-engine.js';
import {EVENT_CARDS,normalizeEventEdits} from './event-cards.js';
import {applyRoads,isRoadStep,hasRoad} from './routes.js';
import {regionOf,weatherOn,forecast,REGIONS,WEATHER,STORM_MAX} from './weather.js';
import {ENCOUNTERS} from './encounters.js';

export const player=m=>m.players[m.activeIndex];
// ---------- Règle « hors route » (mode Plateau) ----------
// Sans l'objet protecteur (le GPS), dès qu'un pas de la journée quitte la route, la journée entière est limitée
// à rules.offroad.maxDistance[vélo] cases (toutes les cases de la journée comptent, y compris celles offertes par une carte).
export const offroadEnabled=m=>Boolean(m.mode==='plateau'&&m.rules.offroad?.enabled);
export const hasOffroadItem=(m,p=player(m))=>Boolean(m.rules.offroad?.item&&p.items.includes(m.rules.offroad.item)||C.isEventGame(m)&&C.hasBonusEffect(m,p,'gps_immunity'));
export const offroadMax=(m,p=player(m))=>m.rules.offroad?.maxDistance?.[p.bike]??5;
export const offroadToday=(m,p=player(m))=>p.offroadTurn===m.turn;
// Le pas de la case from vers la case t suit-il une route ? (en mode Tuiles : toujours vrai, la règle ne s'applique pas)
export const roadStep=(m,from,t)=>m.mode!=='plateau'||isRoadStep(m.board[from],t);
const offroadLimited=(m,p,off)=>offroadEnabled(m)&&off&&!hasOffroadItem(m,p);
function offroadAllows(m,p,from,t,movedBefore,off){if(!offroadEnabled(m)||hasOffroadItem(m,p))return true;return !(off||!roadStep(m,from,t))||movedBefore+1<=offroadMax(m,p);}
export function offroadStatus(m,p=player(m)){const on=offroadEnabled(m),gps=hasOffroadItem(m,p),off=offroadToday(m,p),max=offroadMax(m,p);
 return {enabled:on,gps,off,limited:on&&off&&!gps,max,item:m.rules.equipment[m.rules.offroad?.item]?.name||'GPS',moved:m.moved,onRoad:on?hasRoad(m.board[p.pos]):true};}
const baseDistance=m=>{const p=player(m),base=Math.min(5,m.rules.distance+m.rules.bikes[p.bike].extraDistance+(p.turnModifiers?.bonusDistance||0));return Math.max(0,base-(p.turnModifiers?.distancePenalty||0)+(C.isEventGame(m)&&p.frostTurn!==m.turn?(p.freeSteps||0)+(p.bonusDistanceUsed||0):0));};
// ---------- Météo annoncée ----------
export const forecastOn=m=>Boolean(m.forecast&&m.mode==='plateau');
export const regionAt=(m,key)=>regionOf(m.board[key]);
export const weatherToday=(m,key)=>weatherOn(m.seed,m.round,regionAt(m,key));
export const weatherBulletin=(m,day=m.round+1)=>Object.entries(forecast(m.seed,day)).map(([id,w])=>({region:id,regionName:REGIONS[id].name,weather:w,...WEATHER[w]}));
const dayStartPos=(m,p)=>p.dayStart?.turn===m.turn?p.dayStart.pos:p.pos;
export const stormToday=(m,p=player(m))=>forecastOn(m)&&weatherToday(m,dayStartPos(m,p))==='orage';
// Énergie en plus due à la météo pour le pas from → t (movedBefore = cases déjà faites aujourd'hui).
export function weatherExtra(m,p,from,t,movedBefore){if(!forecastOn(m)||!t)return 0;const w=weatherOn(m.seed,m.round,regionOf(t));
 return w==='vent'&&movedBefore===0?1:w==='pluie'&&!roadStep(m,from,t)?1:w==='neige'&&['montagne','col'].includes(t.type)?1:0;}
export const distance=m=>{const p=player(m);let d=baseDistance(m);if(offroadLimited(m,p,offroadToday(m,p)))d=Math.min(d,offroadMax(m,p));if(stormToday(m,p))d=Math.min(d,STORM_MAX);return d;};
export const inventorySpace=(m,p=player(m))=>p.items.reduce((sum,id)=>sum+(m.rules.equipment[id]?.space||0),0);
export function view(m,p=player(m)){
 const v=voyages.find(v=>v.id===p.voyage),board={};
 for(const [k,t]of Object.entries(m.board))board[k]={...t,id:t.name===v?.from?0:t.id===0?-1:t.id};
 const arrival=Object.values(board).find(t=>t.name===v?.to);
 return {...m,...p,board,arrivalId:arrival?.id,phase:m.phase,done:m.done,turn:m.round,mapVersion:m.mapVersion};
}
const randomSeed=()=>globalThis.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:(Date.now()^Math.floor(Math.random()*4294967296))>>>0;
export function createMatch(roster,mode='plateau',rules=CLASSIC,seed=randomSeed(),customCards=[],eventCardEdits=[]){
 if(!Array.isArray(roster)||roster.length<1||roster.length>6)throw Error('Choisir de 1 à 6 joueurs.');
 if(!['plateau','tuiles'].includes(mode))throw Error('Mode inconnu.');
 const r=validateRules(rules);for(const p of roster)if(!r.bikes[p.bike]||!voyages.some(v=>v.id===p.voyage))throw Error('Vélo ou objectif inconnu.');
 const base=E.makeGame(roster[0].bike,seed,roster[0].voyage,mode);
 const m={version:2,cardVersion:3,forecast:Boolean(r.weather?.forecast&&mode==='plateau'),encounters:Boolean(r.encounters?.enabled&&mode==='plateau'),customCards:normalizeCustomCards(customCards),eventCardEdits:normalizeEventEdits(eventCardEdits),mode,seed:base.seed,board:base.board,edges:base.edges||[],mapVersion:base.mapVersion,deck:base.deck,hand:base.hand,rules:r,players:[],activeIndex:0,round:1,turn:1,phase:mode==='plateau'?'move':'place',moved:0,ate:0,placed:false,event:null,cardChoices:[],turnKind:'travel',done:false,history:[],stats:{turns:0,events:0,categories:{negative:0,positive:0,challenge:0},terrain:{},work:0,rest:0,energySpent:0,moneySpent:0}};
 roster.forEach((entry,i)=>{
  const v=voyages.find(v=>v.id===entry.voyage);let pos;
  if(mode==='plateau')pos='city-'+v.from;
  else{pos=Object.entries(m.board).find(([,t])=>t.name===v.from)?.[0];if(!pos){pos=E.key(i*3,0);m.board[pos]={id:-10-i,key:pos,x:i*3,y:0,name:v.from,type:'ville',roads:[0,1,2,3],rotation:0};let remove=m.deck.findIndex(t=>t.type==='ville'&&!t.name);if(remove<0)remove=m.deck.findIndex(t=>!t.name);if(remove>=0)m.deck.splice(remove,1);}let arrival=[...Object.values(m.board),...m.hand,...m.deck].find(t=>t.name===v.to);if(!arrival){arrival=[...m.deck,...m.hand].find(t=>t.type==='ville'&&!t.name)||[...m.deck,...m.hand].find(t=>!t.name);if(!arrival)throw Error('Pas assez de villes d’arrivée.');arrival.name=v.to;arrival.type='ville';}}
  const items=Array.isArray(entry.items)?[...new Set(entry.items)]:[];if(items.some(id=>!r.equipment[id]))throw Error('Équipement inconnu.');
  const space=items.reduce((n,id)=>n+r.equipment[id].space,0),price=items.reduce((n,id)=>n+r.equipment[id].price,0);
  const bikePrice=r.bikes[entry.bike].price||0;if(space>r.bikes[entry.bike].capacity||price+bikePrice>r.startMoney)throw Error('Le vélo et le matériel de départ dépassent le budget ou les emplacements.');
  m.players.push({id:'p'+(i+1),name:String(entry.name||'Joueur '+(i+1)).slice(0,40),color:COLORS[i],bike:entry.bike,voyage:entry.voyage,pos,energy:r.startEnergy,food:r.startFood+r.bikes[entry.bike].extraFood+items.reduce((n,id)=>n+(r.equipment[id].foodBonus||0),0),money:r.startMoney-bikePrice-price+r.budget.startBonus,points:0,fatigue:0,dayCols:0,items,cardHand:[],pendingCards:[],turnModifiers:{},flat:false,lastCity:pos,visited:[pos],travel:[],travelHistory:[],steps:0,cols:0,cities:1,discoveries:0,completed:false,voyageWon:false,turns:0,availableDay:1,log:[],stats:{steps:0,energySpent:0,work:0,rest:0,events:0}});
 });placeLandmarks(m);C.setup(m);record(m,'setup','Partie créée : '+roster.length+' joueur(s), '+r.eventCards.startingHand+' cartes piochées chacun parmi '+m.eventCardIds.length+'.');return m;
}
// Lieux remarquables cachés : jetons « ? » posés au hasard (graine de la partie) sur des cases de campagne,
// à 3 cases au moins les uns des autres. Le premier cycliste qui passe dessus gagne 1, 2 ou 3 points d’aventure.
const LANDMARK_NAMES={1:['Belvédère','Vieux pont de pierre','Chapelle isolée','Lavoir ancien','Moulin à eau','Source fraîche'],2:['Village perché','Cascade','Gorges sauvages','Château en ruine','Forêt ancienne'],3:['Panorama grandiose','Lac secret','Abbaye oubliée','Grotte ornée']};
export function placeLandmarks(m){
 const a=m.rules.adventure,n=a.landmarks;m.landmarks={};if(!n||m.mode!=='plateau')return m.landmarks;
 let s=(m.seed^0x9e3779b9)>>>0;const rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
 const shuffle=list=>{for(let i=list.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;};
 // Les jetons restent dans la zone des voyages (chemin le plus court de chaque voyage, à 3 cases près),
 // mais toujours LOIN DES ROUTES (au moins 2 cases de toute route) : il faut quitter la route pour les trouver.
 const near=new Map(),bfs=(start,goal)=>{const prev=new Map([[start,null]]),queue=[start];while(queue.length){const k=queue.shift();if(k===goal)break;for(const n of m.board[k]?.links||[])if(!prev.has(n)&&m.board[n].type!=='mer'){prev.set(n,k);queue.push(n);}}if(!prev.has(goal))return [];const out=[];for(let k=goal;k;k=prev.get(k))out.push(k);return out;};
 // zone : les 8 voyages d'origine + les voyages choisis dans cette partie (les 12 nouveaux vont plus loin en Europe)
 const zone=[...voyages.slice(0,8),...voyages.filter(v=>m.players.some(p=>p.voyage===v.id))];
 for(const v of new Set(zone))for(const k of bfs('city-'+v.from,'city-'+v.to)){const c=m.board[k];for(const t of Object.values(m.board))if(t.type!=='mer'&&axialDistance(c,t)<=3)near.set(t.key,t);}
 const roadDist=new Map(),queue=Object.values(m.board).filter(t=>t.type!=='mer'&&t.roads?.length).map(t=>t.key);for(const k of queue)roadDist.set(k,0);
 for(let i=0;i<queue.length;i++){const k=queue[i];for(const n of m.board[k].links)if(!roadDist.has(n)&&m.board[n].type!=='mer'){roadDist.set(n,roadDist.get(k)+1);queue.push(n);}}
 const pool=shuffle([...near.values()].filter(t=>['plaine','moyenne_montagne','montagne','cote'].includes(t.type)&&!t.name&&!t.colName)),chosen=[];
 for(const far of [2,1])for(const t of pool){if(chosen.length>=n)break;if((roadDist.get(t.key)??99)>=far&&!chosen.includes(t)&&chosen.every(c=>axialDistance(c,t)>=3))chosen.push(t);}
 const o=a.landmarkOdds,c1=Math.round(chosen.length*o.one/100),c2=Math.round(chosen.length*o.two/100),c3=Math.max(0,chosen.length-c1-c2);
 const values=shuffle([...Array(c1).fill(1),...Array(c2).fill(2),...Array(c3).fill(3)]);
 chosen.forEach((t,i)=>{const v=values[i]||1,names=LANDMARK_NAMES[v];m.landmarks[t.key]={value:v,name:names[Math.floor(rnd()*names.length)],found:''};});
 return m.landmarks;
}
// Cols nommés (premier de cordée, titre Grimpeur) et lieux cachés, à chaque case parcourue.
function adventureStep(m,p,k,t,first){const a=m.rules.adventure;
 if(t.type==='col'){p.dayCols=(p.dayCols||0)+1;
  if(first){record(m,'col',`${t.colName||'Col'} franchi : +${m.rules.points.col} points d’aventure.`,{key:k});m.colsClimbed||={};
   if(!m.colsClimbed[k]){m.colsClimbed[k]=p.id;if(a.colFirstBonus){p.points+=a.colFirstBonus;record(m,'col-first',`Premier de cordée au ${t.colName||'col'} : +${a.colFirstBonus} points d’aventure.`,{key:k});}}
   if(!p.climber&&a.climberBonus&&p.cols>=a.climberCols){p.climber=true;p.points+=a.climberBonus;record(m,'climber',`${a.climberCols} cols franchis : +${a.climberBonus} points d’aventure.`);}}}
 const l=m.landmarks?.[k];if(l&&!l.found){l.found=p.id;p.points+=l.value;record(m,'landmark',`Lieu remarquable découvert : ${l.name}, +${l.value} point${l.value>1?'s':''} d’aventure.`,{key:k,value:l.value});}
}
function record(m,kind,text,extra={}){const p=player(m);m.history.push({turn:m.turn,round:m.round,player:p.id,name:p.name,kind,text,...extra});p.log.unshift(text);p.log=p.log.slice(0,8);}
export function updateRules(m,input){const r=validateRules(input);if(C.isEventGame(m)&&m.players.some(p=>p.bonusCards.length>r.eventCards.bonusLimit||p.cardHand.length>r.eventCards.handLimit+1))throw Error('La nouvelle limite est inférieure aux cartes déjà détenues. Choisis une limite suffisante ou applique ce profil à une nouvelle partie.');m.rules=r;record(m,'rules','Règles modifiées : application aux prochaines actions.');return true;}
export function cost(m,t){if(C.isEventGame(m))return eventStepCost(m,t);const p=player(m),discount=['moyenne_montagne','montagne','col'].includes(t.type)?m.rules.bikes[p.bike].mountainDiscount:0;return Math.max(0,(m.rules.terrain[t.type]??0)-discount);}
export function ferryOptions(m,from=player(m).pos){return m.mode==='plateau'&&!m.pendingAttack&&!m.done&&m.phase==='move'?m.edges.filter(e=>e.ferry&&(e.a===from||e.b===from)).map(e=>m.board[e.a===from?e.b:e.a]):[];}
export function moves(m){if(m.pendingAttack||m.done||m.phase!=='move'||m.moved>=distance(m)||C.isEventGame(m)&&player(m).turnModifiers?.skipMove)return [];const out=E.moves(view(m));if(m.mode!=='plateau')return out;const p=player(m),off=offroadToday(m,p);return out.filter(t=>!m.edges.some(e=>e.ferry&&((e.a===p.pos&&e.b===t.key)||(e.b===p.pos&&e.a===t.key)))&&offroadAllows(m,p,p.pos,t,m.moved,off)&&!snowBlocked(m,p,t));}
export function routeCheck(m,route){if(C.isEventGame(m))return eventRouteCheck(m,route);if(!Array.isArray(route)||!route.length||m.done||m.phase!=='move'||route.length>distance(m)-m.moved)return {ok:false,reason:'Limite de 5 cases ou journée indisponible.'};let pos=player(m).pos,energy=player(m).energy;const p=player(m),normalDistance=Math.max(0,Math.min(5,m.rules.distance+m.rules.bikes[p.bike].extraDistance)-(p.turnModifiers?.distancePenalty||0)-m.moved);let off=offroadToday(m,p);for(let i=0;i<route.length;i++){const key=route[i],t=m.board[key];if(!t||key===pos)return {ok:false,reason:'Les cases doivent se suivre.'};const near=m.mode==='plateau'?m.board[pos].links.includes(key)&&!m.edges.some(e=>e.ferry&&((e.a===pos&&e.b===key)||(e.b===pos&&e.a===key))):E.moves({...view(m),pos}).some(n=>E.key(n.x,n.y)===key);if(!near)return {ok:false,reason:'Choisis des cases voisines ; les bateaux se prennent séparément.'};if(!offroadAllows(m,p,pos,t,m.moved+i,off))return {ok:false,reason:offroadReason(m,p)};off=off||!roadStep(m,pos,t);energy-=cost(m,t)+(i>=normalDistance?(p.turnModifiers?.extraMoveEnergy||0):0)+weatherExtra(m,p,pos,t,m.moved+i);if(energy<0)return {ok:false,reason:'Énergie insuffisante pour ce parcours.'};pos=key;}return {ok:true,energyUsed:p.energy-energy};}
function offroadReason(m,p){const s=offroadStatus(m,p);return `Hors route sans ${s.item} : ${s.max} case${s.max>1?'s':''} maximum aujourd’hui.`;}
// « En suivant une route » : en mode Plateau, le côté traversé doit porter une route (routes-data.js).
function roadLink(m,from,t){return m.mode==='plateau'?Boolean(m.board[from]?.links?.includes(t.key)&&isRoadStep(m.board[from],t)):!!(m.board[from]?.roads?.length&&t.roads?.length);}
function terrainSurcharge(m,p,t){const discount=['moyenne_montagne','montagne','col'].includes(t.type)?m.rules.bikes[p.bike].mountainDiscount:0;return Math.max(0,(m.rules.terrain[t.type]??0)-discount)>m.rules.terrain.plaine;}
const routeWeather=m=>m.cardWindow?.weathers||(m.cardWindow?.weather?[m.cardWindow.weather]:[]);
// Vent dans le dos : cases offertes seulement en plaine, sur la côte ou en moyenne montagne (et en ville).
export const TAILWIND_TERRAINS=['plaine','cote','moyenne_montagne','ville'];
function freeKind(m,from,t,general=player(m).freeGeneralSteps||0,road=player(m).freeRoadSteps||0,tail=player(m).freeTailwindSteps||0){const p=player(m);if(p.frostTurn===m.turn||routeWeather(m).some(w=>w.kind==='frost'))return '';if(road>0&&roadLink(m,from,t))return 'road';if(tail>0&&TAILWIND_TERRAINS.includes(t.type))return 'tailwind';return general>0?'general':'';}
// Neige au sommet : montagne et cols interdits pendant ce tour.
const snowBlocked=(m,p,t)=>Boolean(C.isEventGame(m)&&p.turnModifiers?.noMountain&&['montagne','col'].includes(t?.type));
export const breakdownOf=p=>C.BREAKDOWNS[p.flatKind]||C.BREAKDOWNS.puncture;
function eventStepCost(m,t,step=0,free=freeKind(m,player(m).pos,t),lightUsed=player(m).lightTurn===m.turn){const p=player(m),weather=routeWeather(m),frost=p.frostTurn===m.turn||weather.some(w=>w.kind==='frost');
 const discount=['moyenne_montagne','montagne','col'].includes(t.type)?m.rules.bikes[p.bike].mountainDiscount:0,base=Math.max(0,(m.rules.terrain[t.type]??0)-discount);
 let amount=free&&!frost?0:p.shortcutActive&&!frost?Math.min(base,m.rules.terrain.plaine):base;
  if(!lightUsed&&C.hasBonusEffect(m,p,'light_bike')&&!frost&&amount>m.rules.terrain.plaine)amount=Math.max(0,amount-1);
 if(step===0)amount+=(p.pendingEffects||[]).filter(e=>e.kind==='extra_energy').reduce((n,e)=>n+e.value,0)+weather.filter(w=>w.kind==='extra_energy').reduce((n,w)=>n+w.value,0);
 for(const w of weather)if(!w.used&&(w.kind==='mountain_snow'&&['moyenne_montagne','montagne'].includes(t.type)||w.kind==='heavy_rain'&&!hasRoad(t)||w.kind==='coastal_storm'&&t.type==='cote'))amount+=w.value;
 return amount;
}
function eventRouteCheck(m,route){const p=player(m);if(m.pendingAttack||!Array.isArray(route)||!route.length||m.done||m.phase!=='move'||p.turnModifiers?.skipMove||route.length>distance(m)-m.moved)return {ok:false,reason:'Déplacement indisponible ou distance maximale atteinte.'};
 let pos=p.pos,energy=p.energy,general=p.freeGeneralSteps||0,road=p.freeRoadSteps||0,tail=p.freeTailwindSteps||0,normalUsed=m.moved-(p.bonusDistanceUsed||0),lightUsed=p.lightTurn===m.turn,off=offroadToday(m,p);const normalMax=Math.max(0,Math.min(5,m.rules.distance+m.rules.bikes[p.bike].extraDistance)-(p.turnModifiers?.distancePenalty||0));for(let i=0;i<route.length;i++){
  const key=route[i],t=m.board[key];if(!t||key===pos)return {ok:false,reason:'Les cases doivent se suivre.'};
  const near=m.mode==='plateau'?m.board[pos].links.includes(key)&&!m.edges.some(e=>e.ferry&&((e.a===pos&&e.b===key)||(e.b===pos&&e.a===key))):E.moves({...view(m),pos}).some(n=>E.key(n.x,n.y)===key);
  if(!near)return {ok:false,reason:'Choisis des cases voisines ; les bateaux se prennent séparément.'};
  if(p.blockedFirst===key&&i===0)return {ok:false,reason:'Route barrée : choisis une autre première case.'};
  if(!offroadAllows(m,p,pos,t,m.moved+i,off))return {ok:false,reason:offroadReason(m,p)};off=off||!roadStep(m,pos,t);
  if(snowBlocked(m,p,t))return {ok:false,reason:'Neige au sommet : montagne et cols interdits aujourd’hui.'};
  const free=freeKind(m,pos,t,general,road,tail);if(!free&&normalUsed>=normalMax)return {ok:false,reason:'Ces cases supplémentaires exigent une route autorisée pour le covoiturage.'};
  const spent=eventStepCost(m,t,i+(m.cardWindow?.resolving?(m.cardWindow.stepIndex||0):0),free,lightUsed)+weatherExtra(m,p,pos,t,m.moved+i);energy-=spent;if(energy<0)return {ok:false,reason:'Énergie insuffisante pour ce parcours.'};
  if(C.hasBonusEffect(m,p,'light_bike')&&!lightUsed&&!free&&!p.shortcutActive&&p.frostTurn!==m.turn&&!routeWeather(m).some(w=>w.kind==='frost')&&terrainSurcharge(m,p,t))lightUsed=true;
  if(free==='road')road--;else if(free==='tailwind')tail--;else if(free==='general')general--;else normalUsed++;pos=key;
 }return {ok:true,energyUsed:p.energy-energy};}
export function executeRoute(m,route){if(C.isEventGame(m)){if(m.players.length===1&&!m.cardWindow&&(player(m).pendingEffects||[]).some(e=>e.kind==='solo_weather'))return beginEventRoute(m,route).ok;if(m.players.length>1&&!m.cardWindow?.resolving)return false;const check=routeCheck(m,route);if(!check.ok)return false;for(const key of route)if(!move(m,key))return false;return true;}
 const check=routeCheck(m,route);if(!check.ok)return false;for(const key of route)if(!move(m,key))throw Error('Parcours devenu invalide.');return true;}
export function beginEventRoute(m,route){if(!C.isEventGame(m))return executeRoute(m,route);const p=player(m),check=eventRouteCheck(m,route);if(!check.ok)return {ok:false,reason:check.reason};
 const road=(p.pendingEffects||[]).find(e=>e.kind==='road_closed');if(road&&!p.blockedFirst){p.blockedFirst=route[0];C.note(m,p,`Route barrée : ${m.board[route[0]]?.name||'première case'} est interdite pour ce déplacement.`);return {ok:false,reason:'Route barrée : ce premier trajet est interdit. Choisis une autre route.'};}
 if(m.players.length===1){const effects=(p.pendingEffects||[]).filter(e=>e.kind==='solo_weather'),weathers=[];
  for(const effect of effects){const c=C.card(effect.cardId,m);if(C.climateEligible(m,c.id,route)){weathers.push(C.weatherFor(c));C.note(m,p,`${c.name} s’applique à ce parcours.`);}else C.note(m,p,`${c.name} : le parcours ne traverse pas le terrain concerné, aucun effet.`);C.discard(m,effect.cardId);}
  p.pendingEffects=p.pendingEffects.filter(e=>e.kind!=='solo_weather');m.cardWindow={route:[...route],responders:[],responderIndex:0,solo:true,weathers};finishEventRoute(m);return {ok:true};}
 // Sans cartes climatiques dans la partie (météo annoncée ou Rencontres), personne ne peut intervenir : pas de fenêtre.
 if(!m.eventCardIds.some(id=>C.card(id,m)?.category==='climatic')){m.cardWindow={route:[...route],responders:[],responderIndex:0,weathers:[]};finishEventRoute(m);return {ok:true};}
 C.beginRouteWindow(m,route);return {ok:true,intervention:true};}
export function passEventIntervention(m){if(!C.passIntervention(m))return false;if(!C.currentResponder(m))finishEventRoute(m);return true;}
export function finishEventRoute(m){const window=m.cardWindow;if(!window||m.pendingAttack)return false;const p=player(m),weather=routeWeather(m);window.resolving=true;m.phase='move';if(weather.some(w=>w.kind==='frost'))p.frostTurn=m.turn;
 let route=window.route;if(weather.some(w=>w.kind==='stop'))route=[];const penalty=weather.filter(w=>w.kind==='short_move').reduce((n,w)=>n+w.value,0);if(penalty)route=route.slice(0,Math.max(0,route.length-penalty));
 let moved=0;for(const key of route){window.stepIndex=moved;const t=m.board[key],check=eventRouteCheck(m,[key]);if(!check.ok)break;if(!move(m,key))break;moved++;if(weather.some(w=>w.kind==='coastal_storm')&&t.type==='cote')break;}
 if(!moved&&weather.length)C.note(m,p,`${p.name} ne peut pas avancer après l’intervention météo.`);
 if(window.solo){if(penalty)p.turnModifiers.distancePenalty=(p.turnModifiers.distancePenalty||0)+penalty;if(weather.some(w=>w.kind==='stop')||!moved&&weather.length||weather.some(w=>w.kind==='coastal_storm')&&m.board[p.pos].type==='cote')p.turnModifiers.skipMove=true;}
 if(moved)p.shortcutActive=false;m.cardWindow=null;return true;}
export function place(m,index,x,y){if(m.pendingAttack||m.mode!=='tuiles'||m.placed||m.done)return false;const v=view(m);if(!E.place(v,index,x,y))return false;m.board=v.board;m.deck=v.deck;m.hand=v.hand;m.phase='move';m.placed=true;record(m,'place','Une tuile '+E.terrains[m.board[E.key(x,y)].type].name+' a été posée.');return true;}
export function rescueHand(m){const v=view(m);if(!E.rescueHand(v))return false;m.hand=v.hand;return true;}
export function move(m,k){const p=player(m),t=m.board[k];if(C.isEventGame(m)&&m.players.length>1&&!m.cardWindow?.resolving||!t||!moves(m).some(n=>m.mode==='plateau'?n.key===k:E.key(n.x,n.y)===k))return false;
 if(C.isEventGame(m)&&m.players.length===1&&!m.cardWindow&&(p.pendingEffects||[]).some(e=>e.kind==='solo_weather')){beginEventRoute(m,[k]);return p.pos===k;}
 const normalDistance=Math.max(0,Math.min(5,m.rules.distance+m.rules.bikes[p.bike].extraDistance)-(p.turnModifiers?.distancePenalty||0)),extra=m.moved>=normalDistance?(p.turnModifiers?.extraMoveEnergy||0):0;
 const eventGame=C.isEventGame(m),step=m.cardWindow?.resolving?(m.cardWindow.stepIndex||0):0,free=eventGame?freeKind(m,p.pos,t):'',normalMax=Math.max(0,Math.min(5,m.rules.distance+m.rules.bikes[p.bike].extraDistance)-(p.turnModifiers?.distancePenalty||0));
 if(eventGame&&!free&&m.moved-(p.bonusDistanceUsed||0)>=normalMax)return false;
 if(!offroadAllows(m,p,p.pos,t,m.moved,offroadToday(m,p)))return false;
 if(snowBlocked(m,p,t))return false;
 const onRoad=roadStep(m,p.pos,t);
 const spent=(eventGame?eventStepCost(m,t,step,free):cost(m,t)+extra)+weatherExtra(m,p,p.pos,t,m.moved);
 if(p.energy<spent)return false;
  const usedFree=eventGame&&!!free,usedLight=eventGame&&C.hasBonusEffect(m,p,'light_bike')&&p.lightTurn!==m.turn&&!usedFree&&!p.shortcutActive&&terrainSurcharge(m,p,t);
 p.energy-=spent;m.stats.energySpent+=spent;p.stats.energySpent+=spent;if(m.moved===0)p.dayStart={turn:m.turn,pos:p.pos};if(m.mode==='plateau'&&!onRoad){p.offroadTurn=m.turn;p.stats.offroad=(p.stats.offroad||0)+1;}p.pos=k;if(t.type==='ville')p.lastCity=k;p.steps++;p.stats.steps++;m.moved++;m.stats.terrain[t.type]=(m.stats.terrain[t.type]||0)+1;
 if(usedFree){p.freeSteps--;if(free==='road')p.freeRoadSteps--;else if(free==='tailwind')p.freeTailwindSteps--;else p.freeGeneralSteps--;p.bonusDistanceUsed=(p.bonusDistanceUsed||0)+1;}if(usedLight)p.lightTurn=m.turn;
 for(const weather of routeWeather(m))if(['mountain_snow','heavy_rain','coastal_storm'].includes(weather.kind)){
  if(weather.kind==='mountain_snow'&&['moyenne_montagne','montagne'].includes(t.type)||weather.kind==='heavy_rain'&&!hasRoad(t)||weather.kind==='coastal_storm'&&t.type==='cote')weather.used=true;
 }
 if(eventGame&&step===0){for(const effect of (p.pendingEffects||[]).filter(e=>['extra_energy','road_closed'].includes(e.kind)))C.discard(m,effect.cardId);p.pendingEffects=(p.pendingEffects||[]).filter(e=>!['extra_energy','road_closed'].includes(e.kind));p.blockedFirst=null;}
 p.travel.push(k);const v=voyages.find(v=>v.id===p.voyage);p.travelHistory.push({key:k,boardKey:k,type:t.type,endpoint:t.name===v.from||t.name===v.to,day:m.round});
 const first=!p.visited.includes(k);if(first){p.visited.push(k);p.points+=m.rules.points[t.type];if(t.type==='col')p.cols++;if(t.type==='ville')p.cities++;if(t.type==='decouverte')p.discoveries++;}
 adventureStep(m,p,k,t,first);
 if(eventGame&&t.type==='ville')C.onCityVisit(m,p,k);
 if(!p.completed&&t.name===v.to&&progress(view(m)).ready){p.completed=true;p.voyageWon=true;p.points+=voyagePoints(v);record(m,'objective','Objectif accompli : '+v.title+' (+'+voyagePoints(v)+' points)');}
 record(m,'move','Déplacement : '+(t.name||E.terrains[t.type].name)+' (−'+spent+' énergie).',{terrain:t.type,energy:spent});if(eventGame&&!m.cardWindow)p.shortcutActive=false;return true;
}
export function eat(m){const p=player(m);if(m.pendingAttack||m.done||!['move','place'].includes(m.phase)||m.ate>=m.rules.food.maxPerTurn||p.food<1||p.energy>=energyCap(m,p)||(!p.items.includes('rechaud')&&!['ville','auberge'].includes(m.board[p.pos].type)))return false;p.food--;m.ate++;const base=C.isEventGame(m)?C.hasBonusEffect(m,p,'efficient_stove')?3:m.rules.cardBalance.foodEnergy:m.rules.food.energy;p.energy=Math.min(energyCap(m,p),p.energy+base+(p.items.includes('rechaud')?m.rules.food.stoveBonus:0));record(m,'food','Un repas a été consommé.');return true;}
export function buyFood(m){const p=player(m),r=m.rules.food;if(m.pendingAttack||m.done||!['move','place'].includes(m.phase)||(r.cityOnly&&m.board[p.pos].type!=='ville')||p.money<r.price||C.isEventGame(m)&&p.food>=C.foodCapacity(m,p))return false;p.money-=r.price;p.food+=C.isEventGame(m)?Math.min(r.quantity,C.foodCapacity(m,p)-p.food):r.quantity;m.stats.moneySpent+=r.price;record(m,'buy','Achat de provisions.');return true;}
export function restaurant(m){const p=player(m),r=m.rules.food;if(m.pendingAttack||m.done||!['move','place'].includes(m.phase)||m.board[p.pos].type!=='ville'||p.money<r.restaurantPrice||p.energy>=energyCap(m,p)||m.ate>=r.maxPerTurn)return false;p.money-=r.restaurantPrice;m.stats.moneySpent+=r.restaurantPrice;m.ate++;p.energy=Math.min(energyCap(m,p),p.energy+r.restaurantEnergy);record(m,'food','Repas au restaurant.');return true;}
export function buy(m,id){const p=player(m),e=m.rules.equipment[id];if(!e||m.pendingAttack||m.done||!['move','place'].includes(m.phase)||m.board[p.pos].type!=='ville'||p.items.includes(id)||p.money<e.price||inventorySpace(m)+e.space>m.rules.bikes[p.bike].capacity)return false;p.money-=e.price;p.items.push(id);p.food+=e.foodBonus||0;m.stats.moneySpent+=e.price;record(m,'buy','Équipement acheté : '+e.name);return true;}
export function discard(m,id){const p=player(m);if(m.pendingAttack||m.done||!['move','place'].includes(m.phase)||!p.items.includes(id))return false;p.items=p.items.filter(i=>i!==id);record(m,'equipment','Équipement déposé : '+m.rules.equipment[id].name);return true;}
export function work(m){const p=player(m);if(!m.rules.workEnabled||m.pendingAttack||m.done||!['move','place'].includes(m.phase)||m.moved||m.placed||(m.rules.workCityOnly&&m.board[p.pos].type!=='ville'))return false;p.money+=m.rules.salary;p.stats.work++;m.stats.work++;m.turnKind='work';m.actionDays=m.rules.workDays;record(m,'work','Travail : +'+m.rules.salary+' pièces, '+m.actionDays+' jour(s) sans déplacement.');endTurn(m);return true;}
export function rest(m,id){const p=player(m),r=m.rules.rest[id],free=id==='bivouac'&&p.turnModifiers?.freeBivouac;if(!r||m.pendingAttack||m.done||!['move','place'].includes(m.phase)||m.moved||m.placed||(!free&&(p.money<r.price||(r.tent&&!p.items.includes('tente'))))||(r.cityOnly&&m.board[p.pos].type!=='ville'))return false;if(!free){p.money-=r.price;m.stats.moneySpent+=r.price;const bonus=p.items.reduce((n,i)=>n+(m.rules.equipment[i]?.energyBonus||0),0);const restEnergy=C.isEventGame(m)&&id==='bivouac'?C.hasBonusEffect(m,p,'comfortable_tent')?2:m.rules.cardBalance.bivouacEnergy:r.energy;p.energy=Math.min(energyCap(m,p),p.energy+restEnergy+bonus);}if(id!=='bivouac')p.fatigue=0;p.stats.rest++;m.stats.rest++;m.turnKind='rest';m.actionDays=r.days;record(m,'rest',(free?'Bivouac gratuit grâce à Abri trouvé':r.name)+' : '+r.days+' jour(s) sans déplacement.');endTurn(m);return true;}
function random(m){return E.random(m);}
function weighted(m,list){let n=random(m)*list.reduce((s,e)=>s+e.weight,0);return list.find(e=>(n-=e.weight)<0)||list.at(-1);}
export function drawEvent(m){let n=random(m)*100,category='challenge';for(const [k,value]of Object.entries(m.rules.probabilities)){n-=value;if(n<0){category=k;break;}}
 const type=m.board[player(m).pos].type,terrain=['col'].includes(type)?'montagne':['camping','auberge','decouverte'].includes(type)?'plaine':type;
 const pool=m.rules.events.filter(e=>e.category===category&&e.weight>0&&(e.terrain===terrain||e.terrain==='general'));
 return clone(weighted(m,pool));
}
export function drawCard(m){if(C.isEventGame(m))return C.draw(m);const pool=effectiveCards(m).filter(c=>c.weight>0&&(!c.legacy)&&(m.players.length>1||c.target==='self'));let n=E.random(m)*pool.reduce((sum,c)=>sum+c.weight,0);return (pool.find(c=>(n-=c.weight)<0)||pool.at(-1)).id;}
export function endTurn(m){if(m.pendingAttack||m.done||!['move','place'].includes(m.phase))return false;
 const rider=player(m),fatigue=m.rules.fatigue;
 if(fatigue?.enabled&&m.moved>0&&m.turnKind!=='rest'){const was=isExhausted(m,rider);rider.fatigue=Math.min(fatigue.days,(rider.fatigue||0)+1+(rider.dayCols?fatigue.colExtra:0));
  if(!was&&isExhausted(m,rider)){rider.energy=Math.min(rider.energy,energyCap(m,rider));record(m,'fatigue',`${rider.name} est fourbu : énergie maximale −${fatigue.maxEnergyPenalty} jusqu’à une vraie nuit (camping ou hôtel).`);}}
 rider.dayCols=0;
 record(m,'end','Fin du tour sur '+(m.board[player(m).pos].name||E.terrains[m.board[player(m).pos].type].name)+'.',{distance:m.moved,action:m.turnKind});
 if(C.isEventGame(m)){const p=player(m);C.onTurnEnd(m,p);if(p.blockedFirst){for(const effect of (p.pendingEffects||[]).filter(e=>e.kind==='road_closed'))C.discard(m,effect.cardId);p.pendingEffects=(p.pendingEffects||[]).filter(e=>e.kind!=='road_closed');p.blockedFirst=null;}p.freeSteps=0;p.freeGeneralSteps=0;p.freeRoadSteps=0;p.freeTailwindSteps=0;p.bonusDistanceUsed=0;p.shortcutActive=false;if(m.encounters){beginEncounter(m);return true;}C.drawChoices(m);if(!m.cardChoices.length&&!m.pendingAttack)advance(m);return true;}
 m.cardChoices=[drawCard(m),drawCard(m)];m.phase='card-choice';record(m,'draw','Deux cartes de jeu piochées : en garder une.');return true;
}
export function chooseCard(m,index){if(C.isEventGame(m)){if(!C.keepChoice(m,index))return false;if(m.phase!=='card-discard')advance(m);return true;}
 if(m.phase!=='card-choice'||![0,1].includes(index)||m.cardChoices.length!==2)return false;const kept=m.cardChoices[index],discarded=m.cardChoices[1-index],hand=player(m).cardHand;hand.push(kept);const overflow=hand.length>5?hand.shift():null;record(m,'card','Carte gardée : '+cardById(kept,m).title+' ; '+cardById(discarded,m).title+' défaussée.'+(overflow?' Main pleine : '+cardById(overflow,m).title+' défaussée.':''));m.cardChoices=[];advance(m);return true;}
export function discardEventHand(m,index){if(!C.isEventGame(m)||!C.discardHand(m,index))return false;if(player(m).cardHand.length<=C.handLimit(m))advance(m);return true;}
export function canPlayCard(m,index){const p=player(m);if(C.isEventGame(m)){const c=C.card(p.cardHand[index],m);return !!c&&!m.pendingAttack&&!m.done&&['move','place'].includes(m.phase)&&p.cardPlayedTurn!==m.turn&&c.playTiming==='own_turn'&&(c.category!=='permanent'||C.bonusLimit(m)>0)&&(c.category!=='negative'||m.players.length>1&&p.negativePlayedTurn!==m.turn);}
 const c=cardById(p.cardHand[index],m);if(!c||m.done||!['move','place'].includes(m.phase))return false;if(c.effect?.repair)return !!(p.turnModifiers?.distancePenalty||p.turnModifiers?.extraMoveEnergy||p.flat);return true;}
export function playCard(m,index,targetId,choice){if(C.isEventGame(m)){if(!canPlayCard(m,index))return false;const c=C.card(player(m).cardHand[index],m);return c.category==='negative'?C.beginAttack(m,player(m).id,index,targetId):C.playOwnCard(m,index,choice);}
 if(!canPlayCard(m,index))return false;const p=player(m),id=p.cardHand[index],card=cardById(id,m),target=card.target==='self'?p:m.players.find(other=>other.id===targetId&&other.id!==p.id);if(!target)return false;if(card.type==='negative'&&!card.legacy){target.pendingCards||=[];target.pendingCards.push(card.id);}else if(card.effect?.repair){if(p.turnModifiers?.distancePenalty)p.turnModifiers.distancePenalty=0;else if(p.turnModifiers?.extraMoveEnergy)p.turnModifiers.extraMoveEnergy=0;else p.flat=false;}else if(card.choice==='food-energy'){if(choice==='food')p.food++;else if(choice==='energy')p.energy=Math.min(energyCap(m,p),p.energy+1);else return false;}else if(card.effect?.freeBivouac){p.turnModifiers={...p.turnModifiers,freeBivouac:true};p.energy=Math.min(energyCap(m,p),p.energy+2);}else if(card.effect?.bonusDistance)p.turnModifiers={...p.turnModifiers,bonusDistance:Math.min(1,(p.turnModifiers?.bonusDistance||0)+card.effect.bonusDistance)};else for(const [key,value]of Object.entries(card.effect||{}))target[key]=Math.max(0,key==='energy'?Math.min(energyCap(m,target),target[key]+value):target[key]+value);p.cardHand.splice(index,1);record(m,'card',card.title+(card.type==='negative'?' donnée à '+target.name+'.':' jouée.'),{cardId:id,targetId:target.id});return true;}
export function eventClimateOptions(m,actorId){const p=m.players.find(q=>q.id===actorId);if(!C.isEventGame(m)||!p||p===player(m)||p.climatePlayedTurn===m.turn||m.pendingAttack||!['move','place','card-intervention'].includes(m.phase))return [];return p.cardHand.map((id,index)=>({index,card:C.card(id,m)})).filter(({card})=>card?.category==='climatic'&&C.climateEligible(m,card.id)&&(!m.cardWindow||!m.cardWindow.climateUsed&&C.currentResponder(m)===actorId));}
export function playEventClimate(m,actorId,index){return C.isEventGame(m)&&C.beginAttack(m,actorId,index,player(m).id);}
function settleSoloDraw(m){if(m.players.length===1&&!m.pendingAttack&&m.phase==='card-choice'&&!m.cardChoices.length)advance(m);}
export function defendEventAttack(m){if(!C.isEventGame(m)||!C.defend(m))return false;settleSoloDraw(m);return true;}
export function resolveEventAttack(m,choice){if(!C.isEventGame(m)||!C.resolveAttack(m,choice))return false;settleSoloDraw(m);return true;}
export function resolvePendingCard(m,choice='auto'){const p=player(m);if(m.phase!=='card-resolution'||!p.pendingCards?.length)return false;const id=p.pendingCards[0],card=cardById(id,m);if(!card)return false;const hasTube=p.items.includes('chambre'),hasKit=p.items.includes('kit');if(card.resolution==='tube'){if(choice==='tube'&&hasTube)p.items=p.items.filter(i=>i!=='chambre');else if(choice==='lose'||!hasTube)p.turnModifiers={...p.turnModifiers,distancePenalty:(p.turnModifiers?.distancePenalty||0)+1};else return false;}else if(card.resolution==='kit-energy'){if(choice==='kit'&&hasKit){}else if(choice==='energy'||!hasKit)p.energy=Math.max(0,p.energy-2);else return false;}else if(card.resolution==='rain')p.turnModifiers={...p.turnModifiers,distancePenalty:(p.turnModifiers?.distancePenalty||0)+1};else if(card.resolution==='hunger'){if(choice==='food'&&p.food>0)p.food--;else if(choice==='energy'||!p.food)p.energy=Math.max(0,p.energy-2);else return false;}else if(card.resolution==='bad-night')p.energy=Math.max(0,p.energy-1);else if(card.resolution==='detour')p.turnModifiers={...p.turnModifiers,bonusDistance:Math.min(1,(p.turnModifiers?.bonusDistance||0)+1),extraMoveEnergy:1};p.pendingCards.shift();record(m,'card-resolution',card.title+' résolue.');if(p.pendingCards.length)m.phase='card-resolution';else m.phase=p.flat?'puncture':m.mode==='tuiles'&&m.hand.length?'place':'move';return true;}
export function repairPuncture(m){const p=player(m);if(m.phase!=='puncture'||!p.flat)return false;const b=breakdownOf(p),what=b.item==='secours'?'trousse de secours':'kit de réparation';p.flatKind=null;if(p.items.includes(b.item)){p.flat=false;record(m,'repair',`${b.title} : ${b.item==='secours'?'soigné':'réparé'} avec ${b.item==='secours'?'la':'le'} ${what}, la journée peut continuer.`);m.phase=m.mode==='tuiles'&&m.hand.length?'place':'move';return true;}p.flat=false;p.pos=p.lastCity&&m.board[p.lastCity]?p.lastCity:p.pos;record(m,'repair',`${b.title} sans ${what} : retour à la dernière ville et journée perdue.`);m.phase='move';m.turnKind='repair';endTurn(m);return true;}
export function travelFerry(m,destination){const p=player(m),t=ferryOptions(m).find(t=>t.key===destination),fare=m.rules.ferryPrice;if(!t||p.money<fare)return false;p.money-=fare;m.stats.moneySpent+=fare;p.pos=t.key;if(t.type==='ville')p.lastCity=t.key;p.travel.push(t.key);const v=voyages.find(v=>v.id===p.voyage);p.travelHistory.push({key:t.key,boardKey:t.key,type:t.type,endpoint:t.name===v.from||t.name===v.to,day:m.round});if(!p.visited.includes(t.key)){p.visited.push(t.key);p.points+=m.rules.points[t.type];}if(!p.completed&&t.name===v.to&&progress(view(m)).ready){p.completed=true;p.voyageWon=true;p.points+=voyagePoints(v);record(m,'objective','Objectif accompli : '+v.title+' (+'+voyagePoints(v)+' points)');}m.turnKind='ferry';record(m,'ferry','Bateau vers '+(t.name||t.key)+' : −'+fare+' pièces, journée terminée.');endTurn(m);return true;}
export function canChallenge(m){const p=player(m),e=m.event;if(!e||e.category!=='challenge')return false;if(e.protect&&p.items.includes(e.protect))return true;return Object.entries(e.cost||{}).every(([k,v])=>p[k]>=v);}
export function resolve(m,choice='accept'){
 const p=player(m),e=m.event;if(m.phase!=='event'||!e)return false;
 if(e.category==='challenge'&&!['accept','decline'].includes(choice))return false;
 const accepted=e.category!=='challenge'||choice==='accept';if(accepted&&e.category==='challenge'&&!canChallenge(m))return false;
 const protectors=e.id==='legacy-16'&&e.protect==='chambre'?['chambre','kit']:[e.protect];const protection=protectors.find(id=>id&&p.items.includes(id));
 if(accepted){if(e.category==='challenge'){if(!protection)for(const [k,v]of Object.entries(e.cost||{}))p[k]-=v;applyEffect(m,e.effect);}else if(!(e.category==='negative'&&protection))applyEffect(m,e.effect);if(protection&&e.consume&&!(e.id==='legacy-16'&&e.protect==='chambre'&&protection==='kit'))p.items=p.items.filter(id=>id!==protection);}
 record(m,'resolve',accepted?'Carte résolue : '+e.title+(protection?' (équipement utilisé).':'.'):'Défi refusé : '+e.title);m.event=null;advance(m);return true;
}
function applyEffect(m,effect){const p=player(m);for(const [k,v]of Object.entries(effect))p[k]=Math.max(0,k==='energy'?Math.min(energyCap(m,p),p[k]+v):k==='food'&&C.isEventGame(m)?Math.min(C.foodCapacity(m,p),p[k]+v):p[k]+v);}
// ---------- Rencontres (mode choisi au début de la partie, à la place des cartes Événement) ----------
export const encountersOn=m=>Boolean(m.encounters&&m.mode==='plateau');
function encounterPlace(m,p){const t=m.board[p.pos],type=['moyenne_montagne','montagne','col'].includes(t?.type)?'montagne':t?.type;return {type,region:regionOf(t)};}
export function encounterOptions(m,p=player(m)){const {type,region}=encounterPlace(m,p),seen=p.encountersSeen||[];
 const fits=ENCOUNTERS.filter(e=>e.where==='partout'||e.where===type||e.where===region);const fresh=fits.filter(e=>!seen.includes(e.id));return fresh.length?fresh:fits;}
function beginEncounter(m){const p=player(m),options=encounterOptions(m,p);if(!options.length){advance(m);return;}
 let h=(m.seed^Math.imul(m.turn+1,0x9e3779b1))>>>0;h=Math.imul(h^(h>>>15),0x2c1b3c6d)>>>0;const e=options[h%options.length];
 m.encounter={id:e.id,playerId:p.id};m.phase='encounter';}
export const currentEncounter=m=>m.encounter?ENCOUNTERS.find(e=>e.id===m.encounter.id):null;
export function canChooseEncounter(m,index){const e=currentEncounter(m),c=e?.choices[index],p=player(m);if(!c||m.phase!=='encounter')return false;return Object.entries(c.need||{}).every(([k,v])=>(p[k]||0)>=v);}
export function resolveEncounter(m,index){if(!canChooseEncounter(m,index))return false;const e=currentEncounter(m),c=e.choices[index],p=player(m),fx=c.effect||{};
 if(fx.energy)p.energy=Math.max(0,Math.min(energyCap(m,p),p.energy+fx.energy));
 for(const k of ['food','money','points'])if(fx[k])p[k]=Math.max(0,p[k]+fx[k]);
 if(fx.food)p.food=Math.min(p.food,C.foodCapacity(m,p));
 if(fx.fatigue&&m.rules.fatigue?.enabled){const was=isExhausted(m,p);p.fatigue=Math.max(0,Math.min(m.rules.fatigue.days,(p.fatigue||0)+fx.fatigue));if(!was&&isExhausted(m,p))p.energy=Math.min(p.energy,energyCap(m,p));}
 if(fx.tomorrow)p.nextDay={tomorrow:fx.tomorrow};
 p.encountersSeen=[...(p.encountersSeen||[]),e.id];
 record(m,'encounter',`${e.title} : ${c.label}. ${c.text}`,{encounterId:e.id,choice:index});
 m.encounter=null;m.phase='move';advance(m);return true;}
function advance(m){player(m).turns++;m.stats.turns++;const r=m.rules.victory,budget=m.rules.budget,rider=player(m);
 if(budget?.amount>0&&rider.turns%budget.every===0){rider.money+=budget.amount;record(m,'budget',`Budget du voyage : +${budget.amount} pièces pour ${rider.name} (tous les ${budget.every} tours).`);}
 const win=r.mode==='objectives'&&(r.allObjectives?m.players.every(p=>p.completed):m.players.some(p=>p.completed))||r.mode==='points'&&m.players.some(p=>p.points>=r.points);
 if(win){m.done=true;m.phase='finished';record(m,'finish','Condition de victoire atteinte.');return;}
 player(m).availableDay=(player(m).availableDay||m.round)+(m.actionDays||1);
 const nextDay=Math.min(...m.players.map(p=>p.availableDay));let next=m.activeIndex;
 for(let offset=1;offset<=m.players.length;offset++){const i=(m.activeIndex+offset)%m.players.length;if(m.players[i].availableDay===nextDay){next=i;break;}}
 m.activeIndex=next;m.round=nextDay;m.turn++;m.moved=0;m.ate=0;m.placed=false;m.turnKind='travel';m.actionDays=1;
 if(r.mode==='turns'&&m.round>r.turns){m.done=true;m.phase='finished';record(m,'finish','Nombre de manches atteint.');return;}
 const nextPlayer=player(m);nextPlayer.turnModifiers={};
 if(C.isEventGame(m)){
  nextPlayer.freeSteps=0;nextPlayer.freeGeneralSteps=0;nextPlayer.freeRoadSteps=0;nextPlayer.freeTailwindSteps=0;nextPlayer.bonusDistanceUsed=0;nextPlayer.shortcutActive=false;nextPlayer.blockedFirst=null;
  // Rencontre de la veille : une case de plus (cases offertes) ou de moins aujourd'hui.
  const nd=nextPlayer.nextDay;if(nd){if(nd.tomorrow>0){nextPlayer.freeSteps+=nd.tomorrow;nextPlayer.freeGeneralSteps+=nd.tomorrow;}else if(nd.tomorrow<0)nextPlayer.turnModifiers.distancePenalty=-nd.tomorrow;nextPlayer.nextDay=null;}
  for(const effect of [...(nextPlayer.pendingEffects||[])])if(['skip_move','short_move','no_mountain'].includes(effect.kind)){
   if(effect.kind==='no_mountain')nextPlayer.turnModifiers.noMountain=true;else if(effect.kind==='skip_move')nextPlayer.turnModifiers.skipMove=true;else nextPlayer.turnModifiers.distancePenalty=(nextPlayer.turnModifiers.distancePenalty||0)+effect.value;
   C.discard(m,effect.cardId);nextPlayer.pendingEffects.splice(nextPlayer.pendingEffects.indexOf(effect),1);
  }
  m.phase=nextPlayer.flat?'puncture':m.mode==='tuiles'&&m.hand.length?'place':'move';
 }else m.phase=nextPlayer.pendingCards?.length?'card-resolution':nextPlayer.flat?'puncture':m.mode==='tuiles'&&m.hand.length?'place':'move';
}
export const ranking=m=>[...m.players].sort((a,b)=>b.points-a.points||Number(b.completed)-Number(a.completed));
export function serialize(m){return JSON.stringify(m);}
export function load(text){
 const raw=JSON.parse(text);if(raw?.version===1)return migrate(raw);
 const count=n=>Number.isInteger(n)&&n>=0;
 if(raw?.version!==2||!Array.isArray(raw.players)||raw.players.length<1||raw.players.length>6||!raw.board||!count(raw.activeIndex)||!raw.players[raw.activeIndex]||!['plateau','tuiles'].includes(raw.mode)||!['move','place','event','card-choice','card-discard','card-intervention','card-resolution','puncture','encounter','finished'].includes(raw.phase)||raw.phase==='encounter'&&!ENCOUNTERS.some(e=>e.id===raw.encounter?.id)||!count(raw.round)||raw.round<1||!count(raw.turn)||!count(raw.moved)||raw.moved>(raw.cardVersion===3?40:5)||!Array.isArray(raw.history)||!Array.isArray(raw.deck)||!Array.isArray(raw.hand)||!raw.stats||!raw.stats.categories||!raw.stats.terrain)throw Error('Sauvegarde invalide.');
  raw.rules=validateRules(raw.rules);
  if(raw.cardVersion===3)raw.eventCardEdits=normalizeEventEdits(raw.eventCardEdits||[]);
 raw.customCards=normalizeCustomCards(raw.customCards||[]);
 if(raw.cardVersion===3){raw.soloEventQueue??=[];raw.eventCardIds??=EVENT_CARDS.filter(c=>raw.players.length>1||c.targetType==='self').map(c=>c.id);
  if(!Array.isArray(raw.eventCardIds)||!raw.eventCardIds.length&&!raw.encounters||new Set(raw.eventCardIds).size!==raw.eventCardIds.length||raw.eventCardIds.some(id=>!EVENT_CARDS.some(c=>c.id===id))||!Array.isArray(raw.soloEventQueue)||raw.players.length>1&&raw.soloEventQueue.length)throw Error('Bibliothèque Événement invalide.');
  const ids=[...(raw.eventDeck||[]),...(raw.eventDiscard||[]),...(raw.cardChoices||[]),...raw.soloEventQueue,...(raw.pendingAttack?[raw.pendingAttack.cardId]:[]),...raw.players.flatMap(p=>[...(p.cardHand||[]),...(p.bonusCards||[]),...(p.pendingEffects||[]).map(e=>e.cardId)])],expected=raw.eventCardIds;
  if(!Array.isArray(raw.eventDeck)||!Array.isArray(raw.eventDiscard)||ids.length!==expected.length||new Set(ids).size!==expected.length||ids.some(id=>!expected.includes(id))||raw.players.some(p=>p.cardHand?.length>C.handLimit(raw)+1||p.bonusCards?.length>C.bonusLimit(raw)))throw Error('Pioche Événement invalide.');
  if(raw.pendingAttack&&(!raw.players.some(p=>p.id===raw.pendingAttack.actorId)||!raw.players.some(p=>p.id===raw.pendingAttack.targetId)||raw.pendingAttack.actorId===raw.pendingAttack.targetId&&!(raw.players.length===1&&raw.pendingAttack.solo===true)))throw Error('Attaque sauvegardée invalide.');
  if(raw.phase==='card-intervention'&&(!raw.cardWindow||!Array.isArray(raw.cardWindow.route)||!raw.cardWindow.route.length||!Array.isArray(raw.cardWindow.responders)||!Number.isInteger(raw.cardWindow.responderIndex)||raw.cardWindow.responderIndex<0||raw.cardWindow.responderIndex>=raw.cardWindow.responders.length||raw.cardWindow.route.some(key=>!raw.board[key])))throw Error('Intervention sauvegardée invalide.');
  if(raw.phase==='card-discard'&&raw.players[raw.activeIndex].cardHand.length!==C.handLimit(raw)+1||raw.phase==='card-choice'&&(!Array.isArray(raw.cardChoices)||!raw.cardChoices.length&&!raw.pendingAttack||raw.cardChoices.length>C.drawPerTurn(raw)))throw Error('Choix de cartes sauvegardé invalide.');
 }else for(const id of [...(raw.cardChoices||[]),...raw.players.flatMap(p=>[...(p.cardHand||[]),...(p.pendingCards||[])])])if(!cardById(id,raw))throw Error('Carte inconnue dans la sauvegarde.');
 for(const [k,t]of Object.entries(raw.board))if(!E.terrains[t.type]||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!Array.isArray(t.roads)||(raw.mode==='plateau'&&(!Array.isArray(t.links)||t.links.some(n=>!raw.board[n])||t.key!==k)))throw Error('Plateau invalide.');
 const ids=new Set();for(const p of raw.players){if(!raw.board[p.pos]||ids.has(p.id)||typeof p.id!=='string'||typeof p.name!=='string'||!/^#[0-9a-f]{6}$/i.test(p.color)||!voyages.some(v=>v.id===p.voyage)||!raw.rules.bikes[p.bike]||!Array.isArray(p.items)||p.items.some(i=>!raw.rules.equipment[i])||!Array.isArray(p.visited)||!Array.isArray(p.travel)||!Array.isArray(p.travelHistory)||!Array.isArray(p.log)||!p.stats||!count(p.availableDay)||p.availableDay<1||!['energy','food','money','points'].every(k=>Number.isFinite(p[k])&&p[k]>=0))throw Error('Joueur invalide dans la sauvegarde.');ids.add(p.id);}
 if(raw.phase==='event'&&!raw.event||raw.event&&(raw.phase!=='event'||!['negative','positive','challenge'].includes(raw.event.category)||!raw.event.effect||Object.entries(raw.event.effect).some(([k,v])=>!['energy','food','money','points'].includes(k)||!Number.isFinite(v))))throw Error('Événement sauvegardé invalide.');
 if(raw.mode==='plateau'&&(!Array.isArray(raw.edges)||raw.edges.some(e=>!raw.board[e.a]||!raw.board[e.b])))throw Error('Liaisons invalides.');
 if(raw.mode==='plateau'&&raw.mapVersion<MAP_VERSION){const map=europeBoard(voyages[0].from,voyages[0].to),oldBoard=raw.board,nodes=Object.values(map.board).filter(t=>t.type!=='mer'),scaleX=raw.mapVersion<4?1261/1536:1,scaleY=raw.mapVersion<4?842/1024:1,remap=k=>{const old=oldBoard[k];if(!old)return map.start;if(old.name&&map.board['city-'+old.name])return 'city-'+old.name;return nodes.reduce((best,t)=>Math.hypot(t.x-old.x*scaleX,t.y-old.y*scaleY)<Math.hypot(best.x-old.x*scaleX,best.y-old.y*scaleY)?t:best).key;};for(const p of raw.players){p.pos=remap(p.pos);p.visited=[...new Set(p.visited.map(remap))];p.travel=p.travel.map(remap);p.travelHistory=p.travelHistory.map(h=>({...h,boardKey:remap(h.boardKey)}));}raw.board=map.board;raw.edges=map.edges;raw.mapVersion=MAP_VERSION;}
  raw.cardVersion=raw.cardVersion===3?3:2;raw.cardChoices||=[];for(const p of raw.players){p.cardHand||=[];p.pendingCards||=[];p.turnModifiers||={};p.flat=!!p.flat;p.lastCity=raw.board[p.lastCity]?p.lastCity:(p.visited.findLast(k=>raw.board[k]?.type==='ville')||p.pos);if(raw.cardVersion===3){p.bonusCards||=[];p.pendingEffects||=[];p.journalCities||=[];if(!Number.isInteger(p.cardPlayedTurn))p.cardPlayedTurn=raw.history.some(h=>h.turn===raw.turn&&h.player===p.id&&['card-play','card-bonus','card-attack'].includes(h.kind)&&C.card(h.cardId,raw)?.playTiming==='own_turn')?raw.turn:0;if(!Number.isInteger(p.climatePlayedTurn))p.climatePlayedTurn=raw.history.some(h=>h.turn===raw.turn&&h.player===p.id&&h.kind==='card-attack'&&C.card(h.cardId,raw)?.category==='climatic')?raw.turn:0;}}
 if(raw.mode==='plateau')applyRoads(raw.board);// routes jouables (anciennes sauvegardes : roads vide)
 return raw;
}
export function migrate(old){E.upgradePlateau(old);const v=voyages.find(v=>v.id===old.voyage)||voyages[0];const fresh=createMatch([{name:'Joueur 1',bike:old.bike,voyage:v.id}],old.mode||'tuiles',CLASSIC,old.seed);Object.assign(fresh,{board:old.board,deck:old.deck,hand:old.hand,edges:old.edges||[],mapVersion:old.mapVersion,phase:old.event?'event':old.phase,round:old.turn,turn:old.turn,done:old.done,event:old.event?{...old.event,category:Object.values(old.event.effect).some(v=>v<0)?'negative':'positive',protect:old.event.protect||'',consume:false}:null});const p=player(fresh);for(const k of ['pos','energy','food','money','points','items','visited','steps','cols','cities','discoveries','log','travel','travelHistory','legacyVisitOffset'])if(old[k]!==undefined)p[k]=clone(old[k]);if(!old.travelHistory)p.travelHistory=(old.travel||[]).map(k=>({key:k,boardKey:k,type:old.board[k]?.type,endpoint:old.board[k]?.name===v.from||old.board[k]?.name===v.to})).filter(h=>h.type);p.availableDay=old.turn;p.stats.steps=p.steps;p.completed=!!old.voyageWon;p.voyageWon=!!old.voyageWon;record(fresh,'migration','Ancienne partie solo convertie, ressources conservées.');return fresh;}
