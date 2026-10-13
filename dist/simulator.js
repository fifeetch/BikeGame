import * as E from './engine.js';
import {europeBoard,MAP_VERSION} from './europe.js';
import {voyages,progress} from './voyages.js';
import {CLASSIC,COLORS,clone,validateRules} from './rules.js';
import {CARDS,cardById} from './cards.js';

export const player=m=>m.players[m.activeIndex];
export const distance=m=>Math.min(5,m.rules.distance+m.rules.bikes[player(m).bike].extraDistance);
export const inventorySpace=(m,p=player(m))=>p.items.reduce((sum,id)=>sum+(m.rules.equipment[id]?.space||0),0);
export function view(m,p=player(m)){
 const v=voyages.find(v=>v.id===p.voyage),board={};
 for(const [k,t]of Object.entries(m.board))board[k]={...t,id:t.name===v?.from?0:t.id===0?-1:t.id};
 const arrival=Object.values(board).find(t=>t.name===v?.to);
 return {...m,...p,board,arrivalId:arrival?.id,phase:m.phase,done:m.done,turn:m.round,mapVersion:m.mapVersion};
}
export function createMatch(roster,mode='plateau',rules=CLASSIC,seed=Date.now()){
 if(!Array.isArray(roster)||roster.length<1||roster.length>6)throw Error('Choisir de 1 à 6 joueurs.');
 if(!['plateau','tuiles'].includes(mode))throw Error('Mode inconnu.');
 const r=validateRules(rules);for(const p of roster)if(!r.bikes[p.bike]||!voyages.some(v=>v.id===p.voyage))throw Error('Vélo ou objectif inconnu.');
 const base=E.makeGame(roster[0].bike,seed,roster[0].voyage,mode);
 const m={version:2,cardVersion:1,mode,seed:base.seed,board:base.board,edges:base.edges||[],mapVersion:base.mapVersion,deck:base.deck,hand:base.hand,rules:r,players:[],activeIndex:0,round:1,turn:1,phase:mode==='plateau'?'move':'place',moved:0,ate:0,placed:false,event:null,cardChoices:[],turnKind:'travel',done:false,history:[],stats:{turns:0,events:0,categories:{negative:0,positive:0,challenge:0},terrain:{},work:0,rest:0,energySpent:0,moneySpent:0}};
 roster.forEach((entry,i)=>{
  const v=voyages.find(v=>v.id===entry.voyage);let pos;
  if(mode==='plateau')pos='city-'+v.from;
  else{pos=Object.entries(m.board).find(([,t])=>t.name===v.from)?.[0];if(!pos){pos=E.key(i*3,0);m.board[pos]={id:-10-i,key:pos,x:i*3,y:0,name:v.from,type:'ville',roads:[0,1,2,3],rotation:0};let remove=m.deck.findIndex(t=>t.type==='ville'&&!t.name);if(remove<0)remove=m.deck.findIndex(t=>!t.name);if(remove>=0)m.deck.splice(remove,1);}let arrival=[...Object.values(m.board),...m.hand,...m.deck].find(t=>t.name===v.to);if(!arrival){arrival=[...m.deck,...m.hand].find(t=>t.type==='ville'&&!t.name)||[...m.deck,...m.hand].find(t=>!t.name);if(!arrival)throw Error('Pas assez de villes d’arrivée.');arrival.name=v.to;arrival.type='ville';}}
  const items=Array.isArray(entry.items)?[...new Set(entry.items)]:[];if(items.some(id=>!r.equipment[id]))throw Error('Équipement inconnu.');
  const space=items.reduce((n,id)=>n+r.equipment[id].space,0),price=items.reduce((n,id)=>n+r.equipment[id].price,0);
  if(space>r.bikes[entry.bike].capacity||price>r.startMoney)throw Error('Le matériel de départ dépasse le budget ou les emplacements.');
  m.players.push({id:'p'+(i+1),name:String(entry.name||'Joueur '+(i+1)).slice(0,40),color:COLORS[i],bike:entry.bike,voyage:entry.voyage,pos,energy:r.startEnergy,food:r.startFood+r.bikes[entry.bike].extraFood+items.reduce((n,id)=>n+(r.equipment[id].foodBonus||0),0),money:r.startMoney-price,points:0,items,cardHand:[],flat:false,lastCity:pos,visited:[pos],travel:[],travelHistory:[],steps:0,cols:0,cities:1,discoveries:0,completed:false,voyageWon:false,turns:0,availableDay:1,log:[],stats:{steps:0,energySpent:0,work:0,rest:0,events:0}});
 });for(const p of m.players)for(let i=0;i<3;i++)p.cardHand.push(drawCard(m));record(m,'setup','Partie créée : '+roster.length+' joueur(s), 3 cartes chacun.');return m;
}
function record(m,kind,text,extra={}){const p=player(m);m.history.push({turn:m.turn,round:m.round,player:p.id,name:p.name,kind,text,...extra});p.log.unshift(text);p.log=p.log.slice(0,8);}
export function updateRules(m,input){const r=validateRules(input);m.rules=r;record(m,'rules','Règles modifiées : application aux prochaines actions.');return true;}
export function cost(m,t){const p=player(m),discount=['moyenne_montagne','montagne','col'].includes(t.type)?m.rules.bikes[p.bike].mountainDiscount:0;return Math.max(0,m.rules.terrain[t.type]-discount);}
export function ferryOptions(m,from=player(m).pos){return m.mode==='plateau'&&!m.done&&m.phase==='move'?m.edges.filter(e=>e.ferry&&(e.a===from||e.b===from)).map(e=>m.board[e.a===from?e.b:e.a]):[];}
export function moves(m){if(m.done||m.phase!=='move'||m.moved>=distance(m))return [];const out=E.moves(view(m));return m.mode==='plateau'?out.filter(t=>!m.edges.some(e=>e.ferry&&((e.a===player(m).pos&&e.b===t.key)||(e.b===player(m).pos&&e.a===t.key)))):out;}
export function routeCheck(m,route){if(!Array.isArray(route)||!route.length||m.done||m.phase!=='move'||route.length>distance(m)-m.moved)return {ok:false,reason:'Limite de 5 cases ou journée indisponible.'};let pos=player(m).pos,energy=player(m).energy;for(const key of route){const t=m.board[key];if(!t||key===pos)return {ok:false,reason:'Les cases doivent se suivre.'};const near=m.mode==='plateau'?m.board[pos].links.includes(key)&&!m.edges.some(e=>e.ferry&&((e.a===pos&&e.b===key)||(e.b===pos&&e.a===key))):E.moves({...view(m),pos}).some(n=>E.key(n.x,n.y)===key);if(!near)return {ok:false,reason:'Choisis des cases voisines ; les bateaux se prennent séparément.'};energy-=cost(m,t);if(energy<0)return {ok:false,reason:'Énergie insuffisante pour ce parcours.'};pos=key;}return {ok:true,energyUsed:player(m).energy-energy};}
export function executeRoute(m,route){const check=routeCheck(m,route);if(!check.ok)return false;for(const key of route)if(!move(m,key))throw Error('Parcours devenu invalide.');return true;}
export function place(m,index,x,y){if(m.mode!=='tuiles'||m.placed||m.done)return false;const v=view(m);if(!E.place(v,index,x,y))return false;m.board=v.board;m.deck=v.deck;m.hand=v.hand;m.phase='move';m.placed=true;record(m,'place','Une tuile '+E.terrains[m.board[E.key(x,y)].type].name+' a été posée.');return true;}
export function rescueHand(m){const v=view(m);if(!E.rescueHand(v))return false;m.hand=v.hand;return true;}
export function move(m,k){const p=player(m),t=m.board[k];if(!moves(m).some(n=>m.mode==='plateau'?n.key===k:E.key(n.x,n.y)===k)||p.energy<cost(m,t))return false;
 const spent=cost(m,t);p.energy-=spent;m.stats.energySpent+=spent;p.stats.energySpent+=spent;p.pos=k;if(t.type==='ville')p.lastCity=k;p.steps++;p.stats.steps++;m.moved++;m.stats.terrain[t.type]=(m.stats.terrain[t.type]||0)+1;
 p.travel.push(k);const v=voyages.find(v=>v.id===p.voyage);p.travelHistory.push({key:k,boardKey:k,type:t.type,endpoint:t.name===v.from||t.name===v.to});
 if(!p.visited.includes(k)){p.visited.push(k);p.points+=m.rules.points[t.type];if(t.type==='col')p.cols++;if(t.type==='ville')p.cities++;if(t.type==='decouverte')p.discoveries++;}
 if(!p.completed&&t.name===v.to&&progress(view(m)).ready){p.completed=true;p.voyageWon=true;p.points+=m.rules.points.objective;record(m,'objective','Objectif accompli : '+v.title);}
 record(m,'move','Déplacement : '+(t.name||E.terrains[t.type].name)+' (−'+spent+' énergie).',{terrain:t.type,energy:spent});return true;
}
export function eat(m){const p=player(m);if(m.done||!['move','place'].includes(m.phase)||m.ate>=m.rules.food.maxPerTurn||p.food<1||p.energy>=m.rules.maxEnergy||(!p.items.includes('rechaud')&&!['ville','auberge'].includes(m.board[p.pos].type)))return false;p.food--;m.ate++;p.energy=Math.min(m.rules.maxEnergy,p.energy+m.rules.food.energy+(p.items.includes('rechaud')?m.rules.food.stoveBonus:0));record(m,'food','Un repas a été consommé.');return true;}
export function buyFood(m){const p=player(m),r=m.rules.food;if(m.done||!['move','place'].includes(m.phase)||(r.cityOnly&&m.board[p.pos].type!=='ville')||p.money<r.price)return false;p.money-=r.price;p.food+=r.quantity;m.stats.moneySpent+=r.price;record(m,'buy','Achat de '+r.quantity+' provisions.');return true;}
export function restaurant(m){const p=player(m),r=m.rules.food;if(m.done||!['move','place'].includes(m.phase)||m.board[p.pos].type!=='ville'||p.money<r.restaurantPrice||p.energy>=m.rules.maxEnergy||m.ate>=r.maxPerTurn)return false;p.money-=r.restaurantPrice;m.stats.moneySpent+=r.restaurantPrice;m.ate++;p.energy=Math.min(m.rules.maxEnergy,p.energy+r.restaurantEnergy);record(m,'food','Repas au restaurant.');return true;}
export function buy(m,id){const p=player(m),e=m.rules.equipment[id];if(!e||m.done||!['move','place'].includes(m.phase)||m.board[p.pos].type!=='ville'||p.items.includes(id)||p.money<e.price||inventorySpace(m)+e.space>m.rules.bikes[p.bike].capacity)return false;p.money-=e.price;p.items.push(id);p.food+=e.foodBonus||0;m.stats.moneySpent+=e.price;record(m,'buy','Équipement acheté : '+e.name);return true;}
export function discard(m,id){const p=player(m);if(m.done||!['move','place'].includes(m.phase)||!p.items.includes(id))return false;p.items=p.items.filter(i=>i!==id);record(m,'equipment','Équipement déposé : '+m.rules.equipment[id].name);return true;}
export function work(m){const p=player(m);if(m.done||!['move','place'].includes(m.phase)||m.moved||m.placed||(m.rules.workCityOnly&&m.board[p.pos].type!=='ville'))return false;p.money+=m.rules.salary;p.stats.work++;m.stats.work++;m.turnKind='work';m.actionDays=m.rules.workDays;record(m,'work','Travail : +'+m.rules.salary+' pièces, '+m.actionDays+' jour(s) sans déplacement.');endTurn(m);return true;}
export function rest(m,id){const p=player(m),r=m.rules.rest[id];if(!r||m.done||!['move','place'].includes(m.phase)||m.moved||m.placed||p.money<r.price||(r.tent&&!p.items.includes('tente'))||(r.cityOnly&&m.board[p.pos].type!=='ville'))return false;p.money-=r.price;m.stats.moneySpent+=r.price;const bonus=p.items.reduce((n,i)=>n+(m.rules.equipment[i]?.energyBonus||0),0);p.energy=Math.min(m.rules.maxEnergy,p.energy+r.energy+bonus);p.stats.rest++;m.stats.rest++;m.turnKind='rest';m.actionDays=r.days;record(m,'rest',r.name+' : récupération, '+r.days+' jour(s) sans déplacement.');endTurn(m);return true;}
function random(m){return E.random(m);}
function weighted(m,list){let n=random(m)*list.reduce((s,e)=>s+e.weight,0);return list.find(e=>(n-=e.weight)<0)||list.at(-1);}
export function drawEvent(m){let n=random(m)*100,category='challenge';for(const [k,value]of Object.entries(m.rules.probabilities)){n-=value;if(n<0){category=k;break;}}
 const type=m.board[player(m).pos].type,terrain=['col'].includes(type)?'montagne':['camping','auberge','decouverte'].includes(type)?'plaine':type;
 const pool=m.rules.events.filter(e=>e.category===category&&e.weight>0&&(e.terrain===terrain||e.terrain==='general'));
 return clone(weighted(m,pool));
}
export function drawCard(m){const pool=m.players.length>1?CARDS:CARDS.filter(c=>c.target==='self');let n=E.random(m)*pool.reduce((sum,c)=>sum+c.weight,0);return (pool.find(c=>(n-=c.weight)<0)||pool.at(-1)).id;}
export function endTurn(m){if(m.done||!['move','place'].includes(m.phase))return false;
 record(m,'end','Fin du tour sur '+(m.board[player(m).pos].name||E.terrains[m.board[player(m).pos].type].name)+'.',{distance:m.moved,action:m.turnKind});
 m.cardChoices=[drawCard(m),drawCard(m)];m.phase='card-choice';record(m,'draw','Deux cartes de jeu piochées : en garder une.');return true;
}
export function chooseCard(m,index){if(m.phase!=='card-choice'||![0,1].includes(index)||m.cardChoices.length!==2)return false;const kept=m.cardChoices[index],discarded=m.cardChoices[1-index];player(m).cardHand.push(kept);record(m,'card','Carte gardée : '+cardById(kept).title+' ; '+cardById(discarded).title+' défaussée.');m.cardChoices=[];advance(m);return true;}
export function playCard(m,index,targetId){if(m.done||!['move','place'].includes(m.phase))return false;const p=player(m),id=p.cardHand[index],card=cardById(id);if(!card)return false;const target=card.target==='self'?p:m.players.find(other=>other.id===targetId&&other.id!==p.id);if(!target)return false;if(card.id==='crevaison'){if(target.flat)return false;target.flat=true;}else for(const [key,value] of Object.entries(card.effect||{}))target[key]=Math.max(0,key==='energy'?Math.min(m.rules.maxEnergy,target[key]+value):target[key]+value);p.cardHand.splice(index,1);record(m,'card',card.title+' jouée sur '+target.name+'.');return true;}
export function repairPuncture(m){const p=player(m);if(m.phase!=='puncture'||!p.flat)return false;if(p.items.includes('kit')){p.flat=false;record(m,'repair','Crevaison réparée avec le kit : la journée peut continuer.');m.phase=m.mode==='tuiles'&&m.hand.length?'place':'move';return true;}p.flat=false;p.pos=p.lastCity&&m.board[p.lastCity]?p.lastCity:p.pos;record(m,'repair','Pas de kit : retour à la dernière ville et journée perdue.');m.phase='move';m.turnKind='repair';endTurn(m);return true;}
export function travelFerry(m,destination){const p=player(m),t=ferryOptions(m).find(t=>t.key===destination),fare=m.rules.ferryPrice;if(!t||p.money<fare)return false;p.money-=fare;m.stats.moneySpent+=fare;p.pos=t.key;if(t.type==='ville')p.lastCity=t.key;p.travel.push(t.key);const v=voyages.find(v=>v.id===p.voyage);p.travelHistory.push({key:t.key,boardKey:t.key,type:t.type,endpoint:t.name===v.from||t.name===v.to});if(!p.visited.includes(t.key)){p.visited.push(t.key);p.points+=m.rules.points[t.type];}if(!p.completed&&t.name===v.to&&progress(view(m)).ready){p.completed=true;p.voyageWon=true;p.points+=m.rules.points.objective;record(m,'objective','Objectif accompli : '+v.title);}m.turnKind='ferry';record(m,'ferry','Bateau vers '+(t.name||t.key)+' : −'+fare+' pièces, journée terminée.');endTurn(m);return true;}
export function canChallenge(m){const p=player(m),e=m.event;if(!e||e.category!=='challenge')return false;if(e.protect&&p.items.includes(e.protect))return true;return Object.entries(e.cost||{}).every(([k,v])=>p[k]>=v);}
export function resolve(m,choice='accept'){
 const p=player(m),e=m.event;if(m.phase!=='event'||!e)return false;
 if(e.category==='challenge'&&!['accept','decline'].includes(choice))return false;
 const accepted=e.category!=='challenge'||choice==='accept';if(accepted&&e.category==='challenge'&&!canChallenge(m))return false;
 const protectors=e.id==='legacy-16'&&e.protect==='chambre'?['chambre','kit']:[e.protect];const protection=protectors.find(id=>id&&p.items.includes(id));
 if(accepted){if(e.category==='challenge'){if(!protection)for(const [k,v]of Object.entries(e.cost||{}))p[k]-=v;applyEffect(m,e.effect);}else if(!(e.category==='negative'&&protection))applyEffect(m,e.effect);if(protection&&e.consume&&!(e.id==='legacy-16'&&e.protect==='chambre'&&protection==='kit'))p.items=p.items.filter(id=>id!==protection);}
 record(m,'resolve',accepted?'Carte résolue : '+e.title+(protection?' (équipement utilisé).':'.'):'Défi refusé : '+e.title);m.event=null;advance(m);return true;
}
function applyEffect(m,effect){const p=player(m);for(const [k,v]of Object.entries(effect))p[k]=Math.max(0,k==='energy'?Math.min(m.rules.maxEnergy,p[k]+v):p[k]+v);}
function advance(m){player(m).turns++;m.stats.turns++;const r=m.rules.victory;
 const win=r.mode==='objectives'&&(r.allObjectives?m.players.every(p=>p.completed):m.players.some(p=>p.completed))||r.mode==='points'&&m.players.some(p=>p.points>=r.points);
 if(win){m.done=true;m.phase='finished';record(m,'finish','Condition de victoire atteinte.');return;}
 player(m).availableDay=(player(m).availableDay||m.round)+(m.actionDays||1);
 const nextDay=Math.min(...m.players.map(p=>p.availableDay));let next=m.activeIndex;
 for(let offset=1;offset<=m.players.length;offset++){const i=(m.activeIndex+offset)%m.players.length;if(m.players[i].availableDay===nextDay){next=i;break;}}
 m.activeIndex=next;m.round=nextDay;m.turn++;m.moved=0;m.ate=0;m.placed=false;m.turnKind='travel';m.actionDays=1;
 if(r.mode==='turns'&&m.round>r.turns){m.done=true;m.phase='finished';record(m,'finish','Nombre de manches atteint.');return;}
 m.phase=player(m).flat?'puncture':m.mode==='tuiles'&&m.hand.length?'place':'move';
}
export const ranking=m=>[...m.players].sort((a,b)=>b.points-a.points||Number(b.completed)-Number(a.completed));
export function serialize(m){return JSON.stringify(m);}
export function load(text){
 const raw=JSON.parse(text);if(raw?.version===1)return migrate(raw);
 const count=n=>Number.isInteger(n)&&n>=0;
 if(raw?.version!==2||!Array.isArray(raw.players)||raw.players.length<1||raw.players.length>6||!raw.board||!count(raw.activeIndex)||!raw.players[raw.activeIndex]||!['plateau','tuiles'].includes(raw.mode)||!['move','place','event','card-choice','puncture','finished'].includes(raw.phase)||!count(raw.round)||raw.round<1||!count(raw.turn)||!count(raw.moved)||raw.moved>5||!Array.isArray(raw.history)||!Array.isArray(raw.deck)||!Array.isArray(raw.hand)||!raw.stats||!raw.stats.categories||!raw.stats.terrain)throw Error('Sauvegarde invalide.');
 raw.rules=validateRules(raw.rules);
 for(const [k,t]of Object.entries(raw.board))if(!E.terrains[t.type]||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!Array.isArray(t.roads)||(raw.mode==='plateau'&&(!Array.isArray(t.links)||t.links.some(n=>!raw.board[n])||t.key!==k)))throw Error('Plateau invalide.');
 const ids=new Set();for(const p of raw.players){if(!raw.board[p.pos]||ids.has(p.id)||typeof p.id!=='string'||typeof p.name!=='string'||!/^#[0-9a-f]{6}$/i.test(p.color)||!voyages.some(v=>v.id===p.voyage)||!raw.rules.bikes[p.bike]||!Array.isArray(p.items)||p.items.some(i=>!raw.rules.equipment[i])||!Array.isArray(p.visited)||!Array.isArray(p.travel)||!Array.isArray(p.travelHistory)||!Array.isArray(p.log)||!p.stats||!count(p.availableDay)||p.availableDay<1||!['energy','food','money','points'].every(k=>Number.isFinite(p[k])&&p[k]>=0))throw Error('Joueur invalide dans la sauvegarde.');ids.add(p.id);}
 if(raw.phase==='event'&&!raw.event||raw.event&&(raw.phase!=='event'||!['negative','positive','challenge'].includes(raw.event.category)||!raw.event.effect||Object.entries(raw.event.effect).some(([k,v])=>!['energy','food','money','points'].includes(k)||!Number.isFinite(v))))throw Error('Événement sauvegardé invalide.');
 if(raw.mode==='plateau'&&(!Array.isArray(raw.edges)||raw.edges.some(e=>!raw.board[e.a]||!raw.board[e.b])))throw Error('Liaisons invalides.');
 if(raw.mode==='plateau'&&raw.mapVersion<MAP_VERSION){const map=europeBoard(voyages[0].from,voyages[0].to),oldBoard=raw.board,nodes=Object.values(map.board),scaleX=raw.mapVersion<4?1261/1536:1,scaleY=raw.mapVersion<4?842/1024:1,remap=k=>{const old=oldBoard[k];if(!old)return map.start;if(old.name&&map.board['city-'+old.name])return 'city-'+old.name;return nodes.reduce((best,t)=>Math.hypot(t.x-old.x*scaleX,t.y-old.y*scaleY)<Math.hypot(best.x-old.x*scaleX,best.y-old.y*scaleY)?t:best).key;};for(const p of raw.players){p.pos=remap(p.pos);p.visited=[...new Set(p.visited.map(remap))];p.travel=p.travel.map(remap);p.travelHistory=p.travelHistory.map(h=>({...h,boardKey:remap(h.boardKey)}));}raw.board=map.board;raw.edges=map.edges;raw.mapVersion=MAP_VERSION;}
 raw.cardVersion=1;raw.cardChoices||=[];for(const p of raw.players){p.cardHand||=[];p.flat=!!p.flat;p.lastCity=raw.board[p.lastCity]?p.lastCity:(p.visited.findLast(k=>raw.board[k]?.type==='ville')||p.pos);}
 return raw;
}
export function migrate(old){E.upgradePlateau(old);const v=voyages.find(v=>v.id===old.voyage)||voyages[0];const fresh=createMatch([{name:'Joueur 1',bike:old.bike,voyage:v.id}],old.mode||'tuiles',CLASSIC,old.seed);Object.assign(fresh,{board:old.board,deck:old.deck,hand:old.hand,edges:old.edges||[],mapVersion:old.mapVersion,phase:old.event?'event':old.phase,round:old.turn,turn:old.turn,done:old.done,event:old.event?{...old.event,category:Object.values(old.event.effect).some(v=>v<0)?'negative':'positive',protect:old.event.protect||'',consume:false}:null});const p=player(fresh);for(const k of ['pos','energy','food','money','points','items','visited','steps','cols','cities','discoveries','log','travel','travelHistory','legacyVisitOffset'])if(old[k]!==undefined)p[k]=clone(old[k]);if(!old.travelHistory)p.travelHistory=(old.travel||[]).map(k=>({key:k,boardKey:k,type:old.board[k]?.type,endpoint:old.board[k]?.name===v.from||old.board[k]?.name===v.to})).filter(h=>h.type);p.availableDay=old.turn;p.stats.steps=p.steps;p.completed=!!old.voyageWon;p.voyageWon=!!old.voyageWon;record(fresh,'migration','Ancienne partie solo convertie, ressources conservées.');return fresh;}
