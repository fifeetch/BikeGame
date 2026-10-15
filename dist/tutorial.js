// Partie guidée « Apprendre à jouer » : une vraie petite partie solo, déjà préparée.
// Gravel avec tente, carte Voyage « Premier voyage : vers la mer Égée » (Budapest → Athènes), 5 jours.
// Le guide montre une chose à la fois et attend que le joueur la fasse.
// Aucune règle du jeu n'est changée : seuls la météo et les cartes Événement sont allumées en cours de route.
import * as S from './simulator.js';
import {CLASSIC,clone,energyCap} from './rules.js';
import {TUTORIAL_VOYAGE} from './voyages.js';

// Graine choisie pour un beau temps sur les Balkans les 5 jours (et sur Budapest le jour 1).
export const TUTORIAL_SEED=1378;
// Le chemin conseillé, jour par jour (cases du plateau Europe standard).
export const TUTORIAL_PLAN={
 1:['hex-18-30','hex-19-31','hex-20-32','city-Belgrade'],
 2:['hex-21-34','hex-22-35','hex-23-36'],
 3:['city-Sofia','hex-25-37','city-Thessalonique'],
 5:['hex-25-39','hex-26-40','hex-27-41','city-Athènes']
};
export const TUTORIAL_MOUNTAIN='hex-25-37';
export const TUTORIAL_LANDMARK='hex-22-35';
export const TUTORIAL_CARD='evt-01';// Vent dans le dos

export function createTutorialMatch(customCards=[],eventEdits=[]){
 const rules=clone(CLASSIC);rules.weather={...(rules.weather||{}),forecast:true};rules.encounters={...(rules.encounters||{}),enabled:false};
 const m=S.createMatch([{name:'Toi',bike:'gravel',voyage:TUTORIAL_VOYAGE.id,items:['tente']}],'plateau',rules,TUTORIAL_SEED,customCards,eventEdits);
 // Cartes et météo coupées au début : on remet la main de départ dans la pioche.
 const p=m.players[0],back=[...p.cardHand,...(m.soloEventQueue||[]),...(m.pendingAttack?[m.pendingAttack.cardId]:[])];
 p.cardHand=[];m.soloEventQueue=[];m.pendingAttack=null;m.eventDeck=[...back,...(m.eventDeck||[])];
 m.history=(m.history||[]).filter(h=>h.kind!=='card-solo');p.log=(p.log||[]).filter(l=>!/événement solo/.test(l));
 m.forecast=false;m.seed=TUTORIAL_SEED;// météo du guide : beau temps sur le trajet
 // Un seul lieu caché, sur le chemin du jour 2.
 if(m.board[TUTORIAL_LANDMARK])m.landmarks={[TUTORIAL_LANDMARK]:{value:2,name:'Vieux pont de pierre',found:''}};
 m.tutorial={step:0,cardsOff:true,active:true};m.mapChoice='';m.mapName='Europe standard';
 return m;
}

export const tutorialOn=m=>Boolean(m?.tutorial?.active);
const me=m=>m.players[0];
const at=(m,name)=>m.board[me(m).pos]?.name===name;
const rolled=(m,day)=>m.round===day&&m.moved>0;

// Chaque étape : où pointe la bulle (sélecteurs CSS, le premier présent gagne, ou « hex: » pour une case),
// le texte, et ce que le guide attend (wait). Sans wait, la bulle a un bouton « Compris ».
export const STEPS=[
 {id:'bienvenue',day:1,center:true,title:'Bienvenue !',text:m=>`Je vais te guider pendant <b>5 jours</b>, de <b>Budapest à Athènes</b>. Je te montre une chose à la fois, et j'attends que tu la fasses.`,next:'C’est parti'},
 {id:'carte',day:1,tab:'voyage',sheet:true,target:['.fiche-voyage','.objective','[data-action="sheet-tab-voyage"]'],title:'Ta carte Voyage',text:m=>`Ton objectif : aller à <b>Athènes</b>. En chemin, passe par <b>3 villes</b>, <b>1 case montagne</b> et <b>3 cases côtières</b>. Les compteurs se cochent tout seuls.<br><small>Voyage réussi : <b>+9 points</b>. Arriver sans tous les objectifs : −40 %.</small>`},
 {id:'chemin',day:1,target:['.map-wrap'],title:'Le chemin conseillé',text:m=>`Les <b>pointillés orange</b> montrent le chemin le plus simple qui remplit tous les objectifs. Tu peux t'en écarter, mais suis-les pour ce premier voyage.`},
 {id:'energie',day:1,target:['.fiche-energy-box','.stats .stat:first-child'],title:'L’énergie',text:m=>`Chaque case coûte de l'énergie : plaine et côte <b>1</b>, moyenne montagne <b>2</b>, montagne <b>3</b>, ville <b>0</b>. Tu en as <b>${me(m).energy}</b> (${energyCap(m,me(m))} au maximum).`},
 {id:'tracer',day:1,plan:1,tab:'journee',target:['hex:next'],title:'Tracer ton étape',text:m=>`Clique la case <b>entourée d'orange</b>, puis la suivante, jusqu'à <b>Belgrade</b> (4 cases). Sur la route, ton Gravel fait jusqu'à 5 cases par jour.`,wait:(m,ui)=>ui.route.at(-1)==='city-Belgrade'||m.moved>0,waiting:'J’attends tes clics…'},
 {id:'rouler',day:1,target:['.dock-main'],title:'Rouler',text:m=>`Le gros bouton orange : <b>Rouler</b>. Il t'indique combien d'énergie l'étape va coûter.`,wait:m=>m.moved>0||m.round>1,waiting:'J’attends que tu roules…'},
 {id:'ville',day:1,tab:'voyage',sheet:true,target:['.fiche-voyage li:first-child','.objective'],title:'Première ville !',text:m=>`Belgrade compte pour ton objectif : <b>1 ville sur 3</b>. Regarde ta carte Voyage.`},
 {id:'manger',day:1,tab:'journee',target:['.dock-icons [data-action="eat"]','[data-action="eat"]'],title:'Manger',text:m=>`Il te reste <b>${me(m).energy} ⚡</b>. Tu es en ville : <b>mange</b> une provision pour regagner de l'énergie. Sans réchaud, on ne mange qu'en ville ou à l'auberge.`,wait:m=>m.ate>0||m.round>1,waiting:'J’attends que tu manges…'},
 {id:'finir',day:1,target:['.modal [data-action="endturn"]','.dock-main'],title:'Finir ta journée',text:m=>`Ta journée est finie : clique <b>« Finir ma journée »</b>. Le jeu te demande si tu veux vraiment t'arrêter alors qu'il reste 1 case : réponds oui, tu dors à Belgrade.`,wait:m=>m.round>1,waiting:'J’attends la fin de ta journée…'},
 {id:'meteo',day:2,target:['.meteo-modal .zone-map','.meteo-modal'],title:'La météo annoncée',text:m=>`À partir de maintenant, la <b>météo</b> compte. Le bulletin annonce le temps <b>zone par zone</b> : ta zone est entourée. La pluie, l'orage, le vent ou la neige peuvent coûter de l'énergie ou raccourcir ta journée. Tu le retrouves à tout moment avec le bouton météo de la carte.`,enter:'meteo'},
 {id:'petitdej',day:2,tab:'journee',sheet:true,target:['.fiche-journee [data-action="eat"]','[data-action="rest-open"]'],button:{label:'Ouvrir ma journée',action:'rest-open'},title:'Un repas avant de partir',text:m=>`Tu es encore en ville : <b>mange avant de partir</b>, ce soir tu seras en pleine campagne. La fiche <b>« Ma journée »</b> regroupe tout : manger, acheter des provisions, dormir.`,wait:m=>m.ate>0||m.moved>0||m.round>2,waiting:'J’attends que tu manges…'},
 {id:'jeton',day:2,target:['hex:'+TUTORIAL_LANDMARK],title:'Un lieu caché « ? »',text:m=>`Ce jeton cache un lieu remarquable. Le premier cycliste qui passe dessus gagne <b>1 à 3 points</b> d'aventure. Il est sur ton chemin !`},
 {id:'tracer2',day:2,plan:2,target:['hex:next','.dock-main'],title:'Hors route',text:m=>`Pas de route directe vers Sofia : tu coupes à travers champs. <b>Hors route et sans GPS, ta journée est limitée à 3 cases.</b> Trace les 3 cases entourées, puis <b>Rouler</b>.`,wait:m=>rolled(m,2)||m.round>2,waiting:'J’attends que tu roules…'},
 {id:'campagne',day:2,target:['.modal [data-action="endturn"]','.dock-main'],title:'Pas de ville ce soir',text:m=>`${me(m).points?`Lieu caché découvert : <b>+${me(m).points} points</b> ! `:''}Tu es en pleine campagne : sans <b>réchaud</b>, tu ne peux pas manger ici. Finis ta journée, tu mangeras demain.`,wait:m=>m.round>2,waiting:'J’attends la fin de ta journée…'},
 {id:'fatigue',day:3,target:['.fiche-energy-box small','.stats .stat:nth-child(2)'],title:'La fatigue',text:m=>`Chaque jour de vélo ajoute <b>1 de fatigue</b> (2 si tu passes un col). Tu en es à <b>${me(m).fatigue||0} sur 3</b>. À 3, tu es <b>fourbu</b> : ton énergie maximale baisse de 2 jusqu'à une vraie nuit.`},
 {id:'montagne',day:3,plan:3,target:['hex:next','.dock-main'],title:'Sofia et la montagne',text:m=>`Aujourd'hui : <b>Sofia</b> (2ᵉ ville), puis la <b>montagne</b> (3 ⚡, ton objectif montagne), puis <b>Thessalonique</b>. Encore hors route : 3 cases, juste ce qu'il faut. Trace-les, puis <b>Rouler</b>.`,wait:m=>rolled(m,3)||m.round>3,waiting:'J’attends que tu roules…'},
 {id:'objectifs',day:3,tab:'journee',target:['.dock-icons [data-action="eat"]','.modal [data-action="endturn"]','.dock-main'],title:'Presque !',text:m=>`Montagne ✓ et <b>3 villes</b> ✓ ! Il ne reste que les <b>3 côtes</b>. Tu es en ville : mange (et rachète des provisions si ton sac est vide), puis finis ta journée.`,wait:m=>m.round>3,waiting:'J’attends la fin de ta journée…'},
 {id:'fourbu',day:4,tab:'journee',sheet:true,target:['[data-action="rest-camping"]','[data-action="rest-open"]'],title:'Fourbu : repos !',text:m=>`Trois jours de vélo : tu es <b>fourbu</b> (énergie maximale ${energyCap(m,me(m))} au lieu de 10). Aujourd'hui, ne roule pas : ouvre <b>« Me reposer »</b> et choisis le <b>camping</b> (1 pièce, +5 ⚡). Il efface la fatigue. Le bivouac sous ta tente, lui, ne l'efface pas.`,wait:m=>m.round>4,waiting:'J’attends que tu te reposes…'},
 {id:'carte-evenement',day:5,tab:'journee',target:['.modal [data-action^="event-play-"]','.dock-icons [data-action="cards"]','[data-action="cards"]'],title:'Une carte Événement',text:m=>`On t'offre une carte : <b>Vent dans le dos</b>, 2 cases gratuites en plaine, sur la côte ou en moyenne montagne. Ouvre tes <b>cartes</b> et clique <b>« Jouer »</b>.<br><small>En partie normale, tu pioches des cartes chaque soir : certaines t'aident, d'autres te gênent.</small>`,enter:'card',wait:m=>!me(m).cardHand.includes(TUTORIAL_CARD)||m.round>5,waiting:'J’attends que tu la joues…'},
 {id:'cotes',day:5,plan:5,tab:'voyage',target:['hex:next','.dock-main'],title:'Les 3 côtes',text:m=>`Trace les <b>3 cases côtières</b> puis <b>Athènes</b>, et roule ! Le compteur de ta carte passe à 1/3, 2/3, 3/3.`,wait:m=>me(m).completed||m.done,waiting:'J’attends ton arrivée…'},
 {id:'bravo',day:5,center:true,final:true,title:'Bravo ! Tu sais jouer.',text:m=>`Voyage réussi : tu as <b>${me(m).points} points</b> d'aventure. Une partie normale se termine à 35 points, 3 voyages ou 40 jours. Tu peux continuer cette partie avec un nouveau voyage (météo et cartes allumées), ou revenir au menu.`}
];

export const currentStep=m=>tutorialOn(m)?STEPS[m.tutorial.step]||null:null;
// Avance tant que l'étape en cours est déjà faite ; renvoie les effets à appliquer par l'écran (« meteo », « card »).
export function tutorialTick(m,ui){const effects=[];if(!tutorialOn(m))return effects;
 for(let guard=0;guard<STEPS.length;guard++){const s=STEPS[m.tutorial.step];if(!s)break;
  if(s.wait&&s.wait(m,ui)){m.tutorial.step++;const n=STEPS[m.tutorial.step];if(n)enterStep(m,n,effects);continue;}
  if(!s.wait&&!s.center&&m.round>s.day&&!s.final){m.tutorial.step++;const n=STEPS[m.tutorial.step];if(n)enterStep(m,n,effects);continue;}
  break;}
 return effects;}
function enterStep(m,s,effects){
 if(s.tab)effects.push('tab:'+s.tab+(s.sheet?':open':''));
 if(s.enter==='meteo'){m.forecast=true;effects.push('meteo');}
 if(s.enter==='card'){const p=me(m);if(!p.cardHand.includes(TUTORIAL_CARD)){m.eventDeck=(m.eventDeck||[]).filter(id=>id!==TUTORIAL_CARD);p.cardHand.push(TUTORIAL_CARD);}effects.push('card');}
}
// « Compris » sur une bulle sans attente.
export function tutorialNext(m,ui){if(!tutorialOn(m))return [];const s=currentStep(m);if(!s||s.wait)return [];const effects=[];m.tutorial.step++;const n=STEPS[m.tutorial.step];if(n)enterStep(m,n,effects);return [...effects,...tutorialTick(m,ui)];}
// Fin du guide (passé ou terminé) : la partie continue normalement.
export function endTutorial(m){if(!m?.tutorial)return;m.tutorial.active=false;m.tutorial.cardsOff=false;m.forecast=true;}
// Cases du chemin conseillé encore à faire (à partir du jour en cours).
export function guidePath(m){if(!tutorialOn(m))return [];const p=me(m),days=Object.keys(TUTORIAL_PLAN).map(Number).filter(d=>d>=m.round);const keys=days.flatMap(d=>TUTORIAL_PLAN[d]);const i=keys.indexOf(p.pos);return [p.pos,...(i>=0?keys.slice(i+1):keys)];}
// Prochaine case à cliquer selon le chemin conseillé et l'étape déjà tracée.
export function nextGuideKey(m,route){const path=guidePath(m).slice(1),last=route.at(-1);if(!last)return path[0]||'';const i=path.indexOf(last);return i>=0?path[i+1]||'':'';}
