import {random} from './engine.js';
import {EVENT_CARDS,eventCardById} from './event-cards.js';

export const HAND_LIMIT=3;
export const BONUS_LIMIT=2;
export const isEventGame=m=>m?.cardVersion===3;
export const card=id=>eventCardById(id);
export const hasBonus=(p,id)=>p.bonusCards?.includes(id)||false;
export const foodCapacity=(m,p)=>Math.max(m.rules.maxFood,m.rules.startFood+(m.rules.bikes[p.bike]?.extraFood||0)+p.items.reduce((n,id)=>n+(m.rules.equipment[id]?.foodBonus||0),0))+(hasBonus(p,'evt-33')?3:0);
export function note(m,actor,text,kind='card',extra={}){
 m.history.push({turn:m.turn,round:m.round,player:actor.id,name:actor.name,kind,text,...extra});
 actor.log.unshift(text);actor.log=actor.log.slice(0,8);
}
export function discard(m,id){if(id)m.eventDiscard.push(id);}
function shuffle(m,ids){const out=[...ids];for(let i=out.length-1;i>0;i--){const j=Math.floor(random(m)*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function draw(m){if(!m.eventDeck.length&&m.eventDiscard.length){m.eventDeck=shuffle(m,m.eventDiscard);m.eventDiscard=[];}return m.eventDeck.pop()||null;}
export function setup(m){m.eventDeck=shuffle(m,EVENT_CARDS.filter(c=>m.players.length>1||c.targetType==='self').map(c=>c.id));m.eventDiscard=[];m.cardChoices=[];m.cardWindow=null;m.pendingAttack=null;
 for(const p of m.players){p.bonusCards=[];p.pendingEffects=[];p.journalCities=[];p.cardHand=[];p.freeSteps=0;p.freeGeneralSteps=0;p.freeRoadSteps=0;p.bonusDistanceUsed=0;p.cardPlayedTurn=0;p.climatePlayedTurn=0;p.negativePlayedTurn=0;p.warmTurn=0;p.lightTurn=0;for(let i=0;i<HAND_LIMIT;i++){const id=draw(m);if(id)p.cardHand.push(id);}}
}
export function drawChoices(m){m.cardChoices=[draw(m),draw(m)].filter(Boolean);m.phase='card-choice';return m.cardChoices;}
export function keepChoice(m,index){if(m.phase!=='card-choice'||!m.cardChoices[index])return false;
 const p=m.players[m.activeIndex],kept=m.cardChoices[index];p.cardHand.push(kept);
 m.cardChoices.forEach((id,i)=>{if(i!==index)discard(m,id);});m.cardChoices=[];
 note(m,p,`${p.name} garde ${card(kept)?.name||kept}.`);
 if(p.cardHand.length>HAND_LIMIT)m.phase='card-discard';return true;
}
export function discardHand(m,index){const p=m.players[m.activeIndex];if(m.phase!=='card-discard'||!p.cardHand[index])return false;
 const [id]=p.cardHand.splice(index,1);discard(m,id);note(m,p,`${p.name} défausse ${card(id)?.name||id}.`);return true;
}
export function removeBonus(m,p,index){if(!Number.isInteger(index)||index<0||index>=p.bonusCards.length)return false;
 const [id]=p.bonusCards.splice(index,1);discard(m,id);
 if(id==='evt-33')p.food=Math.min(p.food,foodCapacity(m,p));
 if(id==='evt-39')p.journalCities=[];
 note(m,p,`${p.name} perd ${card(id)?.name||id}.`);return true;
}
export function climateEligible(m,id,route=m.cardWindow?.route){const c=card(id);if(!c||c.category!=='climatic')return false;
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
export function beginAttack(m,actorId,index,targetId){const actor=m.players.find(p=>p.id===actorId),target=m.players.find(p=>p.id===targetId),c=card(actor?.cardHand[index]);
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
export function defend(m){const a=m.pendingAttack;if(!a)return false;const p=m.players.find(q=>q.id===a.targetId),i=p.cardHand.indexOf('evt-07');if(i<0)return false;
 discard(m,p.cardHand.splice(i,1)[0]);discard(m,a.cardId);note(m,p,`${p.name} utilise Coup de pouce : attaque annulée.`,'card-defense');m.pendingAttack=null;return true;
}
function loseEnergy(p,n){p.energy=Math.max(0,p.energy-n);}
export function resolveAttack(m,choice={}){const a=m.pendingAttack;if(!a)return false;const c=card(a.cardId),p=m.players.find(q=>q.id===a.targetId),actor=m.players.find(q=>q.id===a.actorId);if(!c||!p||!actor)return false;
 if(['fall','damage_bonus'].includes(c.effectType)&&p.bonusCards.length&&(!Number.isInteger(choice.bonusIndex)||choice.bonusIndex<0||choice.bonusIndex>=p.bonusCards.length))return false;
 if(c.effectType==='freezing_cold'&&p.food>0&&!['food','energy'].includes(choice.resource))return false;
 let protectedBy='';if(c.effectType==='puncture'&&hasBonus(p,'evt-31'))protectedBy='Pneus renforcés';
 if(c.effectType==='mechanical'&&hasBonus(p,'evt-32'))protectedBy='Outils multifonctions';
 if(['wrong_turn','road_closed'].includes(c.effectType)&&hasBonus(p,'evt-35'))protectedBy='GPS de randonnée';
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
  case 'headwind_now':m.cardWindow.weather={kind:'extra_energy',value:2};break;
  case 'storm_now':m.cardWindow.weather={kind:'stop',value:0};break;
  case 'fog':case 'crosswind':m.cardWindow.weather={kind:'short_move',value:2};break;
  case 'mountain_snow':m.cardWindow.weather={kind:'mountain_snow',value:3};break;
  case 'heavy_rain':m.cardWindow.weather={kind:'heavy_rain',value:2};break;
  case 'morning_frost':m.cardWindow.weather={kind:'frost',value:0};break;
  case 'coastal_storm':m.cardWindow.weather={kind:'coastal_storm',value:2};break;
 }}
 if(!deferred)discard(m,c.id);note(m,p,protectedBy?`${p.name} est protégé par ${protectedBy}.`:`${p.name} subit ${c.name} : ${c.effectText}`,'card-result',{cardId:c.id});m.pendingAttack=null;return true;
}
export function playOwnCard(m,index,replaceIndex){const p=m.players[m.activeIndex],c=card(p.cardHand[index]);if(!c||m.done||!['move','place'].includes(m.phase)||!['positive','permanent'].includes(c.category))return false;
 if(p.cardPlayedTurn===m.turn)return false;
 if(c.effectType==='cancel_attack')return false;
 if(c.category==='permanent'&&p.bonusCards.length>=BONUS_LIMIT&&(!Number.isInteger(replaceIndex)||replaceIndex<0||replaceIndex>=BONUS_LIMIT))return false;
 if(c.category==='permanent'&&p.bonusCards.length>=BONUS_LIMIT)removeBonus(m,p,replaceIndex);
 p.cardHand.splice(index,1);
 p.cardPlayedTurn=m.turn;
 if(c.category==='permanent'){p.bonusCards.push(c.id);note(m,p,`${p.name} équipe ${c.name}.`,'card-bonus',{cardId:c.id});return true;}
 switch(c.effectType){
  case 'free_steps':p.freeSteps=(p.freeSteps||0)+c.effectValue;if(c.id==='evt-10')p.freeRoadSteps=(p.freeRoadSteps||0)+c.effectValue;else p.freeGeneralSteps=(p.freeGeneralSteps||0)+c.effectValue;break;
  case 'gain_food':p.food=Math.min(foodCapacity(m,p),p.food+c.effectValue);break;
  case 'gain_energy':p.energy=Math.min(m.rules.maxEnergy,p.energy+c.effectValue);break;
  case 'gain_money':p.money+=c.effectValue;break;
  case 'market':p.food=Math.min(foodCapacity(m,p),p.food+2);p.money++;break;
  case 'gain_points':p.points+=c.effectValue;break;
  case 'terrain_shortcut':p.shortcutActive=true;break;
 }
 discard(m,c.id);note(m,p,`${p.name} joue ${c.name} : ${c.effectText}`,'card-play',{cardId:c.id});return true;
}
export function onCityVisit(m,p,cityKey){if(hasBonus(p,'evt-40')&&p.warmTurn!==m.turn){p.energy=Math.min(m.rules.maxEnergy,p.energy+1);p.warmTurn=m.turn;note(m,p,`${p.name} récupère 1 énergie grâce à Réseau Warmshowers.`);}
 if(hasBonus(p,'evt-39')&&!p.journalCities.includes(cityKey)){p.journalCities.push(cityKey);if(p.journalCities.length%3===0){p.points+=2;note(m,p,`${p.name} gagne 2 points grâce au Carnet de voyage.`);}}
}
export function onTurnEnd(m,p){if(hasBonus(p,'evt-34')){const old=p.energy;p.energy=Math.min(m.rules.maxEnergy,p.energy+1);if(p.energy>old)note(m,p,`${p.name} récupère 1 énergie grâce au Panneau solaire.`);}}
