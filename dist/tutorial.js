// Partie guidée « Apprendre à jouer » : une vraie petite partie solo, déjà préparée.
// Gravel avec tente, carte Voyage « Premier voyage : vers la mer Égée » (Budapest → Athènes), 5 jours, mode Immersion (niveau Voyage).
// Le guide montre une chose à la fois et attend que le joueur la fasse.
// Aucune règle du jeu n'est changée : seuls la météo et les cartes Événement sont allumées en cours de route.
import * as S from './simulator.js';
import {CLASSIC,clone,energyCap} from './rules.js';
import {TUTORIAL_VOYAGE,TUTORIAL_VOYAGE_2} from './voyages.js';

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
 // Guide 1 (19 octobre) : vrai mode Immersion, niveau Voyage ; scène et nuits préparées (voir simulator.js, « m.tutorial »).
 rules.immersion={...(rules.immersion||{}),enabled:true,level:'voyage',beta:false,ultra:false};
 const m=S.createMatch([{name:'Toi',bike:'gravel',voyage:TUTORIAL_VOYAGE.id,items:['tente']}],'plateau',rules,TUTORIAL_SEED,customCards,eventEdits);
 // Cartes et météo coupées au début : on remet la main de départ dans la pioche.
 const p=m.players[0],back=[...p.cardHand,...(m.soloEventQueue||[]),...(m.pendingAttack?[m.pendingAttack.cardId]:[])];
 p.cardHand=[];m.soloEventQueue=[];m.pendingAttack=null;m.eventDeck=[...back,...(m.eventDeck||[])];
 m.history=(m.history||[]).filter(h=>h.kind!=='card-solo');p.log=(p.log||[]).filter(l=>!/événement solo/.test(l));
 m.forecast=false;m.seed=TUTORIAL_SEED;// météo du guide : beau temps sur le trajet
 // Un seul lieu caché, sur le chemin du jour 2.
 if(m.board[TUTORIAL_LANDMARK])m.landmarks={[TUTORIAL_LANDMARK]:{value:2,name:'Vieux pont de pierre',found:''}};
 m.tutorial={step:0,cardsOff:true,active:true,guide:1,scene:{day:2,step:3,id:'im-enfants',done:false},calmNights:true};m.mapChoice='';m.mapName='Europe standard';
 return m;
}

export const tutorialOn=m=>Boolean(m?.tutorial?.active);
// Le guide 2 (mode Original et ses cartes) arrive dans une prochaine mise à jour.
export const guideTwoReady=true;
const me=m=>m.players[0];
const at=(m,name)=>m.board[me(m).pos]?.name===name;
const rolled=(m,day)=>m.round===day&&m.moved>0;

// Chaque étape : où pointe la bulle (sélecteurs CSS, le premier présent gagne, ou « hex: » pour une case),
// le texte, et ce que le guide attend (wait). Sans wait, la bulle a un bouton « Compris ».
// Petites images pour les bulles (mêmes couleurs que la carte).
const HEXES=`<span class="tuto-hexes">${[['#7fb05a','1','Plaine'],['#e6c779','1','Côte'],['#c19a63','2','Moy. montagne'],['#8d8d8d','3','Montagne'],['#6f6f6f','3','Col'],['#c8483a','0','Ville']].map(([c,n,l])=>`<span><i style="background:${c}">${n}</i>${l}</span>`).join('')}</span>`;
const NIGHTS=`<table class="tuto-table"><tr><th></th><th>Prix</th><th>⚡</th><th>Fatigue</th><th>La nuit</th></tr><tr><td>⛺ Bivouac</td><td>gratuit, tente</td><td>+1</td><td>=</td><td>la plus risquée</td></tr><tr><td>🏕 Camping</td><td>1 pièce</td><td>+2</td><td>−1</td><td>souvent calme</td></tr><tr><td>🏨 Hôtel</td><td>3 pièces, ville</td><td>+3</td><td>−2</td><td>presque toujours calme</td></tr><tr><td>🚪 Demander</td><td>gratuit</td><td>+2</td><td>selon l’accueil</td><td>accueil, jardin ou refus</td></tr></table>`;
const FAT=`<table class="tuto-table"><tr><th>Fatigue</th><th>⚡ max</th><th>Ce qui change</th></tr><tr><td>0 En forme</td><td>10</td><td>peu de galères</td></tr><tr><td>1 Un peu las</td><td>9</td><td>imprévus de la route</td></tr><tr><td>2 Fatigué</td><td>8</td><td>chutes, erreurs d’itinéraire</td></tr><tr><td>3 Épuisé</td><td>7</td><td>repas −1, paris plus durs</td></tr><tr><td>4 À bout</td><td>6</td><td>1 case de moins par jour</td></tr><tr><td>5 Fourbu</td><td>5</td><td>repos forcé demain</td></tr></table>`;
const fatName=m=>['En forme','Un peu las','Fatigué','Épuisé','À bout','Fourbu'][Math.min(5,me(m).fatigue||0)];
// En ville : la fenêtre a été ouverte puis fermée → les bulles des boutiques se passent toutes seules.
const townDone=ui=>Boolean(ui?.townOpened&&!ui?.town);

// Chaque étape : où pointe la bulle (sélecteurs CSS, le premier présent gagne, ou « hex: » pour une case),
// le texte, et ce que le guide attend (wait). Sans wait, la bulle a un bouton « Compris ».
// town:true : la bulle s'affiche par-dessus la fenêtre de la ville.
// Guide 1 réécrit le 19 octobre (annotations de Fi, planche « Les deux guides ») : vrai mode Immersion, niveau Voyage.
export const STEPS=[
 {id:'bienvenue',day:1,center:true,title:'Bienvenue !',text:m=>`<b>Le but du jeu</b> : tu traverses l'Europe à vélo. Chaque <b>carte Voyage</b> te donne une ville d'arrivée et des terrains à traverser. Réussir un voyage rapporte des <b>points d'aventure</b> ; les cols mythiques et les lieux cachés aussi. La partie s'arrête à 35 points, 3 voyages ou 40 jours : le plus de points gagne.<br><br>Je te guide <b>5 jours</b>, de <b>Budapest à Athènes</b>. Je te montre une chose à la fois, et j'attends que tu la fasses.`,next:'C’est parti'},
 {id:'tour',day:1,center:true,title:'Une journée, c’est un tour',text:m=>`Chaque jour : <b>1</b> tu traces ton étape · <b>2</b> tu roules · <b>3</b> tu manges, tu achètes · <b>4</b> tu choisis où dormir. <b>Dormir termine la journée.</b> À plusieurs, chacun joue sa journée à son tour.<br><br>Ton <b>énergie ⚡</b> te fait avancer, la <b>fatigue</b> monte de jour en jour, la <b>nuit</b> te repose.`},
 {id:'carte',day:1,tab:'voyage',sheet:true,target:['.fiche-voyage','.objective','[data-action="sheet-tab-voyage"]'],title:'Ta carte Voyage',text:m=>`Va à <b>Athènes</b> en passant par <b>3 villes</b>, <b>1 montagne</b> et <b>3 côtes</b>. Les compteurs se cochent tout seuls.<br><small>Avec tous les objectifs : <b>8 points</b> ; sans : <b>3 points</b>.</small>`},
 {id:'chemin',day:1,target:['.map-wrap'],title:'Le chemin conseillé',text:m=>`Les <b>pointillés orange</b> montrent le chemin le plus simple qui remplit tous les objectifs. Tu peux t'en écarter, mais suis-les pour ce premier voyage.`},
 {id:'energie',day:1,target:['.imm-band','.fiche-energy-box','.stats .stat:first-child'],title:'L’énergie',text:m=>`Chaque case coûte de l'énergie selon son terrain :${HEXES}Tu as <b>${me(m).energy} ⚡</b> (${energyCap(m,me(m))} au maximum).`},
 {id:'tracer',day:1,plan:1,tab:'journee',target:['hex:next'],title:'Tracer ton étape',text:m=>`Clique la case <b>entourée d'orange</b>, puis la suivante, jusqu'à <b>Belgrade</b> (4 cases). Ton Gravel fait jusqu'à 5 cases par jour.`,wait:(m,ui)=>ui.route.at(-1)==='city-Belgrade'||m.moved>0,waiting:'J’attends tes clics…'},
 {id:'rouler',day:1,target:['.dock-main'],title:'Rouler',text:m=>`« <b>Rouler</b> » fait avancer ton cycliste sur les cases tracées. Tant qu'il te reste des cases (les ronds de « Route du jour ») et de l'énergie, tu peux tracer et rouler <b>encore</b>, autant de fois que tu veux, avant de finir ta journée.`,wait:m=>m.moved>0||m.round>1,waiting:'J’attends que tu roules…'},
 {id:'ville-entree',day:1,town:true,target:['.tw-shop[data-shop="velo"]'],title:'Bienvenue à Belgrade !',text:m=>`La ville s'ouvre. Clique une boutique : ton cycliste y entre. Commence par le <b>magasin de vélo</b>.`,wait:(m,ui)=>ui.view==='velo'||townDone(ui)||m.round>1,waiting:'J’attends que tu entres…'},
 {id:'ville-velo',day:1,town:true,target:['[data-action="market-back"]','.tw-shop[data-shop="superette"]'],title:'Le magasin de vélo',text:m=>`Ici tu achètes du <b>matériel</b> : tente, réchaud, GPS, kit de réparation, trousse… Chaque objet coûte des pièces et prend des places dans tes sacoches. Ressors sur la place, puis va à la <b>supérette</b>.`,wait:(m,ui)=>ui.view==='superette'||townDone(ui)||m.round>1,waiting:'Direction la supérette…'},
 {id:'ville-superette',day:1,town:true,target:['[data-action="market-back"]','.tw-shop[data-shop="resto"]'],title:'La supérette',text:m=>`Les <b>provisions</b> : 2 repas pour 1 pièce. Tu les manges plus tard, n'importe où. Ton Gravel porte <b>2 repas</b> au plus. Ensuite, le <b>restaurant</b>.`,wait:(m,ui)=>ui.view==='resto'||townDone(ui)||m.round>1,waiting:'Direction le restaurant…'},
 {id:'ville-resto',day:1,town:true,target:['[data-action="market-back"]','.tw-shop[data-shop="hotel"]'],title:'Le restaurant',text:m=>`Un repas sur place : <b>+4 ⚡ pour 1 pièce</b>. Il ne prend pas tes provisions. Dernière visite : l'<b>hôtel</b>.`,wait:(m,ui)=>ui.view==='hotel'||townDone(ui)||m.round>1,waiting:'Direction l’hôtel…'},
 {id:'ville-hotel',day:1,town:true,target:['[data-action="market-close"]'],title:'L’hôtel',text:m=>`Dormir ici : <b>3 pièces</b>, <b>+3 ⚡</b> et la fatigue baisse de 2. C'est la nuit la plus sûre. Tu choisiras où dormir ce soir.<br><b>Ferme la ville</b> (« Continuer ma route ») pour finir ta journée.`,wait:(m,ui)=>townDone(ui)||m.round>1,waiting:'J’attends que tu fermes la ville…'},
 {id:'ville',day:1,tab:'voyage',sheet:true,target:['.fiche-voyage li:first-child','.objective'],title:'Première ville !',text:m=>`Belgrade compte pour ton objectif : <b>1 ville sur 3</b>. Regarde ta carte Voyage.`},
 {id:'manger',day:1,tab:'journee',target:['.dock-icons [data-action="eat-menu"]','[data-action="eat-menu"]','[data-action="eat"]'],title:'Manger',text:m=>`Il te reste <b>${me(m).energy} ⚡</b>. Clique <b>🍎 Manger</b> et prends un <b>repas froid</b> (+2 ⚡) dans tes sacoches. Avec un réchaud, ce serait un <b>repas chaud</b> (+3 ⚡). Un repas par jour.`,wait:m=>m.ate>0||m.round>1,waiting:'J’attends que tu manges…'},
 {id:'finir',day:1,wide:true,target:['.modal [data-action="rest-hotel"]','[data-action="night-open"]','.dock-main'],title:'Finir ta journée',text:m=>`Il te reste peut-être une case : tu n'es pas obligé de la faire. Clique <b>« Finir ma journée »</b> et choisis où dormir :${NIGHTS}En Immersion, <b>chaque nuit est un petit pari</b> : nuit calme, galère ou belle surprise. Ce soir, je te conseille l'<b>hôtel</b> ou le <b>camping</b>.`,wait:m=>m.round>1,waiting:'J’attends la fin de ta journée…'},
 {id:'meteo',day:2,target:['.meteo-modal .zone-map','.meteo-modal'],title:'La météo annoncée',text:m=>`Le bulletin donne le temps <b>zone par zone</b> ; ta zone est entourée. Exemples :<br>💨 <b>vent de face</b> : +1 ⚡ sur la 1ʳᵉ case · 🌧 <b>pluie</b> : +1 ⚡ hors route · ⛈ <b>orage</b> : 3 cases au plus · ❄ <b>neige</b> : +1 ⚡ en montagne.<br><small>Sous la pluie, le bivouac devient risqué. Le bulletin est toujours sur le bouton météo de la carte.</small>`,enter:'meteo'},
 {id:'resume',day:2,target:['.dock-hint','.dock-center'],title:'Ta journée en un coup d’œil',text:m=>`Ce cadre résume ta journée : « <b>Trace ton étape · ${Math.max(0,S.distance(m)-m.moved)} cases · ${me(m).energy} ⚡</b> » = les cases qu'il te reste aujourd'hui et ton énergie. Dessous, les <b>malus du jour</b> (par exemple « Sans GPS : 3 cases max hors route » ou « ⛈ orage : 3 cases maximum »). Les bonus s'y affichent aussi.`},
 {id:'petitdej',day:2,tab:'journee',sheet:true,target:['[data-action="town-open"]','.dock-icons [data-action="eat-menu"]'],title:'Avant de partir',text:m=>`Tu es encore en ville : tu peux <b>rouvrir la ville</b> (« 🏙️ Belgrade ») ou cliquer <b>🍎 Manger</b>. On achète en ville, mais on <b>mange partout</b> tant qu'il reste des repas dans les sacoches : repas froid +2 ⚡, ou repas chaud +3 ⚡ avec un <b>réchaud</b>. Un repas par jour.`},
 {id:'jeton',day:2,target:['hex:'+TUTORIAL_LANDMARK],title:'Un lieu caché « ? »',text:m=>`Ce jeton cache un lieu remarquable. Le premier cycliste qui passe dessus gagne <b>1 à 3 points</b> d'aventure. Il est sur ton chemin !`},
 {id:'tracer2',day:2,plan:2,target:['hex:next','.dock-main'],title:'Hors route',text:m=>`Pas de route directe vers Sofia : tu coupes à travers champs. <b>Hors route et sans GPS, ta journée est limitée à 3 cases.</b> Trace les 3 cases entourées, puis <b>Rouler</b>.`,wait:m=>rolled(m,2)||m.round>2,waiting:'J’attends que tu roules…'},
 {id:'scene',day:2,target:['.modal [data-action^="enc-"]','.modal'],title:'Une scène en route',text:m=>`En Immersion, une <b>scène</b> peut s'ouvrir quand tu entres sur une case : une rencontre, une galère ou une belle surprise. Lis les choix, puis décide. Certains choix sont des <b>paris</b> (« ça marche 2 sur 3 ») : tu connais le risque, pas le résultat.`,wait:m=>m.round>2||(m.phase!=='encounter'&&Boolean(m.tutorial?.scene?.done)),waiting:'J’attends ton choix…'},
 {id:'campagne',day:2,target:['.modal [data-action="rest-bivouac"]','[data-action="night-open"]','.dock-main'],title:'Pas de ville ce soir',text:m=>`${me(m).points?`Tu as déjà <b>${me(m).points} points</b> d'aventure ! `:''}Pas de magasin ici. Ce soir : <b>bivouac</b> sous ta tente (gratuit) ou <b>demander l'hospitalité</b>. Finis ta journée et choisis où dormir.`,wait:m=>m.round>2,waiting:'J’attends la fin de ta journée…'},
 {id:'fatigue',day:3,wide:true,target:['.imm-fatl','.imm-band','.fiche-energy-box'],title:'La fatigue',text:m=>`Chaque jour où tu roules : <b>+1</b> (+1 de plus si tu passes un col ou fais 5 cases). Chaque niveau enlève <b>1 ⚡</b> à ton énergie maximale :${FAT}<b>Pour la faire baisser</b> : camping −1, hôtel −2, et une <b>journée sans rouler</b> suivie d'une nuit : −3 (−4 en ville). Le bivouac ne la baisse pas.<br><small>Tu es « ${fatName(m)} » (${me(m).fatigue||0} sur 5).</small>`},
 {id:'montagne',day:3,plan:3,target:['hex:next','.dock-main'],title:'Sofia et la montagne',text:m=>`Aujourd'hui : <b>Sofia</b> (2ᵉ ville), la <b>montagne</b> (3 ⚡, ton objectif montagne), puis <b>Thessalonique</b>. Encore hors route : 3 cases, juste ce qu'il faut.<br><small>Les <b>cols mythiques</b> (drapeau sur la carte) comptent aussi comme montagne et rapportent <b>+2 points</b> d'aventure au premier passage, <b>+3</b> de plus quand tu en as franchi 3.</small>`,wait:m=>rolled(m,3)||m.round>3,waiting:'J’attends que tu roules…'},
 {id:'objectifs',day:3,tab:'journee',target:['.dock-icons [data-action="eat-menu"]','[data-action="night-open"]','.dock-main'],title:'Presque !',text:m=>`Montagne ✓ et <b>3 villes</b> ✓ ! Il ne reste que les <b>3 côtes</b>. Tu es en ville : <b>rachète des provisions</b>, mange, puis finis ta journée.`,wait:m=>m.round>3,waiting:'J’attends la fin de ta journée…'},
 {id:'repos',day:4,tab:'journee',sheet:true,target:['.modal [data-action="rest-camping"]','[data-action="night-open"]','.dock-main'],title:'Un jour de repos',text:m=>`${(me(m).fatigue||0)>=2?`Tu es « <b>${fatName(m)}</b> » (${me(m).fatigue} sur 5).`:'Tes bonnes nuits t’ont gardé en forme !'} Aujourd'hui, essaie une <b>journée sans rouler</b> : clique « Dormir » tout de suite et choisis le <b>camping</b> (ou l'hôtel si tu as 3 pièces). Comme vu hier, la nuit rend alors <b>deux fois plus d'énergie</b> et baisse la fatigue de <b>4</b> en ville.`,wait:m=>m.round>4,waiting:'J’attends que tu te reposes…'},
 {id:'cotes',day:5,plan:5,tab:'voyage',target:['hex:next','.dock-main'],title:'Les 3 côtes',text:m=>`Trace les <b>3 cases côtières</b> puis <b>Athènes</b>, et roule ! Le compteur de ta carte passe à 1/3, 2/3, 3/3.`,wait:m=>me(m).completed||m.done,waiting:'J’attends ton arrivée…'},
 {id:'bravo',day:5,center:true,final:true,title:'Bravo ! Tu sais jouer.',text:m=>`Voyage réussi : tu as <b>${me(m).points} points</b> d'aventure.<br><br>Pour tout savoir sur une règle, ouvre le <b>📖 WikiBike</b> en bas de ta fiche : c'est le dictionnaire du jeu. Tu veux jouer à plusieurs avec des cartes ? Lance le guide <b>« Le mode Original et ses cartes »</b>.`}
];

export const steps=m=>m?.tutorial?.guide===2?STEPS2:STEPS;
export const currentStep=m=>tutorialOn(m)?steps(m)[m.tutorial.step]||null:null;
// Avance tant que l'étape en cours est déjà faite ; renvoie les effets à appliquer par l'écran (« meteo », « card »).
export function tutorialTick(m,ui){const effects=[];if(!tutorialOn(m))return effects;
 const L=steps(m);
 for(let guard=0;guard<L.length;guard++){const s=L[m.tutorial.step];if(!s)break;
  if(s.wait&&s.wait(m,ui)){m.tutorial.step++;const n=L[m.tutorial.step];if(n)enterStep(m,n,effects);continue;}
  if(!s.wait&&!s.center&&m.round>s.day&&!s.final){m.tutorial.step++;const n=L[m.tutorial.step];if(n)enterStep(m,n,effects);continue;}
  break;}
 return effects;}
function enterStep(m,s,effects){
 if(s.tab)effects.push('tab:'+s.tab+(s.sheet?':open':''));
 if(s.enter==='meteo'){m.forecast=true;effects.push('meteo');}
 if(s.enter==='card'){const p=me(m);if(!p.cardHand.includes(TUTORIAL_CARD)){m.eventDeck=(m.eventDeck||[]).filter(id=>id!==TUTORIAL_CARD);p.cardHand.push(TUTORIAL_CARD);}effects.push('card');}
}
// « Compris » sur une bulle sans attente.
export function tutorialNext(m,ui){if(!tutorialOn(m))return [];const s=currentStep(m);if(!s||s.wait)return [];const effects=[];m.tutorial.step++;const n=steps(m)[m.tutorial.step];if(n)enterStep(m,n,effects);return [...effects,...tutorialTick(m,ui)];}
// Fin du guide (passé ou terminé) : la partie continue normalement.
export function endTutorial(m){if(!m?.tutorial)return;m.tutorial.active=false;m.tutorial.cardsOff=false;m.forecast=true;}
// Cases du chemin conseillé encore à faire (à partir du jour en cours).
export function guidePath(m){if(!tutorialOn(m))return [];const PLAN=m.tutorial.guide===2?PLAN2:TUTORIAL_PLAN;const p=me(m),days=Object.keys(PLAN).map(Number).filter(d=>d>=m.round);const keys=days.flatMap(d=>PLAN[d]);const i=keys.indexOf(p.pos);return [p.pos,...(i>=0?keys.slice(i+1):keys)];}
// Prochaine case à cliquer selon le chemin conseillé et l'étape déjà tracée.
export function nextGuideKey(m,route){const path=guidePath(m).slice(1),last=route.at(-1);if(!last)return path[0]||'';const i=path.indexOf(last);return i>=0?path[i+1]||'':'';}


// ================= Guide 2 · « Le mode Original et ses cartes » (19 octobre, planche « Les deux guides ») =================
// 3 jours, Lyon → Venise par le Mont Ventoux et le Galibier, contre Max, un cycliste joué par l'ordinateur (app.js : tutoBot).
// Mode Original, sans bulletin météo (les cartes climatiques restent dans la pioche). Mains et pioche préparées à l'avance.
export const PLAN2={1:['hex-7-33'],2:['hex-8-33','hex-9-33','hex-10-33','city-Milan'],3:['hex-11-32','hex-12-32','city-Venise']};
export const MAX_PLAN={1:['hex-7-33'],2:['hex-8-33','hex-9-33','hex-10-33','city-Milan'],3:['hex-11-32','hex-12-32','city-Venise']};
const HAND2={toi:['evt-03','evt-15','evt-21'],max:['evt-11','evt-02']};
// Pioches, dans l'ordre : début du tour de Max (j1), toi (j2), Max (j2), toi (j3), Max (j3).
const DRAWS2=[['evt-06','evt-09'],['evt-07','evt-38'],['evt-08','evt-10'],['evt-34','evt-04'],['evt-05','evt-24']];
export function createTutorialMatch2(customCards=[],eventEdits=[]){
 const rules=clone(CLASSIC);rules.weather={...(rules.weather||{}),forecast:false};rules.encounters={...(rules.encounters||{}),enabled:false};rules.immersion={...(rules.immersion||{}),enabled:false,beta:false,ultra:false};
 const m=S.createMatch([{name:'Toi',bike:'gravel',voyage:TUTORIAL_VOYAGE_2.id,items:['tente','kit']},{name:'Max',bike:'gravel',voyage:TUTORIAL_VOYAGE_2.id,items:['tente']}],'plateau',rules,TUTORIAL_SEED,customCards,eventEdits);
 const [p,q]=m.players;q.bot=true;
 const used=new Set([...HAND2.toi,...HAND2.max,...DRAWS2.flat()]);
 const rest=(m.eventCardIds||[]).filter(id=>!used.has(id));
 p.cardHand=[...HAND2.toi];q.cardHand=[...HAND2.max];
 // la pioche se tire par la fin : on empile les tirages prévus à l'envers au-dessus du reste
 m.eventDeck=[...rest,...DRAWS2.flat().reverse()];m.eventDiscard=[];
 m.landmarks={};m.forecast=false;m.seed=TUTORIAL_SEED;
 m.tutorial={step:0,cardsOff:false,active:true,guide:2};m.mapChoice='';m.mapName='Europe standard';
 return m;
}
const you=m=>m.players[0];
const yourTurn=m=>m.activeIndex===0;
const rolled2=(m,day)=>m.round===day&&yourTurn(m)&&m.moved>0;
const hasCard=(m,id)=>you(m).cardHand.includes(id);
const DIFF=`<table class="tuto-table"><tr><th></th><th>Immersion</th><th>Original</th></tr><tr><td>Imprévus</td><td>scènes en route</td><td><b>cartes Événement</b></td></tr><tr><td>Nuits</td><td>un pari</td><td><b>sans surprise</b></td></tr><tr><td>Fatigue</td><td>6 niveaux, −1 ⚡ max</td><td><b>3 niveaux, −2 ⚡ max</b>, fourbu à 3</td></tr><tr><td>Repos</td><td>camping −1, hôtel −2</td><td>camping et hôtel l’<b>effacent</b></td></tr><tr><td>Météo</td><td>bulletin</td><td><b>cartes climatiques</b></td></tr></table>`;
const NIGHTS2=`<table class="tuto-table"><tr><th></th><th>Prix</th><th>⚡</th><th>Fatigue</th></tr><tr><td>⛺ Bivouac</td><td>gratuit, tente</td><td>+1</td><td>gardée</td></tr><tr><td>🏕 Camping</td><td>1 pièce</td><td>+2</td><td>effacée</td></tr><tr><td>🏨 Hôtel</td><td>3 pièces, ville</td><td>+3</td><td>effacée</td></tr></table>`;
export const STEPS2=[
 {id:'g2-bienvenue',day:1,center:true,wide:true,title:'Le mode Original et ses cartes',text:m=>`Tu connais les bases. Ce guide montre ce qui change en mode <b>Original</b>, celui qui se joue <b>à plusieurs, avec des cartes</b>. Tu joues contre <b>Max</b>, un cycliste joué par l'ordinateur : il va poser ses cartes pour te montrer comment elles marchent.${DIFF}`,next:'C’est parti'},
 {id:'g2-main',day:1,target:['.dock-icons [data-action="cards"]','[data-action="cards"]'],title:'Ta main',text:m=>`Tu as jusqu'à <b>3 cartes</b> :<br>🟢 <b>positives</b> : pour toi, une par tour ;<br>🔴 <b>négatives</b> : contre un autre cycliste (ici Max) ;<br>🔵 <b>climatiques</b> : sur le trajet d'un autre, quand il l'annonce ;<br>🟡 <b>bonus permanents</b> : posés devant toi, 2 au plus.`},
 {id:'g2-positive',day:1,target:['.modal [data-action^="event-play-"]','.dock-icons [data-action="cards"]','[data-action="cards"]'],title:'Jouer une positive',text:m=>`Ouvre tes <b>cartes</b> et joue <b>« Belle descente »</b> : +2 ⚡ tout de suite. Une seule carte par tour.`,wait:m=>!hasCard(m,'evt-03')||m.round>1,waiting:'J’attends que tu la joues…'},
 {id:'g2-col',day:1,plan:1,tab:'voyage',target:['hex:next','.dock-main'],title:'Le Mont Ventoux',text:m=>`Ta carte Voyage : <b>Venise</b>, par <b>Milan</b> et <b>2 cols mythiques</b>. Trace le <b>Mont Ventoux</b> (3 ⚡), puis <b>Rouler</b>. Premier passage sur un col : <b>+2 points</b> d'aventure.`,wait:m=>rolled2(m,1)||m.round>1,waiting:'J’attends que tu roules…'},
 {id:'g2-nuit',day:1,wide:true,target:['.modal [data-action="rest-camping"]','[data-action="night-open"]','.dock-main'],title:'Des nuits sans surprise',text:m=>`En Original, la fatigue monte de <b>1</b> par jour de route, <b>+1</b> le jour d'un col. Chaque niveau enlève <b>2 ⚡</b> à ton maximum ; au niveau 3 tu es fourbu. Les nuits sont <b>sans surprise</b> :${NIGHTS2}Choisis le <b>camping</b> : il <b>efface</b> ta fatigue.`,wait:m=>!yourTurn(m)||m.round>1,waiting:'J’attends que tu dormes…'},
 {id:'g2-max',day:1,target:['.modal [data-action^="event-climateplay-"]','.modal [data-action="event-pass"]'],title:'Au tour de Max',text:m=>`Max joue sa journée. Quand il <b>annonce son trajet</b>, tu peux lui jouer une carte <b>climatique</b> : choisis <b>« Vent de face »</b> (+2 ⚡ sur son trajet).`,wait:m=>!hasCard(m,'evt-21')||m.round>1,waiting:'Max prépare son trajet…'},
 {id:'g2-max2',day:1,center:true,title:'Max t’a joué une carte',text:m=>`Max a aussi joué une <b>carte négative</b> contre toi. Elle reste face cachée : tu la <b>découvriras au début de ta journée</b>. C'est la règle du mode Original : on attaque pendant son tour, l'autre répond au début du sien.`,wait:m=>yourTurn(m)&&m.round>1,waiting:'Max finit sa journée…'},
 {id:'g2-pioche',day:2,target:['.modal [data-action="choose-0"]','.modal'],title:'La pioche du matin',text:m=>`Au début de ta journée : <b>pioche 2 cartes, garde-en 1</b>. L'autre part à la défausse. Garde <b>« Coup de pouce »</b> : il annule une carte jouée contre toi.`,wait:m=>m.round>=2&&yourTurn(m)&&m.phase!=='card-choice',waiting:'J’attends ton choix…'},
 {id:'g2-crevaison',day:2,target:['.modal [data-action="event-attack-defend"]','.modal [data-action="event-attack-accept"]','.modal'],title:'Une carte contre toi',text:m=>`Voici la carte de Max : une <b>crevaison</b>. Deux réponses : <b>« Coup de pouce »</b> l'annule, ou tu la subis et ton <b>kit de réparation</b> répare (sans kit : retour à la dernière ville).`,wait:m=>(m.round>=2&&yourTurn(m)&&!m.pendingAttack&&m.phase!=='card-choice')||m.round>2,waiting:'J’attends ta réponse…'},
 {id:'g2-galibier',day:2,plan:2,target:['hex:next','.dock-main'],title:'Le Galibier, puis Milan',text:m=>`Trace le <b>Col du Galibier</b> (+2 points), puis la côte jusqu'à <b>Milan</b>. Après <b>3 cols</b> franchis, tu gagnerais encore +3.`,wait:m=>rolled2(m,2)||m.round>2,waiting:'J’attends que tu roules…'},
 {id:'g2-attaque',day:2,target:['.modal [data-action^="event-target-"]','.modal [data-action="event-confirm-attack"]','.modal [data-action^="event-play-"]','.dock-icons [data-action="cards"]'],title:'À ton tour d’attaquer',text:m=>`Joue <b>« Erreur d'itinéraire »</b> contre <b>Max</b> : il la découvrira au début de sa journée. Une négative par tour.`,wait:m=>!hasCard(m,'evt-15')||m.round>2,waiting:'J’attends ta carte…'},
 {id:'g2-nuit2',day:2,target:['.modal [data-action="rest-hotel"]','[data-action="night-open"]','.dock-main'],title:'Une nuit à Milan',text:m=>`Milan compte pour ton objectif. Dors à l'<b>hôtel</b> (3 pièces, +3 ⚡, fatigue effacée) ou au camping.`,wait:m=>!yourTurn(m)||m.round>2,waiting:'J’attends que tu dormes…'},
 {id:'g2-max3',day:2,center:true,title:'Max découvre ta carte',text:m=>`Au début de sa journée, Max découvre ton « Erreur d'itinéraire » et la subit. Il pioche aussi 2 cartes et en garde 1.`,wait:m=>yourTurn(m)&&m.round>2,waiting:'Max joue sa journée…'},
 {id:'g2-pioche2',day:3,target:['.modal [data-action="choose-0"]','.modal'],title:'Un bonus permanent',text:m=>`Garde <b>« Panneau solaire »</b> : c'est un <b>bonus permanent</b> (carte jaune). Une fois posé devant toi, il agit tous les jours : +1 ⚡ à la fin de chaque tour.`,wait:m=>m.round>=3&&yourTurn(m)&&m.phase!=='card-choice',waiting:'J’attends ton choix…'},
 {id:'g2-poser',day:3,target:['.modal [data-action^="event-play-"]','.dock-icons [data-action="cards"]','[data-action="cards"]'],title:'Poser le bonus',text:m=>`Ouvre tes cartes et joue <b>« Panneau solaire »</b> : il reste posé devant toi. Tu peux en avoir <b>2</b> ; au-delà, il faut en remplacer un.`,wait:m=>(you(m).bonusCards||[]).length>0||m.round>3,waiting:'J’attends que tu le poses…'},
 {id:'g2-venise',day:3,plan:3,tab:'voyage',target:['hex:next','.dock-main'],title:'Venise !',text:m=>`Dernière étape : trace jusqu'à <b>Venise</b> et roule.`,wait:m=>you(m).completed||m.done,waiting:'J’attends ton arrivée…'},
 {id:'g2-bravo',day:3,center:true,final:true,title:'Bravo ! Tu connais les deux modes.',text:m=>`Tu as <b>${you(m).points} points</b> d'aventure. En mode Original, chaque soir compte : quelle carte garder, quand attaquer, quand se protéger.<br><br>Le <b>📖 WikiBike</b> détaille chaque carte (catégorie « Modes et événements »).`}
];
