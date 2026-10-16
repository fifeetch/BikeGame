import {events as legacyEvents} from './engine.js';

export const COLORS=['#b74732','#267b91','#6d5699','#a77d1e','#427a4b','#b05181'];
export const CLASSIC={rulesVersion:3,
 name:'Classique',terrain:{plaine:1,moyenne_montagne:2,montagne:3,cote:1,ville:0,camping:1,auberge:1,col:3,decouverte:1},ferryPrice:3,
 distance:5,startEnergy:8,maxEnergy:10,startMoney:10,startFood:3,maxFood:6,salary:2,workDays:1,workCityOnly:true,workEnabled:false,
 budget:{startBonus:5,every:5,amount:5},
 adventure:{landmarks:24,landmarkOdds:{one:50,two:30,three:20},colFirstBonus:0,climberCols:3,climberBonus:3},
 fatigue:{enabled:true,days:3,colExtra:1,maxEnergyPenalty:2},
 // Hors route (mode Plateau) : sans l'objet « item » dans les sacoches, quitter la route limite toute la journée à maxDistance cases.
 offroad:{enabled:true,item:'gps',maxDistance:{gravel:3,randonneur:2}},
 // Météo : forecast=true → météo annoncée (weather.js) et cartes Événement climatiques retirées ; false → cartes météo.
 weather:{forecast:false},
 // Rencontres : enabled=true → plus de cartes Événement ; chaque soir, une rencontre propose un choix (encounters.js).
 encounters:{enabled:false},
 // Mode Immersion : enabled=true → météo annoncée, plus de cartes ; scènes en route et le soir, imprévus qui durent, « Demander » (immersion.js).
 immersion:{enabled:false},
 bikes:{gravel:{name:'Gravel',price:5,capacity:4,mountainDiscount:0,extraDistance:0,extraFood:0},randonneur:{name:'Randonneuse',price:3,capacity:8,mountainDiscount:0,extraDistance:-1,extraFood:0}},
 rest:{bivouac:{name:'Bivouac',price:0,energy:3,days:1,tent:true,cityOnly:false},camping:{name:'Camping',price:1,energy:5,days:1,tent:false,cityOnly:false},hotel:{name:'Hôtel',price:3,energy:10,days:1,tent:false,cityOnly:true}},
 food:{energy:3,stoveBonus:2,price:1,quantity:2,maxPerTurn:1,cityOnly:true,restaurantPrice:1,restaurantEnergy:4},
 cardBalance:{foodEnergy:2,bivouacEnergy:1},
 eventCards:{startingHand:3,handLimit:3,bonusLimit:2,drawPerTurn:2,shuffle:true,categories:{positive:true,negative:true,climatic:true,permanent:true}},
 equipment:{tente:{name:'Tente',price:2,space:2,energyBonus:0},rechaud:{name:'Réchaud',price:1,space:1,energyBonus:0},chambre:{name:'Chambre à air',price:1,space:1,energyBonus:0},kit:{name:'Kit de réparation',price:1,space:1,energyBonus:0},gps:{name:'GPS',price:3,space:1,energyBonus:0},duvet:{name:'Matelas et duvet',price:3,space:2,energyBonus:1},secours:{name:'Trousse de secours',price:2,space:1,energyBonus:0},sacoches:{name:'Sacoches',price:2,space:1,energyBonus:0,foodBonus:3}},
 probabilities:{negative:50,positive:30,challenge:20},eventAfterWork:false,eventAfterRest:false,
 points:{plaine:0,moyenne_montagne:0,montagne:0,cote:0,ville:0,camping:2,auberge:2,col:2,decouverte:4,objective:10},
 victory:{mode:'multi',points:35,voyages:3,days:40,turns:20,allObjectives:false},
 events:legacyEvents.map(e=>({...e,id:'legacy-'+e.id,category:Object.values(e.effect).some(v=>v<0)?'negative':'positive',protect:e.id===16?'chambre':e.id===7?'tente':e.protect||'',consume:e.id===16,weight:1})).concat([
 {id:'blessure',title:'Petite chute',text:'Une blessure légère demande des soins.',terrain:'general',category:'negative',weight:1,protect:'secours',consume:false,effect:{energy:-2}},
 {id:'defi-plaine',title:'Étape sportive',text:'Consacre de l’énergie à une échappée, ou garde tes forces.',terrain:'general',category:'challenge',weight:1,protect:'',consume:false,cost:{energy:2,money:0,food:0},effect:{energy:0,money:0,food:0,points:4}},
 {id:'defi-reparation',title:'Dépanner un cycliste',text:'Utilise ton kit ou paie les pièces pour aider un voyageur.',terrain:'general',category:'challenge',weight:1,protect:'kit',consume:false,cost:{energy:0,money:2,food:0},effect:{energy:0,money:0,food:0,points:3}},
 {id:'defi-partage',title:'Partager les provisions',text:'Offre un repas pour gagner des points Aventure.',terrain:'general',category:'challenge',weight:1,protect:'rechaud',consume:false,cost:{energy:0,money:0,food:1},effect:{energy:0,money:0,food:0,points:2}}
 ])
};
export const clone=value=>JSON.parse(JSON.stringify(value));
function merge(base,value){if(Array.isArray(base))return value===undefined?clone(base):clone(value);if(base&&typeof base==='object'){const out={};for(const k of Object.keys(base))out[k]=merge(base[k],value?.[k]);return out;}return value===undefined?base:value;}
// Règles enregistrées sur l'appareil avant le 15 octobre 2026 : on remet à jour les points et la fin de partie décidés par Fi
// (le reste — météo, rencontres, réglages personnels — est gardé).
export const RULES_VERSION=3;
export function upgradeStoredRules(raw){if(!raw||typeof raw!=='object')return raw;if((raw.rulesVersion||1)<RULES_VERSION){const out={...raw},v=raw.rulesVersion||1;if(v<2){delete out.points;delete out.adventure;delete out.victory;}if(v<3)delete out.bikes;out.rulesVersion=RULES_VERSION;return out;}return raw;}
export function validateRules(input){
 const r=merge(CLASSIC,input);
 if(r.bikes?.randonneur?.name==='Randonnée')r.bikes.randonneur.name='Randonneuse';// ancien nom enregistré sur l'appareil
 const walk=(v,path='')=>{for(const [k,n]of Object.entries(v)){const p=path+'.'+k;if(n&&typeof n==='object')walk(n,p);else if(typeof n==='number'&&(!Number.isFinite(n)||Math.abs(n)>100000||(!p.includes('.events.')&&!/\.bikes\.[a-z]+\.extraDistance$/.test(p)&&n<0)))throw Error('Valeur incorrecte : '+p);else if(typeof n!=='number'&&typeof n!=='boolean'&&typeof n!=='string')throw Error('Valeur incorrecte : '+p);}};walk(r);
 const types=(base,v)=>{if(Array.isArray(base)){if(!Array.isArray(v))throw Error('Liste d’événements invalide');return;}for(const k of Object.keys(base)){if(base[k]&&typeof base[k]==='object')types(base[k],v[k]);else if(typeof base[k]!==typeof v[k])throw Error('Type invalide : '+k);}};types(CLASSIC,r);
 if(!Number.isInteger(r.distance)||r.distance<1||r.distance>5||r.startEnergy>r.maxEnergy||r.maxEnergy<1)throw Error('Distance : entier de 1 à 5 ; énergie de départ ≤ maximum.');
 const cards=r.eventCards;
 if(!Number.isInteger(cards.startingHand)||cards.startingHand<0||cards.startingHand>10||!Number.isInteger(cards.handLimit)||cards.handLimit<1||cards.handLimit>10||cards.startingHand>cards.handLimit||!Number.isInteger(cards.bonusLimit)||cards.bonusLimit<0||cards.bonusLimit>10||!Number.isInteger(cards.drawPerTurn)||cards.drawPerTurn<1||cards.drawPerTurn>5)throw Error('Cartes : départ de 0 à 10 (dans la limite de main), main de 1 à 10, bonus de 0 à 10, pioche de fin de tour de 1 à 5.');
 if(!Object.values(cards.categories).some(Boolean))throw Error('Active au moins une catégorie de cartes Événement.');
 if(![r.workDays,...Object.values(r.rest).map(a=>a.days)].every(n=>Number.isInteger(n)&&n>=1&&n<=30))throw Error('Durée des actions : de 1 à 30 jours.');
 if(![r.startFood,r.maxFood,r.food.quantity,r.food.maxPerTurn,...Object.values(r.bikes).flatMap(b=>[b.capacity,b.extraDistance,b.extraFood]),...Object.values(r.equipment).map(e=>e.space)].every(Number.isInteger)||r.maxFood<r.startFood)throw Error('Quantités, capacités et distances : nombres entiers ; capacité nourriture ≥ départ.');
 if(Object.values(r.adventure.landmarkOdds).reduce((a,b)=>a+b,0)!==100||!Number.isInteger(r.adventure.landmarks)||r.adventure.landmarks>60)throw Error('Lieux cachés : de 0 à 60 jetons, chances totalisant 100 %.');
 if(!Number.isInteger(r.budget.every)||r.budget.every<1||!Number.isInteger(r.fatigue.days)||r.fatigue.days<1||r.fatigue.maxEnergyPenalty*r.fatigue.days>=r.maxEnergy)throw Error('Budget : versement tous les 1 jour ou plus ; fatigue : au moins 1 jour, et (pénalité × jours) inférieur à l’énergie maximale.');
 if((r.offroad.item&&!r.equipment[r.offroad.item])||!Object.values(r.offroad.maxDistance).every(n=>Number.isInteger(n)&&n>=1&&n<=5))throw Error('Hors route : objet protecteur connu, et distance maximale hors route entière de 1 à 5 cases.');
 if(Object.values(r.probabilities).reduce((a,b)=>a+b,0)!==100)throw Error('Les probabilités doivent totaliser 100 %.');
 if(r.victory.mode==='multi'){const v=r.victory;for(const k of ['points','voyages','days']){v[k]=Number(v[k]??0);if(!Number.isInteger(v[k])||v[k]<0||v[k]>999)throw Error('Fin de partie : des nombres entiers de 0 à 999 (0 = pas utilisé).');}if(!v.points&&!v.voyages&&!v.days)throw Error('Fin de partie : choisis au moins une condition (points, voyages ou jours).');}
 else if(!['objectives','points','turns'].includes(r.victory.mode)||r.victory.points<1||!Number.isInteger(r.victory.turns)||r.victory.turns<1)throw Error('Condition de victoire incorrecte.');
 const ids=new Set();for(const e of r.events){if(!e||typeof e.id!=='string'||ids.has(e.id)||typeof e.title!=='string'||typeof e.text!=='string'||!['negative','positive','challenge'].includes(e.category)||!['general',...Object.keys(r.terrain)].includes(e.terrain)||!Number.isFinite(e.weight)||e.weight<0||typeof e.consume!=='boolean'||typeof e.protect!=='string'||(e.protect&&!r.equipment[e.protect])||!e.effect||typeof e.effect!=='object'||Array.isArray(e.effect)||e.cost&&(typeof e.cost!=='object'||Array.isArray(e.cost)))throw Error('Événement invalide.');ids.add(e.id);for(const effects of [e.effect,e.cost||{}])for(const [k,v]of Object.entries(effects))if(!['energy','food','money','points'].includes(k)||typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>100000)throw Error('Effet d’événement invalide.');if(Object.values(e.cost||{}).some(v=>v<0))throw Error('Un coût de défi doit être positif.');}
 for(const category of Object.keys(r.probabilities))if(r.probabilities[category]>0&&!r.events.some(e=>e.category===category&&e.terrain==='general'&&e.weight>0))throw Error('Il faut un événement général actif pour chaque catégorie utilisée.');
 return r;
}
// Énergie maximale du cycliste : réduite quand il est fourbu (fatigue au maximum).
// Mode Immersion : la fatigue va de 0 à 5 et chaque niveau bloque une case en haut de la barre d'énergie (10, 9, 8, 7, 6, 5).
export const IMM_FATIGUE_MAX=5;
const immFatigue=m=>Boolean(m?.immersion&&m.mode==='plateau'&&m.rules.fatigue?.enabled);
export const fatigueMax=m=>immFatigue(m)?IMM_FATIGUE_MAX:m.rules.fatigue?.days||0;
export const isExhausted=(m,p)=>Boolean(m.rules.fatigue?.enabled&&(p.fatigue||0)>=fatigueMax(m));
// Mode original et en ligne (règle de Fi, 16 octobre) : chaque niveau de fatigue enlève maxEnergyPenalty (2) à l'énergie maximale : 1 → −2, 2 → −4, 3 (fourbu) → −6.
export const energyCap=(m,p)=>immFatigue(m)?m.rules.maxEnergy-Math.min(IMM_FATIGUE_MAX,p.fatigue||0):Math.max(1,m.rules.maxEnergy-(m.rules.fatigue?.enabled?m.rules.fatigue.maxEnergyPenalty*Math.min(m.rules.fatigue.days,p.fatigue||0):0));
export function setPath(object,path,value){const keys=path.split('.');let o=object;for(const k of keys.slice(0,-1))o=o[k];o[keys.at(-1)]=value;}
