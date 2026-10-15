import {random} from './engine.js';
import {energyCap} from './rules.js';
import {EVENT_CARDS,eventCardById} from './event-cards.js';

export const HAND_LIMIT=3;
export const BONUS_LIMIT=2;
export const handLimit=m=>m.rules.eventCards?.handLimit??HAND_LIMIT;
export const bonusLimit=m=>m.rules.eventCards?.bonusLimit??BONUS_LIMIT;
export const drawPerTurn=m=>m.rules.eventCards?.drawPerTurn??2;
// Avec la météo annoncée, les cartes climatiques sont retirées de la pioche.
export const enabledCardIds=rules=>rules.encounters?.enabled?[]:EVENT_CARDS.filter(c=>rules.eventCards?.categories?.[c.category]!==false&&!(rules.weather?.forecast&&c.category==='climatic')).map(c=>c.id);
export const isEventGame=m=>m?.cardVersion===3;
export const card=(id,m)=>eventCardById(id,m);
export const hasBonus=(p,id)=>p.bonusCards?.includes(id)||false;
const bonusForEffect=(m,p,type)=>p.bonusCards?.map(id=>card(id,m)).find(c=>c?.effectType===type);
export const hasBonusEffect=(m,p,type)=>!!bonusForEffect(m,p,type);
export const foodCapacity=(m,p)=>Math.max(m.rules.maxFood,m.rules.startFood+(m.rules.bikes[p.bike]?.extraFood||0)+p.items.reduce((n,id)=>n+(m.rules.equipment[id]?.foodBonus||0),0))+(hasBonusEffect(m,p,'food_capacity')?3:0);
export function note(m,actor,text,kind='card',extra={}){
 m.history.push({turn:m.turn,round:m.round,player:actor.id,name:actor.name,kind,text,...extra});
 actor.log.unshift(text);actor.log=actor.log.slice(0,8);
}
export function discard(m,id){if(id)m.eventDiscard.push(id);}
function shuffle(m,ids){const out=[...ids];for(let i=out.length-1;i>0;i--){const j=Math.floor(random(m)*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function draw(m){if(!m.eventDeck.length&&m.eventDiscard.length){m.eventDeck=m.rules.eventCards?.shuffle===false?[...m.eventDiscard]:shuffle(m,m.eventDiscard);m.eventDiscard=[];}return m.eventDeck.pop()||null;}
export function setup(m){m.eventCardIds=enabledCardIds(m.rules);const starting=m.eventCardIds.length?m.rules.eventCards?.startingHand??3:0;// mode Rencontres : aucune carte
 if(starting*m.players.length>m.eventCardIds.length)throw Error('La pioche ne contient pas assez de cartes pour la distribution de départ.');
 m.eventDeck=m.rules.eventCards?.shuffle===false?[...m.eventCardIds].reverse():shuffle(m,m.eventCardIds);m.eventDiscard=[];m.cardChoices=[];m.cardWindow=null;m.pendingAttack=null;m.soloEventQueue=[];
 for(const p of m.players){p.bonusCards=[];p.pendingEffects=[];p.journalCities=[];p.cardHand=[];p.freeSteps=0;p.freeGeneralSteps=0;p.freeRoadSteps=0;p.bonusDistanceUsed=0;p.cardPlayedTurn=0;p.climatePlayedTurn=0;p.negativePlayedTurn=0;p.warmTurn=0;p.lightTurn=0;for(let i=0;i<starting;i++){const id=draw(m);if(id)p.cardHand.push(id);}}
 if(m.players.length===1){m.players[0].cardHand=extractSoloEvents(m,m.players[0].cardHand);nextSoloEvent(m);}
}
function extractSoloEvents(m,ids){return ids.filter(id=>{if(['negative','climatic'].includes(card(id,m)?.category)){m.soloEventQueue.push(id);return false;}return true;});}
function nextSoloEvent(m){if(m.players.length!==1||m.pendingAttack||!m.soloEventQueue?.length)return;const id=m.soloEventQueue.shift(),p=m.players[0];m.pendingAttack={cardId:id,actorId:p.id,targetId:p.id,solo:true};note(m,p,`${p.name} pioche un événement solo : ${card(id,m).name}.`,'card-solo',{cardId:id});}
export function drawChoices(m){m.cardChoices=Array.from({length:drawPerTurn(m)},()=>draw(m)).filter(Boolean);m.phase='card-choice';if(m.players.length===1){m.cardChoices=extractSoloEvents(m,m.cardChoices);nextSoloEvent(m);}return m.cardChoices;}
export function keepChoice(m,index){if(m.pendingAttack||m.phase!=='card-choice'||!m.cardChoices[index])return false;
 const p=m.players[m.activeIndex],kept=m.cardChoices[index];p.cardHand.push(kept);
 m.cardChoices.forEach((id,i)=>{if(i!==index)discard(m,id);});m.cardChoices=[];
 note(m,p,`${p.name} garde ${card(kept,m)?.name||kept}.`);
 if(p.cardHand.length>handLimit(m))m.phase='card-discard';return true;
}
export function discardHand(m,index){const p=m.players[m.activeIndex];if(m.phase!=='card-discard'||!p.cardHand[index])return false;
 const [id]=p.cardHand.splice(index,1);discard(m,id);note(m,p,`${p.name} défausse ${card(id,m)?.name||id}.`);return true;
}
export function removeBonus(m,p,index){if(!Number.isInteger(index)||index<0||index>=p.bonusCards.length)return false;
 const [id]=p.bonusCards.splice(index,1);discard(m,id);
 if(card(id,m)?.effectType==='food_capacity')p.food=Math.min(p.food,foodCapacity(m,p));
 if(card(id,m)?.effectType==='travel_journal'&&!hasBonusEffect(m,p,'travel_journal'))p.journalCities=[];
 note(m,p,`${p.name} perd ${card(id,m)?.name||id}.`);return true;
}
export function climateEligible(m,id,route=m.cardWindow?.route){const c=card(id,m);if(!c||c.category!=='climatic')return false;
 if(!route?.length)return ['heatwave','freezing_cold'].includes(c.effectType);
 if(c.terrainCondition==='cote')return route.some(k=>m.board[k]?.type==='cote');
 if(c.terrainCondition==='sans_route')return route.some(k=>!m.board[k]?.roads?.length);
 if(c.terrainCondition)return route.some(k=>c.terrainCondition.split('|').includes(m.board[k]?.type));
 return true;
}
export function beginRouteWindow(m,route){if(!Array.isArray(route)||!route.length||m.phase!=='move'||m.cardWindow||m.pendingAttack)return false;
 m.cardWindow={route:[...route],responders:m.players.filter((_,i)=>i!==m.activeIndex).map(p=>p.id),responderIndex:0,climateUsed:false,weather:null};
 m.phase='card-intervention';return true;
}
export function currentResponder(m){return m.cardWindow?.responders[m.cardWindow.responderIndex]||null;}
export function passIntervention(m){if(m.phase!=='card-intervention'||!m.cardWindow||m.pendingAttack)return false;m.cardWindow.responderIndex++;return true;}
export function beginAttack(m,actorId,index,targetId){const actor=m.players.find(p=>p.id===actorId),target=m.players.find(p=>p.id===targetId),c=card(actor?.cardHand[index],m);
 if(!actor||!target||actor===target||!c||m.pendingAttack||m.done||!['negative','climatic'].includes(c.category))return false;
 if(c.category==='negative'&&(actor!==m.players[m.activeIndex]||!['move','place'].includes(m.phase)||actor.cardPlayedTurn===m.turn||actor.negativePlayedTurn===m.turn))return false;
 if(c.category==='climatic'){
  if(target!==m.players[m.activeIndex]||actor===target||actor.climatePlayedTurn===m.turn||!['move','place','card-intervention'].includes(m.phase)||!climateEligible(m,c.id))return false;
  if(m.phase==='card-intervention'&&(currentResponder(m)!==actor.id||m.cardWindow.climateUsed))return false;
 }
 actor.cardHand.splice(index,1);if(c.category==='negative'){actor.cardPlayedTurn=m.turn;actor.negativePlayedTurn=m.turn;}if(c.category==='climatic')actor.climatePlayedTurn=m.turn;
 if(c.category==='climatic'&&m.cardWindow)m.cardWindow.climateUsed=true;
 m.pendingAttack={cardId:c.id,actorId,targetId};note(m,actor,`${actor.name} joue ${c.name} contre ${target.name}.`,'card-attack',{cardId:c.id,targetId});return true;
}
export function defend(m){const a=m.pendingAttack;if(!a)return false;const p=m.players.find(q=>q.id===a.targetId),i=p.cardHand.findIndex(id=>card(id,m)?.effectType==='cancel_attack');if(i<0)return false;
 const [id]=p.cardHand.splice(i,1);discard(m,id);discard(m,a.cardId);note(m,p,`${p.name} utilise ${card(id,m)?.name||'une défense'} : attaque annulée.`,'card-defense');m.pendingAttack=null;nextSoloEvent(m);return true;
}
function loseEnergy(p,n){p.energy=Math.max(0,p.energy-n);}
export function resolveAttack(m,choice={}){const a=m.pendingAttack;if(!a)return false;const c=card(a.cardId,m),p=m.players.find(q=>q.id===a.targetId),actor=m.players.find(q=>q.id===a.actorId);if(!c||!p||!actor)return false;
 if(['fall','damage_bonus'].includes(c.effectType)&&p.bonusCards.length&&(!Number.isInteger(choice.bonusIndex)||choice.bonusIndex<0||choice.bonusIndex>=p.bonusCards.length))return false;
 if(c.effectType==='freezing_cold'&&p.food>0&&!['food','energy'].includes(choice.resource))return false;
 let protectedBy='';if(c.effectType==='puncture')protectedBy=bonusForEffect(m,p,'puncture_immunity')?.name||'';
 if(c.effectType==='mechanical')protectedBy=bonusForEffect(m,p,'mechanical_immunity')?.name||'';
 if(['wrong_turn','road_closed'].includes(c.effectType))protectedBy=bonusForEffect(m,p,'gps_immunity')?.name||'';
 let deferred=false;if(!protectedBy){switch(c.effectType){
  case 'puncture':case 'food_poisoning':case 'heatwave':loseEnergy(p,c.effectValue);break;
  case 'mechanical':p.pendingEffects.push({cardId:c.id,kind:'skip_move'});deferred=true;break;
  case 'headwind_next':p.pendingEffects.push({cardId:c.id,kind:'extra_energy',value:2});deferred=true;break;
  case 'storm_next':loseEnergy(p,1);p.pendingEffects.push({cardId:c.id,kind:'skip_move'});deferred=true;break;
  case 'wrong_turn':p.pendingEffects.push({cardId:c.id,kind:'short_move',value:2});deferred=true;break;
  case 'road_closed':p.pendingEffects.push({cardId:c.id,kind:'road_closed'});deferred=true;break;
  case 'fall':loseEnergy(p,2);if(p.bonusCards.length)removeBonus(m,p,choice.bonusIndex);break;
  case 'torn_bag':if(p.food)p.food--;else loseEnergy(p,1);break;
  case 'damage_bonus':if(p.bonusCards.length)removeBonus(m,p,choice.bonusIndex);else loseEnergy(p,1);break;
  case 'freezing_cold':if(choice.resource==='food'&&p.food)p.food--;else loseEnergy(p,2);break;
  case 'headwind_now':if(a.solo){p.pendingEffects.push({cardId:c.id,kind:'solo_weather'});deferred=true;}else m.cardWindow.weather={kind:'extra_energy',value:2};break;
  case 'storm_now':case 'fog':case 'crosswind':case 'mountain_snow':case 'heavy_rain':case 'morning_frost':case 'coastal_storm':
   if(a.solo){p.pendingEffects.push({cardId:c.id,kind:'solo_weather'});deferred=true;}else m.cardWindow.weather=weatherFor(c);break;
 }}
 if(a.solo&&['move','place'].includes(m.phase))for(const effect of [...p.pendingEffects])if(['skip_move','short_move'].includes(effect.kind)){if(effect.kind==='skip_move')p.turnModifiers.skipMove=true;else p.turnModifiers.distancePenalty=(p.turnModifiers.distancePenalty||0)+effect.value;discard(m,effect.cardId);p.pendingEffects.splice(p.pendingEffects.indexOf(effect),1);}
 if(!deferred)discard(m,c.id);note(m,p,protectedBy?`${p.name} est protégé par ${protectedBy}.`:`${p.name} subit ${c.name} : ${c.effectText}`,'card-result',{cardId:c.id});m.pendingAttack=null;nextSoloEvent(m);return true;
}
export function weatherFor(c){return {kind:({headwind_now:'extra_energy',storm_now:'stop',fog:'short_move',crosswind:'short_move',morning_frost:'frost'}[c.effectType]||c.effectType),value:c.effectValue};}
export function playOwnCard(m,index,replaceIndex){const p=m.players[m.activeIndex],c=card(p.cardHand[index],m);if(!c||m.done||!['move','place'].includes(m.phase)||!['positive','permanent'].includes(c.category))return false;
 if(m.pendingAttack||p.cardPlayedTurn===m.turn)return false;
 if(c.effectType==='cancel_attack')return false;
 const limit=bonusLimit(m);if(c.category==='permanent'&&(!limit||p.bonusCards.length>=limit&&(!Number.isInteger(replaceIndex)||replaceIndex<0||replaceIndex>=p.bonusCards.length)))return false;
 if(c.category==='permanent'&&p.bonusCards.length>=limit)removeBonus(m,p,replaceIndex);
 p.cardHand.splice(index,1);
 p.cardPlayedTurn=m.turn;
 if(c.category==='permanent'){p.bonusCards.push(c.id);note(m,p,`${p.name} équipe ${c.name}.`,'card-bonus',{cardId:c.id});return true;}
 switch(c.effectType){
  case 'free_road_steps':p.freeSteps=(p.freeSteps||0)+c.effectValue;p.freeRoadSteps=(p.freeRoadSteps||0)+c.effectValue;break;
  case 'free_steps':p.freeSteps=(p.freeSteps||0)+c.effectValue;p.freeGeneralSteps=(p.freeGeneralSteps||0)+c.effectValue;break;
  case 'gain_food':p.food=Math.min(foodCapacity(m,p),p.food+c.effectValue);break;
  case 'gain_energy':if(/habitant/i.test(c.name||''))p.fatigue=0;p.energy=Math.min(energyCap(m,p),p.energy+c.effectValue);break;
  case 'gain_money':p.money+=c.effectValue;break;
  case 'market':p.food=Math.min(foodCapacity(m,p),p.food+2);p.money++;break;
  case 'gain_points':p.points+=c.effectValue;break;
  case 'terrain_shortcut':p.shortcutActive=true;break;
 }
 discard(m,c.id);note(m,p,`${p.name} joue ${c.name} : ${c.effectText}`,'card-play',{cardId:c.id});return true;
}
export function onCityVisit(m,p,cityKey){const warm=bonusForEffect(m,p,'warmshowers'),journal=bonusForEffect(m,p,'travel_journal');if(warm&&p.warmTurn!==m.turn){p.energy=Math.min(energyCap(m,p),p.energy+1);p.warmTurn=m.turn;note(m,p,`${p.name} récupère 1 énergie grâce à ${warm.name}.`);}
 if(journal&&!p.journalCities.includes(cityKey)){p.journalCities.push(cityKey);if(p.journalCities.length%3===0){p.points+=2;note(m,p,`${p.name} gagne 2 points grâce à ${journal.name}.`);}}
}
export function onTurnEnd(m,p){const solar=bonusForEffect(m,p,'solar');if(solar){const old=p.energy;p.energy=Math.min(energyCap(m,p),p.energy+1);if(p.energy>old)note(m,p,`${p.name} récupère 1 énergie grâce à ${solar.name}.`);}}
